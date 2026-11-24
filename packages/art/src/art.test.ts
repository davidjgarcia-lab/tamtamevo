import { describe, expect, it } from "vitest";
import { compileClip, compileRig, contrast, derivePalette, evaluateFrame } from "@tamtam/rig";
import { chispinClips, chispinEmitters, chispinRig, fireColorAlleles } from "./index";

const REQUIRED_CLIPS = ["idle", "walk", "run", "eat", "pet", "sleep", "celebrate", "train", "bathe", "sad", "hungry", "angry", "attack", "hit"];

describe("Chispín", () => {
  const rig = compileRig(chispinRig);
  const clips = chispinClips.map((c) => compileClip(rig, c));

  it("has the spike clip set and an emitter list per clip", () => {
    expect(chispinClips.map((c) => c.id)).toEqual(REQUIRED_CLIPS);
    for (const id of REQUIRED_CLIPS) expect(chispinEmitters).toHaveProperty(id);
  });

  it("only uses face states that have artwork", () => {
    const drawn = { eyes: new Set<string>(["open"]), mouth: new Set<string>(["smile"]), brows: new Set<string>(["neutral"]), prop: new Set<string>(["none"]) };
    for (const p of chispinRig.parts) p.face?.states.forEach((s) => drawn[p.face!.slot].add(s));
    for (const c of chispinClips) {
      for (const k of c.face?.eyes ?? []) expect(drawn.eyes.has(k.v), `${c.id} eyes "${k.v}"`).toBe(true);
      for (const k of c.face?.mouth ?? []) expect(drawn.mouth.has(k.v), `${c.id} mouth "${k.v}"`).toBe(true);
      for (const k of c.face?.brows ?? []) expect(drawn.brows.has(k.v), `${c.id} brows "${k.v}"`).toBe(true);
      for (const k of c.face?.prop ?? []) expect(drawn.prop.has(k.v), `${c.id} prop "${k.v}"`).toBe(true);
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

  it("keeps the paws on the ground while walking (legs never go below their rest height)", () => {
    const walk = clips.findIndex((c) => c.id === "walk");
    for (const leg of ["legFN", "legFF", "legBN", "legBF"]) {
      const b = rig.boneIds.indexOf(leg);
      for (let t = 0; t < 2; t += 0.02) {
        const f = evaluateFrame(rig, clips, { clip: walk, start: 0, prevClip: -1, prevStart: 0 }, { time: t, vx: 40, seed: 3 });
        expect(f.world[b * 6 + 5]!, leg).toBeLessThanOrEqual(-21);
      }
    }
  });

  it("every colour allele keeps readable line art", () => {
    for (const a of fireColorAlleles) {
      const p = derivePalette(a.genes);
      // Dark-scaled families: the outline must separate from the lit edge of the body (rim/baseLight).
      expect(contrast(p.ink, p.baseLight), a.id).toBeGreaterThan(2.5);
    }
  });
});

import { compileClip as cc2, compileRig as cr2, evaluateFrame as ef2 } from "@tamtam/rig";
import { chispinPaintedRig, CHISPIN_PAINTED } from "./fire/chispinPainted";
import { chispinRig as baseRig, chispinClips as baseClips } from "./fire/chispin";
describe("painted Chispín (from Unity)", () => {
  it("has the same bones in the same order as the vector rig and plays all clips", () => {
    expect(chispinPaintedRig.bones.map((b) => b.id)).toEqual(baseRig.bones.map((b) => b.id));
    const r = cr2(chispinPaintedRig);
    const clips = baseClips.map((c) => cc2(r, c));
    for (let i = 0; i < clips.length; i++) expect(ef2(r, clips, { clip: i, start: 0, prevClip: -1, prevStart: 0 }, { time: 0.3, vx: 0, seed: 1 }).world.every(Number.isFinite)).toBe(true);
  });
  it("skins every vertex with normalised weights", () => {
    expect(CHISPIN_PAINTED.vertices.length).toBe(CHISPIN_PAINTED.weights.length);
    for (const w of CHISPIN_PAINTED.weights) expect(w.reduce((a, [, x]) => a + x, 0)).toBeCloseTo(1, 2);
  });
});
