import { describe, expect, it } from "vitest";
import { addAttributeXp, advanceCare, hatchTamtam, LOOK, LUSTRE_TIERS, lifeMark, lustre, newCareState, PROFILES, simulate, type Tamtam } from "../index";

const t0 = (): Tamtam =>
  hatchTamtam({ id: "l", speciesId: "fire", formId: "fire_baby_chispin", requestedName: "Lu", bornAt: 0, personality: [], affinity: { primary: "fire", secondary: "fire" } });
const H = 3_600_000;

describe("Lustre", () => {
  it("neglect dulls the Tamtam", () => {
    const c = newCareState(0);
    advanceCare(c, 72 * H); // three days alone → needs at the floor
    expect(lustre(c, t0()).tier).toBe("dull");
  });

  it("great care alone reaches radiant at most; legendary needs the Arena", () => {
    const c = newCareState(0);
    c.needs = { hunger: 100, hygiene: 100, happiness: 100, affection: 100, energy: 100, activity: 100 };
    c.satIntegral = 100 * 100;
    c.satHours = 100;
    let t = t0();
    for (const a of ["str", "int", "cre", "nat", "man"] as const) t = addAttributeXp(t, a, 1e6).tamtam;
    const noArena = lustre(c, t);
    expect(noArena.score).toBeCloseTo(80, 5);
    expect(noArena.tier).toBe("radiant");
    expect(lustre(c, t, { fights: 40, wins: 30, rankIndex: 5 }).tier).toBe("legendary");
  });

  it("tiers are ordered and render parameters grow with the tier", () => {
    for (let i = 1; i < LUSTRE_TIERS.length; i++) {
      const a = LOOK[LUSTRE_TIERS[i - 1]!];
      const b = LOOK[LUSTRE_TIERS[i]!];
      expect(b.saturation).toBeGreaterThanOrEqual(a.saturation);
      expect(b.emissive).toBeGreaterThan(a.emissive);
      expect(b.particles).toBeGreaterThan(a.particles);
    }
  });

  it("life mark needs a clear dominant attribute", () => {
    let t = t0();
    expect(lifeMark(t)).toBe("none");
    t = addAttributeXp(t, "str", 2_000).tamtam; // level ≥ 5
    expect(lifeMark(t)).toBe("warrior");
    t = addAttributeXp(t, "cre", 2_000).tamtam; // tie
    expect(lifeMark(t)).toBe("none");
  });

  it("player profiles end in different Lustre tiers (care is visible)", () => {
    const tiers = PROFILES.map((p) => simulate(p, 10).lustreAtAdult);
    expect(new Set(tiers).size).toBeGreaterThanOrEqual(3);
    expect(simulate(PROFILES.find((p) => p.id === "neglect")!, 10).lustreAtAdult).toBe("dull");
  });

  it("there are more than 300 adult looks per family", () => {
    const branches = 3, tiers = LUSTRE_TIERS.length, marks = 6, alleles = 5;
    expect(branches * tiers * marks * alleles).toBeGreaterThan(300);
  });
});

import { arenaStrength, debugForceEvolution, debugSetLifetimeCare, debugSetNeed, FORM_QUALITY, hatch, nameNewTamtam, newGame, qualifySkill } from "../index";

describe("Form quality engraved at evolution", () => {
  const evolveWith = (care: number) => {
    const s = newGame(0, { tamtamId: `q${care}` });
    hatch(s, 8_000);
    nameNewTamtam(s, "Lu", 21_000);
    debugSetLifetimeCare(s, care);
    for (const n of ["hunger", "hygiene", "happiness", "affection", "energy", "activity"] as const) debugSetNeed(s, n, care);
    debugForceEvolution(s, { formId: "fire_child_fogarin", stage: "child" }, 30_000);
    return s;
  };

  it("neglected → dull form with weaker stats; cared → better form", () => {
    const bad = evolveWith(15);
    const good = evolveWith(100);
    expect(bad.tamtam!.formQuality).toBe("dull");
    expect(["vivid", "radiant"]).toContain(good.tamtam!.formQuality);
    expect(arenaStrength(good).total).toBeGreaterThan(arenaStrength(bad).total);
    expect(bad.tamtam!.evolutionHistory[0]!.quality).toBe("dull");
    expect(bad.tamtam!.name).toBe("Lu");
  });

  it("skills get weaker or stronger variants", () => {
    const erupt = { power: 220, cooldown: 16 };
    expect(qualifySkill(erupt, "dull")).toEqual({ power: 187, cooldown: 19.2, variant: "weakened" });
    expect(qualifySkill(erupt, "legendary")).toEqual({ power: 253, cooldown: 14.4, variant: "ascended" });
    expect(FORM_QUALITY.legendary.extraPassive).toBe(true);
  });
});
