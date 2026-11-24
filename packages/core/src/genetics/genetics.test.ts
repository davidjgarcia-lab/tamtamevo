import { describe, expect, it } from "vitest";
import {
  careProfile, CHISPIN_GENOME, completeGymSession, debugSetNeed, dominantFamily, emptyStageLog, evolve, FAMILY_IDS, familyOdds, genomeSpace, hatch,
  nameNewTamtam, newGame, playerFighter, readyToEvolve, rollEvolution, tick, type CareProfile, type FamilyId, type GameState, type StageLog,
} from "../index";

const T0 = Date.UTC(2026, 10, 20, 9, 0);
const H = 3_600_000;
const prof = (p: Partial<CareProfile>): CareProfile => {
  const base: CareProfile = { care: 0.6, affection: 0.5, hygiene: 0.5, training: 0, fighting: 0, study: 0, play: 0, neglect: 0.4, ...p };
  return { ...base, neglect: 1 - base.care };
};
const tally = (p: CareProfile, n = 400) => {
  const c = Object.fromEntries(FAMILY_IDS.map((f) => [f, 0])) as Record<FamilyId, number>;
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    const r = rollEvolution(CHISPIN_GENOME, p, 1000 + i);
    seen.add(JSON.stringify(r.genome));
    // Count the parts that changed (inherited ones only show the lineage).
    for (const s of ["body", "head", "legs", "tail", "back"] as const) if (r.how[s] !== "inherited") c[r.genome.parts[s]]++;
  }
  return { c, distinct: seen.size };
};
const top = (c: Record<FamilyId, number>, k = 2) => [...FAMILY_IDS].sort((a, b) => c[b] - c[a]).slice(0, k);

describe("genetic evolution", () => {
  it("has far more than 500 possible combinations and real variety", () => {
    expect(genomeSpace()).toBeGreaterThan(500);
    expect(tally(prof({}), 600).distinct).toBeGreaterThan(500);
  });

  it("is deterministic for a seed and differs between seeds", () => {
    const p = prof({ training: 0.8 });
    expect(rollEvolution(CHISPIN_GENOME, p, 42)).toEqual(rollEvolution(CHISPIN_GENOME, p, 42));
    expect(JSON.stringify(rollEvolution(CHISPIN_GENOME, p, 42).genome)).not.toBe(JSON.stringify(rollEvolution(CHISPIN_GENOME, p, 43).genome));
  });

  it("care style steers the families (warrior, sage-clean, neglected, cuddled, player)", () => {
    expect(top(tally(prof({ care: 0.7, fighting: 1, training: 0.9 })).c)).toEqual(expect.arrayContaining(["fire"]));
    expect(top(tally(prof({ care: 0.7, training: 1, study: 0.5 })).c)).toEqual(expect.arrayContaining(["rock"]));
    expect(top(tally(prof({ care: 0.7, training: 1, play: 1 })).c)).toEqual(expect.arrayContaining(["electric"]));
    expect(top(tally(prof({ care: 0.8, study: 1, affection: 0.5 })).c)).toEqual(expect.arrayContaining(["mystic"]));
    expect(top(tally(prof({ care: 0.9, hygiene: 1, study: 1 })).c, 1)).toEqual(["crystal"]);
    expect(top(tally(prof({ care: 0.05, affection: 0, hygiene: 0.1 })).c, 1)).toEqual(["shadow"]);
    expect(top(tally(prof({ care: 0.9, affection: 1, hygiene: 0.6 })).c)).toEqual(expect.arrayContaining(["plant"]));
    expect(top(tally(prof({ care: 0.7, play: 1, hygiene: 0.9 })).c)).toEqual(expect.arrayContaining(["water"]));
  });

  it("every family stays possible (no closed doors)", () => {
    const o = familyOdds(prof({ fighting: 1, training: 1 }));
    for (const f of FAMILY_IDS) expect(o[f]).toBeGreaterThan(0.001);
  });

  it("measures the care profile from the stage log", () => {
    const l: StageLog = { ...emptyStageLog(), hours: 10, sat: 900, hyg: 950, aff: 300, hun: 800, pets: 0, baths: 6, gym: 12, fights: 9, wins: 9 };
    const p = careProfile(l);
    expect(p.care).toBe(1);
    expect(p.hygiene).toBeCloseTo(0.75 + 0.25 * 0.5, 5);
    expect(p.affection).toBeLessThan(0.1);
    expect(p.training).toBe(1);
    expect(p.fighting).toBe(1);
  });
});

describe("evolution in the game", () => {
  function baby(): GameState {
    const s = newGame(T0, { tamtamId: "tt-evo" });
    hatch(s, T0 + 8_000);
    nameNewTamtam(s, "Tizón", T0 + 9_000);
    return s;
  }

  it("is not available before the stage maturity and evolves after it, keeping the name", () => {
    const s = baby();
    expect(readyToEvolve(s)).toBe(false);
    expect(() => evolve(s, T0 + H)).toThrow(/not_ready/);
    for (let h = 1; h <= 60 && !readyToEvolve(s); h++) {
      debugSetNeed(s, "hunger", 90);
      debugSetNeed(s, "happiness", 90);
      s.care.needs.affection = 90;
      s.care.needs.energy = 90;
      tick(s, T0 + h * H);
    }
    expect(readyToEvolve(s)).toBe(true);
    const roll = evolve(s, s.care.updatedAt + 1);
    expect(s.tamtam!.stage).toBe("child");
    expect(s.tamtam!.name).toBe("Tizón");
    expect(s.tamtam!.genome).toEqual(roll.genome);
    expect(s.tamtam!.formName!.length).toBeGreaterThan(2);
    expect(s.care.maturity).toBe(0);
    expect(s.care.log!.hours).toBe(0);
    expect(dominantFamily(roll.genome).family).toBeTruthy();
    // Child stats are higher than baby stats.
    expect(playerFighter(s).hp).toBeGreaterThan(100);
  });

  it("counts training in the stage log", () => {
    const s = baby();
    s.care.needs.energy = 100;
    completeGymSession(s, { runId: "a", quality: 1, now: T0 + H, tzOffsetMin: 0 });
    expect(s.care.log!.gym).toBe(1);
  });
});
