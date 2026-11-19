import { compileClip, compileRig, evaluateFrame } from "@tamtam/rig";
import { describe, expect, it } from "vitest";
import { FAMILIES } from "../../../core/src/genetics/families";
import { chispinClips } from "../fire/chispin";
import { FAMILY_COLORS, genomeEmitters, genomeRig, type GenomeLike } from "./build";
import type { Fam } from "./parts";

const FAMS = Object.keys(FAMILY_COLORS) as Fam[];
const EYES = ["slit", "round", "ring", "glow", "twin", "visor"];
const PATS = ["seams", "spots", "stripes", "veins", "rings", "facets", "rivets", "none"];
const g = (f: Fam, v = 0, i = 0): GenomeLike => ({
  parts: { body: f, head: FAMS[(i + 1) % 9]!, legs: FAMS[(i + 2) % 9]!, tail: FAMS[(i + 3) % 9]!, back: FAMS[(i + 4) % 9]! },
  variant: { body: v, head: v, legs: v, tail: v, back: v },
  eyes: EYES[i % EYES.length]!, pattern: PATS[i % PATS.length]!, palette: { base: f, shade: i % 3, accent: FAMS[(i + 5) % 9]! }, mutation: "none",
});

describe("modular evolved forms", () => {
  it("every family part, variant, eye style and pattern compiles and animates with all 14 clips", () => {
    let n = 0;
    for (let i = 0; i < FAMS.length; i++) {
      for (const v of [0, 1]) {
        for (const f of FAMS) {
          const { rig } = genomeRig(g(f, v, i));
          const c = compileRig(rig);
          const clips = chispinClips.map((cl) => compileClip(c, cl));
          for (let k = 0; k < clips.length; k++) {
            const fr = evaluateFrame(c, clips, { clip: k, start: 0, prevClip: -1, prevStart: 0 }, { time: 0.4, vx: 0, seed: 1 });
            expect(fr.world.every(Number.isFinite)).toBe(true);
          }
          n++;
        }
      }
    }
    expect(n).toBe(162);
  });

  it("floating families hover and replace particles by the back family", () => {
    const ghost = { ...g("ghost"), parts: { ...g("ghost").parts, legs: "ghost" as Fam, back: "plant" as Fam } };
    expect(genomeRig(ghost).float).toBe(true);
    expect(genomeEmitters(ghost).idle[0]!.color).toBe(FAMILY_COLORS.plant.particle.color);
  });

  it("colours are the same as the families in @tamtam/core", () => {
    for (const f of FAMS) {
      expect(FAMILY_COLORS[f].bases).toEqual(FAMILIES[f].bases);
      expect(FAMILY_COLORS[f].accent).toBe(FAMILIES[f].accent);
    }
  });
});
