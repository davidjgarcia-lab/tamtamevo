import { writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { evaluateEvolution, EvolutionBlocked, FIRE_RULES, type EvolutionContext } from "./engine";

/** EVOLUTION_TEST_MATRIX.md — every row here is a scenario of the matrix. */

const base = (over: Partial<EvolutionContext> = {}): EvolutionContext => ({
  creatureId: "tt-matrix",
  formId: "fire_juvenile_brasko",
  level: 25,
  cq: 70,
  axes: { str: 100, agi: 100, int: 100, bond: 100, calm: 100 },
  attributes: { str: 0, int: 0, cre: 0, nat: 0, man: 0 },
  temperament: ["S", "E"],
  potentialFor: {},
  secondaryAffinity: "fire",
  items: [],
  ritualHour: 14,
  abatido: false,
  ...over,
});

const rows: { id: string; scenario: string; expected: string; got: string; scores: string }[] = [];
const run = (id: string, scenario: string, ctx: EvolutionContext, expected: string) => {
  const r = evaluateEvolution(ctx, FIRE_RULES);
  rows.push({ id, scenario, expected, got: r.to, scores: r.scores.map((s) => `${s.to.split("_").pop()}=${s.score.toFixed(1)}${s.eligible ? "" : "✗"}`).join(" ") });
  expect(r.to, `${id} ${scenario}`).toBe(expected);
  return r;
};
const A = "fire_adult_volcaurio";
const B = "fire_adult_fenixara";
const S = "fire_adult_brasaluz";

describe("Evolution matrix — Brasálidos", () => {
  it("EVO-01 linear transitions always succeed (baby→child→juvenile)", () => {
    run("EVO-01a", "Bebé, cualquier estado", base({ formId: "fire_baby_chispin", cq: 5, level: 1 }), "fire_child_fogarin");
    run("EVO-01b", "Infantil, cualquier estado", base({ formId: "fire_child_fogarin", cq: 95 }), "fire_juvenile_brasko");
  });

  it("EVO-02 neutral profile is balanced (|A−B| < 6) and deterministic", () => {
    const r = evaluateEvolution(base(), FIRE_RULES);
    const a = r.scores.find((s) => s.to === A)!.score;
    const b = r.scores.find((s) => s.to === B)!.score;
    expect(Math.abs(a - b)).toBeLessThan(6);
    expect(evaluateEvolution(base(), FIRE_RULES)).toEqual(r);
    rows.push({ id: "EVO-02", scenario: "Perfil neutro (ejes iguales, CQ 70, SE)", expected: "|A−B| < 6", got: `${r.to} (A=${a.toFixed(1)}, B=${b.toFixed(1)})`, scores: "" });
  });

  it("EVO-03 lots of training (STR/CALM axes) → Volcaurio", () => {
    run("EVO-03", "Mucho Gym y rutina (FUE 300, SER 150)", base({ axes: { str: 300, agi: 40, int: 40, bond: 60, calm: 150 } }), A);
  });

  it("EVO-04 play, minigames and cuddles (AGI/BOND) → Fenixara", () => {
    run("EVO-04", "Mucho juego y mimos (AGI 300, VÍN 200)", base({ axes: { str: 40, agi: 300, int: 40, bond: 200, calm: 40 } }), B);
  });

  it("EVO-05 little training: neutral axes decide by care", () => {
    run("EVO-05a", "Poco entrenamiento + cuidados excelentes (CQ 95)", base({ cq: 95 }), B);
    run("EVO-05b", "Poco entrenamiento + cuidados deficientes (CQ 20)", base({ cq: 20 }), A);
  });

  it("EVO-06 high Strength attribute (Gym lvl 20) tips a neutral profile to Volcaurio", () => {
    run("EVO-06", "Fuerza nivel 20, resto neutro", base({ attributes: { str: 20, int: 0, cre: 0, nat: 0, man: 0 }, cq: 80 }), A);
  });

  it("EVO-07 high Creativity attribute tips to Fenixara", () => {
    run("EVO-07", "Creatividad nivel 20, resto neutro", base({ attributes: { str: 0, int: 0, cre: 20, nat: 0, man: 0 } }), B);
  });

  it("EVO-08 high Intelligence alone does not change A/B for Fire (only the secret branch uses it)", () => {
    const n = evaluateEvolution(base(), FIRE_RULES).to;
    run("EVO-08", "Inteligencia nivel 20, resto neutro", base({ attributes: { str: 0, int: 20, cre: 0, nat: 0, man: 0 } }), n);
  });

  it("EVO-09 genetics: temperament SS / EE", () => {
    run("EVO-09a", "Temperamento SS, resto neutro", base({ temperament: ["S", "S"] }), A);
    run("EVO-09b", "Temperamento EE, resto neutro", base({ temperament: ["E", "E"] }), B);
  });

  it("EVO-10 affinity and potential bonuses", () => {
    run("EVO-10a", "Afinidad secundaria Tierra + CQ 90 (B favorecido por cuidado)", base({ secondaryAffinity: "earth", cq: 90, temperament: ["S", "S"] }), A);
    run("EVO-10b", "Potencial alto en stats de B", base({ potentialFor: { evo_fire_j_b: 26 }, cq: 60 }), B);
  });

  it("EVO-11 special items: catalysts override a moderate leaning", () => {
    run("EVO-11a", "Tendencia a A + Pluma Cenicienta", base({ axes: { str: 180, agi: 60, int: 40, bond: 70, calm: 150 }, cq: 78, catalyst: "cat_ash_feather" }), B);
    run("EVO-11b", "Tendencia moderada a B (diferencia < 25) + Piedra Magma", base({ axes: { str: 80, agi: 160, int: 50, bond: 100, calm: 60 }, catalyst: "cat_magma_stone" }), A);
    // Design (EVOLUTION_SYSTEM §4): a catalyst is +25 — it tips moderate leanings, it does not override strong ones.
    run("EVO-11c", "Tendencia FUERTE a B (diferencia > 25) + Piedra Magma → sigue B", base({ axes: { str: 40, agi: 220, int: 40, bond: 120, calm: 40 }, catalyst: "cat_magma_stone" }), B);
  });

  it("EVO-12 secret branch Brasaluz: only with every gate", () => {
    const full = base({
      secondaryAffinity: "light", items: ["stone_sun"], attributes: { str: 0, int: 8, cre: 12, nat: 0, man: 0 }, cq: 80, ritualHour: 6,
    });
    run("EVO-12a", "Todas las condiciones (Luz + Piedra Solar + CRE 12 + INT 8 + CQ 80 + amanecer)", full, S);
    run("EVO-12b", "Igual pero Ritual a las 14:00", { ...full, ritualHour: 14 }, evaluateEvolution({ ...full, ritualHour: 14 }, FIRE_RULES.filter((r) => !r.isSecret)).to);
    run("EVO-12c", "Igual pero sin Piedra Solar", { ...full, items: [] }, evaluateEvolution({ ...full, items: [] }, FIRE_RULES.filter((r) => !r.isSecret)).to);
    run("EVO-12d", "Igual pero CRE 11", { ...full, attributes: { ...full.attributes, cre: 11 } }, evaluateEvolution({ ...full, attributes: { ...full.attributes, cre: 11 } }, FIRE_RULES.filter((r) => !r.isSecret)).to);
  });

  it("EVO-13 level is not a decision factor (D10: maturity drives timing)", () => {
    const lo = evaluateEvolution(base({ level: 1 }), FIRE_RULES).to;
    run("EVO-13", "Nivel 1 frente a 50 (mismo resultado)", base({ level: 50 }), lo);
  });

  it("EVO-14 reachability: each adult is reachable without items", () => {
    for (const target of [A, B]) {
      let found = false;
      for (let s = 0; s <= 300 && !found; s += 50) for (let a = 0; a <= 300 && !found; a += 50) {
        const r = evaluateEvolution(base({ axes: { str: s, agi: a, int: 50, bond: 50, calm: 50 } }), FIRE_RULES);
        if (r.to === target) found = true;
      }
      expect(found, target).toBe(true);
    }
    rows.push({ id: "EVO-14", scenario: "Barrido de ejes sin objetos", expected: "A y B alcanzables", got: "A y B alcanzables", scores: "" });
  });

  it("EVO-15 blocked states and impossible double evolution", () => {
    expect(() => evaluateEvolution(base({ abatido: true }), FIRE_RULES)).toThrow(EvolutionBlocked);
    expect(() => evaluateEvolution(base({ formId: A }), FIRE_RULES)).toThrow(EvolutionBlocked); // adults have no further rules
    rows.push({ id: "EVO-15", scenario: "Abatido / ya adulto", expected: "Bloqueado", got: "Bloqueado", scores: "" });
  });

  it("EVO-16 combined factors", () => {
    // Strong STR leaning + poor care outweigh feather (+25) and EE (+12): Volcaurio.
    run("EVO-16a", "FUE muy alto, CQ 30, Pluma, EE → A", base({ axes: { str: 300, agi: 50, int: 30, bond: 30, calm: 100 }, cq: 30, catalyst: "cat_ash_feather", temperament: ["E", "E"] }), A);
    run("EVO-16b", "FUE moderado, CQ 60, Pluma, EE → B", base({ axes: { str: 150, agi: 90, int: 50, bond: 80, calm: 80 }, cq: 60, catalyst: "cat_ash_feather", temperament: ["E", "E"] }), B);
  });

  it("EVO-17 random property: never throws and always returns a Fire adult", () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 5000; i++) {
      const ctx = base({
        creatureId: `c${i}`,
        cq: Math.floor(rnd() * 101),
        axes: { str: rnd() * 400, agi: rnd() * 400, int: rnd() * 400, bond: rnd() * 400, calm: rnd() * 400 },
        attributes: { str: Math.floor(rnd() * 21), int: Math.floor(rnd() * 21), cre: Math.floor(rnd() * 21), nat: 0, man: 0 },
        temperament: [rnd() < 0.5 ? "S" : "E", rnd() < 0.5 ? "S" : "E"],
        catalyst: rnd() < 0.2 ? (rnd() < 0.5 ? "cat_magma_stone" : "cat_ash_feather") : undefined,
        ritualHour: Math.floor(rnd() * 24),
      });
      const r = evaluateEvolution(ctx, FIRE_RULES);
      expect([A, B, S]).toContain(r.to);
      expect(evaluateEvolution(ctx, FIRE_RULES).to).toBe(r.to);
    }
    rows.push({ id: "EVO-17", scenario: "5.000 contextos aleatorios", expected: "Siempre un adulto válido y reproducible", got: "OK", scores: "" });
  });
});

afterAll(() => {
  if (process.env.EVO_REPORT) writeFileSync(process.env.EVO_REPORT, JSON.stringify(rows, null, 1));
});
