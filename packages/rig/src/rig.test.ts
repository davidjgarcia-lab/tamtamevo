import { describe, expect, it } from "vitest";
import {
  blinkOpenness,
  clipTime,
  compileClip,
  compileRig,
  contrast,
  derivePalette,
  evalEmitter,
  evaluateFrame,
  hexToOklch,
  oklchToHex,
  RigError,
  sampleTrack,
  switchClip,
  transformPoint,
  worldMatrices,
  samplePose,
  type RigDef,
} from "./index";

const rigDef: RigDef = {
  id: "test",
  bones: [
    { id: "root", parent: null, x: 0, y: 0 },
    { id: "body", parent: "root", x: 0, y: -10 },
    { id: "arm", parent: "body", x: 10, y: 0 },
    { id: "eye", parent: "body", x: 0, y: -5 },
  ],
  parts: [
    { id: "b", bone: "body", d: "M0 0", z: 1 },
    { id: "a", bone: "arm", d: "M0 0", z: 0 },
  ],
  breathBone: "body",
  eyeBones: ["eye"],
  secondary: [{ bone: "arm", driver: "body", lag: 0.1, gain: 1 }],
};

describe("compileRig", () => {
  it("orders parts by z and resolves bones", () => {
    const r = compileRig(rigDef);
    expect(r.parts.map((p) => p.id)).toEqual(["a", "b"]);
    expect(r.parent).toEqual([-1, 0, 1, 1]);
  });

  it("rejects parents declared after their children", () => {
    expect(() =>
      compileRig({
        id: "bad",
        bones: [
          { id: "root", parent: null, x: 0, y: 0 },
          { id: "a", parent: "b", x: 0, y: 0 },
          { id: "b", parent: "root", x: 0, y: 0 },
        ],
        parts: [],
      }),
    ).toThrow(RigError);
  });

  it("rejects unknown bones in clips", () => {
    const r = compileRig(rigDef);
    expect(() => compileClip(r, { id: "c", duration: 1, loop: true, tracks: { nope: { x: [{ t: 0, v: 0 }] } } })).toThrow(
      RigError,
    );
  });
});

describe("sampling", () => {
  it("interpolates keys and clamps outside the range", () => {
    const tr = { t: [0, 1], v: [0, 10], e: [0, 0] };
    expect(sampleTrack(tr, -1)).toBe(0);
    expect(sampleTrack(tr, 0.5)).toBeCloseTo(5);
    expect(sampleTrack(tr, 2)).toBe(10);
  });

  it("step easing holds the previous value", () => {
    const tr = { t: [0, 1], v: [0, 10], e: [4, 4] };
    expect(sampleTrack(tr, 0.99)).toBe(0);
  });

  it("wraps looping clips and clamps one-shots", () => {
    const r = compileRig(rigDef);
    const loop = compileClip(r, { id: "l", duration: 2, loop: true, tracks: {} });
    const once = compileClip(r, { id: "o", duration: 2, loop: false, tracks: {} });
    expect(clipTime(loop, 5)).toBeCloseTo(1);
    expect(clipTime(loop, -0.5)).toBeCloseTo(1.5);
    expect(clipTime(once, 5)).toBe(2);
  });
});

describe("forward kinematics", () => {
  it("composes parent transforms", () => {
    const r = compileRig(rigDef);
    const clip = compileClip(r, { id: "c", duration: 1, loop: true, tracks: { body: { rot: [{ t: 0, v: 90 }] } } });
    const w = worldMatrices(r, samplePose(r, clip, 0));
    // arm sits 10 units to the right of the body; body rotated 90° → arm goes down.
    const [x, y] = transformPoint(w, 2, 0, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    const [tx, ty] = transformPoint(w, 2, 1, 0);
    expect(tx).toBeCloseTo(0);
    expect(ty).toBeCloseTo(1);
  });
});

describe("procedural layers", () => {
  it("blinks briefly and is deterministic", () => {
    let closed = 0;
    const samples = 3800;
    for (let i = 0; i < samples; i++) {
      const v = blinkOpenness(i / 100, 1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      if (v < 0.5) closed++;
    }
    // eyes are closed a small fraction of the time (natural blinking ≈ 2–8 %)
    expect(closed / samples).toBeGreaterThan(0.01);
    expect(closed / samples).toBeLessThan(0.1);
    expect(blinkOpenness(12.34, 7)).toBe(blinkOpenness(12.34, 7));
  });

  it("evaluates the same frame identically and cross-fades smoothly", () => {
    const r = compileRig(rigDef);
    const a = compileClip(r, { id: "a", duration: 1, loop: true, tracks: { body: { x: [{ t: 0, v: 0 }] } } });
    const b = compileClip(r, { id: "b", duration: 1, loop: true, tracks: { body: { x: [{ t: 0, v: 20 }] } } });
    const clips = [a, b];
    const s0 = { clip: 0, start: 0, prevClip: -1, prevStart: 0 };
    const s1 = switchClip(s0, 1, 10);
    const f = (t: number) => evaluateFrame(r, clips, s1, { time: t, vx: 0, seed: 1, fade: 0.5 });
    expect(f(10.2).world).toEqual(f(10.2).world);
    const bodyX = (t: number) => f(t).world[1 * 6 + 4]!;
    expect(bodyX(10)).toBeCloseTo(0);
    expect(bodyX(10.25)).toBeGreaterThan(0);
    expect(bodyX(10.25)).toBeLessThan(20);
    expect(bodyX(11)).toBeCloseTo(20);
    expect(switchClip(s1, 1, 99)).toBe(s1);
  });
});

describe("particles", () => {
  const e = {
    id: "p",
    shape: "ember" as const,
    rate: 10,
    life: 1,
    x: 0,
    y: 0,
    spread: 5,
    vx: [-1, 1] as [number, number],
    vy: [-20, -10] as [number, number],
    gravity: 0,
    size: [1, 2] as [number, number],
    color: "#fff",
  };
  it("keeps about rate × life particles alive", () => {
    expect(evalEmitter(e, 5, 0, Infinity, 1).length).toBeGreaterThanOrEqual(9);
    expect(evalEmitter(e, 5, 0, Infinity, 1).length).toBeLessThanOrEqual(11);
  });
  it("lets live particles finish after the emitter stops", () => {
    expect(evalEmitter(e, 5.5, 0, 5, 1).length).toBeGreaterThan(0);
    expect(evalEmitter(e, 7, 0, 5, 1).length).toBe(0);
  });
  it("is a pure function of time", () => {
    expect(evalEmitter(e, 3.3, 0, Infinity, 2)).toEqual(evalEmitter(e, 3.3, 0, Infinity, 2));
  });
});

describe("palette", () => {
  it("round-trips OKLCH conversion", () => {
    for (const hex of ["#FF6B35", "#2EC4F1", "#5BC85B", "#5A3D8A"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });
  it("derives shades that keep the hue family and contrast with the base", () => {
    const p = derivePalette({ base: "#FF6B35", accent: "#FFB627" });
    expect(hexToOklch(p.baseShade)[0]).toBeLessThan(hexToOklch(p.base)[0]);
    expect(hexToOklch(p.baseLight)[0]).toBeGreaterThan(hexToOklch(p.base)[0]);
    expect(contrast(p.ink, p.base)).toBeGreaterThan(3);
  });
});
