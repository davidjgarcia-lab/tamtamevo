import { describe, expect, it } from "vitest";
import { compileClip, compileRig, contrast, derivePalette, evaluateFrame } from "@tamtam/rig";
import { chispinClips, chispinEmitters, chispinRig, fireColorAlleles } from "./index";

const REQUIRED_CLIPS = ["idle", "walk", "eat", "pet", "sleep"];

describe("Chispín", () => {
  const rig = compileRig(chispinRig);
  const clips = chispinClips.map((c) => compileClip(rig, c));

  it("has the spike clip set and an emitter list per clip", () => {
    expect(chispinClips.map((c) => c.id)).toEqual(REQUIRED_CLIPS);
    for (const id of REQUIRED_CLIPS) expect(chispinEmitters).toHaveProperty(id);
  });

  it("only uses face states that have artwork", () => {
    const drawn = { eyes: new Set<string>(["open"]), mouth: new Set<string>(["smile"]) };
    for (const p of chispinRig.parts) p.face?.states.forEach((s) => drawn[p.face!.slot].add(s));
    for (const c of chispinClips) {
      for (const k of c.face?.eyes ?? []) expect(drawn.eyes.has(k.v), `${c.id} eyes "${k.v}"`).toBe(true);
      for (const k of c.face?.mouth ?? []) expect(drawn.mouth.has(k.v), `${c.id} mouth "${k.v}"`).toBe(true);
    }
  });

  it("produces finite transforms for every clip over time", () => {
    clips.forEach((_, i) => {
      for (let t = 0; t < 6; t += 0.05) {
        const f = evaluateFrame(rig, clips, { clip: i, start: 0, prevClip: -1, prevStart: 0 }, { time: t, vx: 40, seed: 3 });
        expect(f.world.every(Number.isFinite)).toBe(true);
      }
    });
  });

  it("never pushes the feet below their ground contact height", () => {
    const walk = clips.findIndex((c) => c.id === "walk");
    const footL = rig.boneIds.indexOf("footL");
    for (let t = 0; t < 2; t += 0.02) {
      const f = evaluateFrame(rig, clips, { clip: walk, start: 0, prevClip: -1, prevStart: 0 }, { time: t, vx: 40, seed: 3 });
      expect(f.world[footL * 6 + 5]!).toBeLessThanOrEqual(1);
    }
  });

  it("every colour allele keeps readable line art", () => {
    for (const a of fireColorAlleles) {
      const p = derivePalette(a.genes);
      expect(contrast(p.ink, p.base), a.id).toBeGreaterThan(2.5);
    }
  });
});
