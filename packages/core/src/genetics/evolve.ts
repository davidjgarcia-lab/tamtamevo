import { emptyStageLog, stageEligible, type CareState, type StageLog } from "../care/needs";
import { applyEvolution, type Stage, type Tamtam } from "../identity/tamtam";
import { lustre, type LustreTier } from "../appearance/appearance";
import { EYE_STYLES, FAMILIES, FAMILY_EYES, FAMILY_IDS, FAMILY_PATTERNS, PATTERNS, type FamilyId, type Mutation } from "./families";
import { CHISPIN_GENOME, familyShare, formName, PART_SLOTS, type Genome, type PartSlot } from "./genome";

/**
 * EVOLUTION ALGORITHM (docs/EVOLUTION_ALGORITHM.md)
 *
 *  1. Eligibility ........ maturity of the stage reached (5–7 days baby→adult, D10)
 *  2. Care profile ....... 7 axes 0–1 measured DURING the stage: care, affection, hygiene, training, fighting, study, play
 *  3. Family affinity .... each family scores the profile with its own weights (+ lineage + floor)
 *  4. Part draw .......... for every slot: inherit (keep) / wild mutation (any family) / affinity draw (∝ affinity²)
 *  5. Colours & details .. palette base/accent, eyes, pattern; rare mutations depend on care
 *  6. Quality ............ the Lustre at that moment is engraved (looks, stats ×0.88–1.10, skills)
 *  7. Result ............. new genome, name, stats; stage counters reset
 *
 * Deterministic: the RNG is seeded with the Tamtam id + stage, so reloading never re-rolls the result,
 * but two Tamtams cared the same way still evolve differently.
 */

export interface CareProfile {
  care: number; // average satisfaction
  affection: number; // average affection + strokes
  hygiene: number; // average hygiene + baths/cleaning
  training: number; // gym sessions
  fighting: number; // arena fights, weighted by wins
  study: number; // study sessions
  play: number; // minigames
  neglect: number; // 1 − care
}
export const PROFILE_AXES: readonly (keyof CareProfile)[] = ["care", "affection", "hygiene", "training", "fighting", "study", "play", "neglect"];

const c01 = (v: number) => Math.min(1, Math.max(0, v));

/** Measures how the Tamtam was raised during the current stage. */
export function careProfile(log: StageLog | undefined, fallback?: CareState): CareProfile {
  const l = log ?? emptyStageLog();
  const h = Math.max(l.hours, 1e-6);
  const has = l.hours >= 1;
  const avg = (integral: number, current: number) => (has ? integral / h : current);
  const care = c01((avg(l.sat, fallback ? sat(fallback) : 70) - 30) / 60);
  const affection = c01(0.7 * c01((avg(l.aff, fallback?.needs.affection ?? 60) - 25) / 65) + 0.3 * c01(l.pets / 30));
  const hygiene = c01(0.75 * c01((avg(l.hyg, fallback?.needs.hygiene ?? 80) - 25) / 65) + 0.25 * c01((l.baths + l.cleans) / 12));
  const training = c01(l.gym / 12);
  const fighting = c01((l.fights + l.wins) / 18);
  const study = c01(l.study / 10);
  const play = c01(l.games / 12);
  return { care, affection, hygiene, training, fighting, study, play, neglect: 1 - care };
}
const sat = (s: CareState) => (s.needs.hunger + s.needs.hygiene + s.needs.happiness + s.needs.affection + s.needs.energy + s.needs.activity) / 6;

/** How strongly each family "calls" this Tamtam (weights per axis). */
export const AFFINITY_WEIGHTS: Record<FamilyId, Partial<Record<keyof CareProfile, number>> & { base: number }> = {
  fire: { fighting: 1.3, training: 0.7, care: 0.2, base: 0.1 },
  electric: { training: 1.0, play: 0.8, fighting: 0.3, base: 0.1 },
  crystal: { hygiene: 1.2, study: 0.9, care: 0.3, base: 0.08 },
  plant: { care: 0.5, affection: 1.0, hygiene: 0.2, base: 0.08 },
  shadow: { neglect: 1.4, base: 0.06 },
  water: { hygiene: 0.9, play: 0.9, affection: 0.2, base: 0.1 },
  plasma: { play: 1.1, neglect: 0.3, base: 0.12 },
  light: { affection: 1.0, care: 0.6, hygiene: 0.2, base: 0.08 },
  rock: { training: 0.8, fighting: 0.4, care: 0.3, base: 0.14 },
  mystic: { study: 1.2, affection: 0.4, hygiene: 0.2, base: 0.06 },
};

export function familyAffinity(p: CareProfile, lineage: Genome = CHISPIN_GENOME): Record<FamilyId, number> {
  const share = familyShare(lineage);
  const out = {} as Record<FamilyId, number>;
  for (const f of FAMILY_IDS) {
    const w = AFFINITY_WEIGHTS[f];
    let v = w.base;
    for (const k of Object.keys(w) as (keyof typeof w)[]) if (k !== "base") v += (w[k] ?? 0) * p[k as keyof CareProfile];
    // A lonely, dirty Tamtam drifts away from the "bright" families.
    if (f === "crystal" || f === "light" || f === "mystic") v *= 1 - 0.5 * p.neglect;
    out[f] = v + 0.35 * share[f];
  }
  return out;
}

/** Probability of each family for a newly drawn part (affinity², normalised). */
export function familyOdds(p: CareProfile, lineage: Genome = CHISPIN_GENOME): Record<FamilyId, number> {
  const a = familyAffinity(p, lineage);
  const sq = FAMILY_IDS.map((f) => a[f] ** 2);
  const tot = sq.reduce((x, y) => x + y, 0);
  return Object.fromEntries(FAMILY_IDS.map((f, i) => [f, sq[i]! / tot])) as Record<FamilyId, number>;
}

export function rng(seed: number) {
  let a = seed >>> 0 || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const ch of parts.join("|")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

function pick<T>(r: () => number, weights: [T, number][]): T {
  const tot = weights.reduce((a, [, w]) => a + w, 0);
  let x = r() * tot;
  for (const [v, w] of weights) if ((x -= w) <= 0) return v;
  return weights[weights.length - 1]![0];
}

export interface EvolutionRoll {
  genome: Genome;
  profile: CareProfile;
  odds: Record<FamilyId, number>;
  /** How each slot was decided (for the debug lab and history). */
  how: Record<PartSlot, "inherited" | "affinity" | "wild">;
  name: string;
}

/** Steps 2–5: the new genome. Pure and deterministic for a given seed. */
export function rollEvolution(prev: Genome, profile: CareProfile, seed: number, tier: LustreTier = "plain"): EvolutionRoll {
  const r = rng(seed);
  const odds = familyOdds(profile, prev);
  const famWeights = FAMILY_IDS.map((f) => [f, odds[f]] as [FamilyId, number]);
  const pKeep = 0.28;
  const pWild = 0.05 + 0.12 * profile.neglect;
  const parts = { ...prev.parts };
  const variant = { ...prev.variant };
  const how = {} as EvolutionRoll["how"];
  for (const s of PART_SLOTS) {
    const x = r();
    if (x < pKeep) {
      how[s] = "inherited";
      continue;
    }
    if (x < pKeep + pWild) {
      parts[s] = FAMILY_IDS[Math.floor(r() * FAMILY_IDS.length)]!;
      how[s] = "wild";
    } else {
      parts[s] = pick(r, famWeights);
      how[s] = "affinity";
    }
    variant[s] = r() < 0.5 ? 0 : 1;
  }
  // Colours: base from the affinity draw, accent from the back appendage or another draw.
  const base = r() < 0.3 ? prev.palette.base : pick(r, famWeights);
  const accent = r() < 0.5 ? parts.back : pick(r, famWeights);
  const shade = Math.floor(r() * FAMILIES[base].bases.length);
  // Eyes follow the head family most of the time; patterns follow the body.
  const eyes = r() < 0.75 ? FAMILY_EYES[parts.head][Math.floor(r() * 2)]! : EYE_STYLES[Math.floor(r() * EYE_STYLES.length)]!;
  const pattern = r() < 0.75 ? FAMILY_PATTERNS[parts.body][Math.floor(r() * 2)]! : PATTERNS[Math.floor(r() * PATTERNS.length)]!;
  // Rare mutations: care decides which ones are possible.
  const top = tier === "radiant" || tier === "legendary";
  const mutation = pick<Mutation>(r, [
    ["none", 1],
    ["iridescent", 0.02 + 0.06 * profile.hygiene],
    ["aurora", top ? 0.08 : 0.01],
    ["melanic", 0.01 + 0.25 * Math.max(0, profile.neglect - 0.4)],
    ["albino", 0.015],
  ]);
  const genome: Genome = { parts, variant, eyes, pattern, palette: { base, shade, accent }, mutation };
  return { genome, profile, odds, how, name: formName(genome, Math.floor(r() * 1000)) };
}

const NEXT: Record<Exclude<Stage, "adult">, Stage> = { baby: "child", child: "juvenile", juvenile: "adult" };

export function canEvolve(t: Tamtam | null, care: CareState): boolean {
  return !!t && t.stage !== "adult" && stageEligible(care, t.stage as "baby" | "child" | "juvenile");
}

/** Steps 1–7 on a Tamtam: returns the evolved Tamtam and resets the stage counters. */
export function evolveTamtam(t: Tamtam, care: CareState, now: number, arena?: { fights: number; wins: number; rankIndex: number }, force = false): { tamtam: Tamtam; roll: EvolutionRoll } {
  if (t.stage === "adult") throw new Error("already_adult");
  if (!force && !canEvolve(t, care)) throw new Error("not_ready");
  const tier = lustre(care, t, arena).tier;
  const profile = careProfile(care.log, care);
  const roll = rollEvolution(t.genome ?? CHISPIN_GENOME, profile, hashSeed(t.id, t.stage, t.evolutionHistory.length), tier);
  const formId = `gen:${hashSeed(JSON.stringify(roll.genome)).toString(36)}`;
  const next = applyEvolution(t, { formId, stage: NEXT[t.stage as Exclude<Stage, "adult">] }, now, 2, tier);
  care.maturity = 0;
  care.log = emptyStageLog();
  return { tamtam: { ...next, genome: roll.genome, formName: roll.name }, roll };
}
