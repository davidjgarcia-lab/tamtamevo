import type { AttributeId } from "../identity/tamtam";

/**
 * Evolution engine (EVOLUTION_SYSTEM §4 + ACTIVITIES_SYSTEM §5).
 * Deterministic: gates → score → overrides → tie-break → default.
 */

export type AxisId = "str" | "agi" | "int" | "bond" | "calm";
export const AXES: readonly AxisId[] = ["str", "agi", "int", "bond", "calm"];

export interface EvolutionContext {
  creatureId: string;
  formId: string;
  level: number;
  /** Care quality 0–100 for the deciding window. */
  cq: number;
  /** Behaviour axis points accumulated (child ×0.5 + juvenile ×1 already applied). */
  axes: Record<AxisId, number>;
  attributes: Record<AttributeId, number>; // levels 0–20
  temperament: ["S" | "E", "S" | "E"];
  /** Potential (0–15) of the two key stats of each branch is summarised per branch id. */
  potentialFor: Record<string, number>;
  secondaryAffinity: string;
  catalyst?: string;
  items: string[];
  /** Local hour of the Ritual (for time-window gates). */
  ritualHour: number;
  abatido: boolean;
}

export type Gate =
  | { type: "minLevel"; value: number }
  | { type: "minCQ"; value: number }
  | { type: "maxCQ"; value: number }
  | { type: "requiredItem"; item: string }
  | { type: "requiredAffinity"; element: string }
  | { type: "minAttribute"; attribute: AttributeId; value: number }
  | { type: "timeWindow"; fromHour: number; toHour: number };

export interface EvolutionRule {
  id: string;
  version: number;
  from: string;
  to: string;
  isDefault?: boolean;
  isSecret?: boolean;
  gates: Gate[];
  axisWeights: Record<AxisId, number>;
  careWeight: number;
  attributeWeights: Partial<Record<AttributeId, number>>;
  catalystItem?: string;
  affinityTag?: string;
  temperamentSide?: "S" | "E";
  forceIf?: (c: EvolutionContext, p: Record<AxisId, number>) => boolean;
  priority?: number;
}

export interface BranchScore {
  ruleId: string;
  to: string;
  eligible: boolean;
  failedGates: Gate[];
  score: number;
  parts: { axes: number; care: number; genetics: number; items: number; attributes: number };
}

export interface EvolutionResult {
  to: string;
  ruleId: string;
  reason: "override" | "score" | "tie_temperament" | "tie_hash" | "default";
  scores: BranchScore[];
}

export class EvolutionBlocked extends Error {}

export function axisProportions(axes: Record<AxisId, number>): Record<AxisId, number> {
  const sum = AXES.reduce((a, k) => a + Math.max(0, axes[k]), 0);
  return Object.fromEntries(AXES.map((k) => [k, sum > 0 ? Math.max(0, axes[k]) / sum : 0.2])) as Record<AxisId, number>;
}

function gateOk(g: Gate, c: EvolutionContext): boolean {
  switch (g.type) {
    case "minLevel": return c.level >= g.value;
    case "minCQ": return c.cq >= g.value;
    case "maxCQ": return c.cq <= g.value;
    case "requiredItem": return c.items.includes(g.item) || c.catalyst === g.item;
    case "requiredAffinity": return c.secondaryAffinity === g.element;
    case "minAttribute": return c.attributes[g.attribute] >= g.value;
    case "timeWindow": return g.fromHour <= g.toHour ? c.ritualHour >= g.fromHour && c.ritualHour < g.toHour : c.ritualHour >= g.fromHour || c.ritualHour < g.toHour;
  }
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function scoreBranch(rule: EvolutionRule, c: EvolutionContext, p: Record<AxisId, number>): BranchScore {
  const failedGates = rule.gates.filter((g) => !gateOk(g, c));
  const axes = 100 * AXES.reduce((a, k) => a + rule.axisWeights[k] * p[k], 0);
  const care = rule.careWeight * 20 * ((c.cq - 50) / 50);
  const sCount = c.temperament.filter((x) => x === "S").length;
  let genetics = 0;
  if (rule.temperamentSide === "S" && sCount === 2) genetics += 12;
  if (rule.temperamentSide === "E" && sCount === 0) genetics += 12;
  if ((c.potentialFor[rule.id] ?? 0) >= 24) genetics += 6;
  if (rule.affinityTag && rule.affinityTag === c.secondaryAffinity) genetics += 4;
  const items = rule.catalystItem && c.catalyst === rule.catalystItem ? 25 : 0;
  const attributes = 10 * Object.entries(rule.attributeWeights).reduce((a, [k, w]) => a + (w ?? 0) * (Math.min(20, c.attributes[k as AttributeId]) / 20), 0);
  return {
    ruleId: rule.id,
    to: rule.to,
    eligible: failedGates.length === 0,
    failedGates,
    score: axes + care + genetics + items + attributes,
    parts: { axes, care, genetics, items, attributes },
  };
}

export function evaluateEvolution(c: EvolutionContext, rules: EvolutionRule[]): EvolutionResult {
  if (c.abatido) throw new EvolutionBlocked("abatido");
  const candidates = rules.filter((r) => r.from === c.formId);
  if (candidates.length === 0) throw new EvolutionBlocked("no_rules");
  const p = axisProportions(c.axes);
  const scores = candidates.map((r) => scoreBranch(r, c, p));
  const eligible = candidates.filter((_, i) => scores[i]!.eligible);

  const forced = eligible.filter((r) => r.forceIf?.(c, p)).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  if (forced.length) return { to: forced[0]!.to, ruleId: forced[0]!.id, reason: "override", scores };

  if (eligible.length === 0) {
    const def = candidates.find((r) => r.isDefault);
    if (!def) throw new EvolutionBlocked("no_eligible_branch");
    return { to: def.to, ruleId: def.id, reason: "default", scores };
  }
  const ranked = eligible
    .map((r) => ({ r, s: scores[candidates.indexOf(r)]!.score }))
    .sort((a, b) => b.s - a.s);
  const top = ranked[0]!;
  const second = ranked[1];
  if (!second || top.s - second.s >= 0.5) return { to: top.r.to, ruleId: top.r.id, reason: "score", scores };
  // Tie: temperament, then a stable hash of creature + rule ids.
  const tied = ranked.filter((x) => top.s - x.s < 0.5).map((x) => x.r);
  const sCount = c.temperament.filter((x) => x === "S").length;
  if (sCount !== 1) {
    const side = sCount === 2 ? "S" : "E";
    const pick = tied.find((r) => r.temperamentSide === side);
    if (pick) return { to: pick.to, ruleId: pick.id, reason: "tie_temperament", scores };
  }
  const sorted = [...tied].sort((a, b) => a.id.localeCompare(b.id));
  const pick = sorted[hash32(c.creatureId + sorted.map((r) => r.id).join("|")) % sorted.length]!;
  return { to: pick.to, ruleId: pick.id, reason: "tie_hash", scores };
}

/** Fire family rules (launch). Baby/child transitions are linear (single default rule). */
export const FIRE_RULES: EvolutionRule[] = [
  { id: "evo_fire_b_c", version: 1, from: "fire_baby_chispin", to: "fire_child_fogarin", isDefault: true, gates: [], axisWeights: { str: 0, agi: 0, int: 0, bond: 0, calm: 0 }, careWeight: 0, attributeWeights: {} },
  { id: "evo_fire_c_j", version: 1, from: "fire_child_fogarin", to: "fire_juvenile_brasko", isDefault: true, gates: [], axisWeights: { str: 0, agi: 0, int: 0, bond: 0, calm: 0 }, careWeight: 0, attributeWeights: {} },
  {
    id: "evo_fire_j_a", version: 1, from: "fire_juvenile_brasko", to: "fire_adult_volcaurio", isDefault: true, gates: [],
    axisWeights: { str: 1.0, agi: 0.1, int: 0.2, bond: 0.3, calm: 0.6 }, careWeight: 0.3, attributeWeights: { str: 1 },
    catalystItem: "cat_magma_stone", affinityTag: "earth", temperamentSide: "S",
  },
  {
    id: "evo_fire_j_b", version: 1, from: "fire_juvenile_brasko", to: "fire_adult_fenixara", gates: [],
    axisWeights: { str: 0.3, agi: 1.0, int: 0.2, bond: 0.6, calm: 0.1 }, careWeight: 0.5, attributeWeights: { cre: 1 },
    catalystItem: "cat_ash_feather", affinityTag: "light", temperamentSide: "E",
  },
  {
    // Secret branch (season 1): needs Light affinity, the Sun Stone, high Creativity and Intelligence, and a dawn Ritual.
    id: "evo_fire_j_s", version: 1, from: "fire_juvenile_brasko", to: "fire_adult_brasaluz", isSecret: true,
    gates: [
      { type: "requiredAffinity", element: "light" },
      { type: "requiredItem", item: "stone_sun" },
      { type: "minAttribute", attribute: "cre", value: 12 },
      { type: "minAttribute", attribute: "int", value: 8 },
      { type: "minCQ", value: 75 },
      { type: "timeWindow", fromHour: 5, toHour: 9 },
    ],
    axisWeights: { str: 0.2, agi: 0.4, int: 0.6, bond: 0.6, calm: 0.4 }, careWeight: 0.5, attributeWeights: { cre: 0.5, int: 0.5 },
    forceIf: () => true, priority: 20,
  },
];
