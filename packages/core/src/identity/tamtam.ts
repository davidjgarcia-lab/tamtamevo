import { DEFAULT_NAMING_RULES, defaultName, validateName, type NameError, type NamingRules } from "./naming";

/** Individual identity of a Tamtam (CREATURE_DATABASE §12). */

export type Stage = "baby" | "child" | "juvenile" | "adult";
export type AttributeId = "str" | "int" | "cre" | "nat" | "man";
export const ATTRIBUTE_IDS: readonly AttributeId[] = ["str", "int", "cre", "nat", "man"];

export interface Tamtam {
  id: string;
  speciesId: string;
  formId: string;
  stage: Stage;
  name: string;
  nameHistory: { name: string; at: number }[];
  bornAt: number;
  personality: string[];
  affinity: { primary: string; secondary: string };
  attributes: Record<AttributeId, { level: number; xp: number }>;
  level: number;
  xp: number;
  evolutionHistory: { from: string; to: string; at: number; rulesetVersion: number; quality?: string }[];
  bonds: Record<string, number>;
  /** Lustre tier recorded at the last Ritual — drives looks, stats and skills of the current form. */
  formQuality?: "dull" | "plain" | "vivid" | "radiant" | "legendary";
  /** Body plan after the first evolution (parts mixed from any family). Babies use the species art. */
  genome?: import("../genetics/genome").Genome;
  /** Generated form name (e.g. "Ferrino"). */
  formName?: string;
  /** Starter it hatched as (personality, favourite food, voice). Absent for the legacy Chispín. */
  starterId?: string;
}

export class NameRejected extends Error {
  constructor(public readonly reason: NameError) {
    super(`Name rejected: ${reason}`);
  }
}

export interface HatchInput {
  id: string;
  speciesId: string;
  formId: string;
  /** What the player typed; empty → default themed name. */
  requestedName: string;
  bornAt: number;
  personality: string[];
  affinity: { primary: string; secondary: string };
}

export function hatchTamtam(input: HatchInput, rules: NamingRules = DEFAULT_NAMING_RULES): Tamtam {
  const typed = input.requestedName.trim();
  let name: string;
  if (typed === "") {
    name = defaultName(input.speciesId, input.id);
  } else {
    const r = validateName(typed, rules);
    if (!r.ok) throw new NameRejected(r.error);
    name = r.name;
  }
  const attributes = Object.fromEntries(ATTRIBUTE_IDS.map((a) => [a, { level: 0, xp: 0 }])) as Tamtam["attributes"];
  return {
    id: input.id,
    speciesId: input.speciesId,
    formId: input.formId,
    stage: "baby",
    name,
    nameHistory: [{ name, at: input.bornAt }],
    bornAt: input.bornAt,
    personality: input.personality,
    affinity: input.affinity,
    attributes,
    level: 1,
    xp: 0,
    evolutionHistory: [],
    bonds: {},
  };
}

/** Renames a Tamtam (free, unlimited). Returns the new object; throws NameRejected. */
export function renameTamtam(t: Tamtam, requested: string, at: number, rules: NamingRules = DEFAULT_NAMING_RULES): Tamtam {
  const r = validateName(requested, rules);
  if (!r.ok) throw new NameRejected(r.error);
  if (r.name === t.name) return t;
  return { ...t, name: r.name, nameHistory: [...t.nameHistory, { name: r.name, at }] };
}

/** Evolution changes the form and stage — never the identity or the name. */
export function applyEvolution(
  t: Tamtam,
  to: { formId: string; stage: Stage },
  at: number,
  rulesetVersion: number,
  quality?: Tamtam["formQuality"],
): Tamtam {
  return {
    ...t,
    formId: to.formId,
    stage: to.stage,
    formQuality: quality ?? t.formQuality,
    evolutionHistory: [...t.evolutionHistory, { from: t.formId, to: to.formId, at, rulesetVersion, quality }],
  };
}

/** Age in whole days (computed, never stored). */
export function ageInDays(t: Tamtam, now: number): number {
  return Math.max(0, Math.floor((now - t.bornAt) / 86_400_000));
}
