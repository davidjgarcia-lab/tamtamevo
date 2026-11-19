import { EYE_STYLES, FAMILIES, FAMILY_IDS, MUTATIONS, PATTERNS, type EyeStyle, type FamilyId, type Mutation, type PatternId } from "./families";

/** Slots whose part comes from a family. */
export type PartSlot = "body" | "head" | "legs" | "tail" | "back";
export const PART_SLOTS: readonly PartSlot[] = ["body", "head", "legs", "tail", "back"];

/** Everything needed to draw and play an evolved Tamtam. */
export interface Genome {
  parts: Record<PartSlot, FamilyId>;
  /** Variant (0/1) inside the family part, so two "fire tails" can differ. */
  variant: Record<PartSlot, number>;
  eyes: EyeStyle;
  pattern: PatternId;
  /** Family whose palette colours the body, index of its base, and the family giving the accent. */
  palette: { base: FamilyId; shade: number; accent: FamilyId };
  mutation: Mutation;
}

/** Chispín (baby) expressed as a genome: reptile body with fire crest and fire tail. */
export const CHISPIN_GENOME: Genome = {
  parts: { body: "reptile", head: "reptile", legs: "reptile", tail: "fire", back: "fire" },
  variant: { body: 0, head: 0, legs: 0, tail: 0, back: 0 },
  eyes: "slit",
  pattern: "seams",
  palette: { base: "fire", shade: 0, accent: "fire" },
  mutation: "none",
};

/** Number of distinct genomes (all combinations the generator can produce). */
export function genomeSpace(): number {
  const fams = FAMILY_IDS.length;
  const partCombos = (fams * 2) ** PART_SLOTS.length; // family × variant per slot
  const palettes = fams * 3 * fams; // base family × shade × accent family
  return partCombos * EYE_STYLES.length * PATTERNS.length * palettes * MUTATIONS.length;
}

/** Families present in the genome with their share (0–1) — the "lineage". */
export function familyShare(g: Genome): Record<FamilyId, number> {
  const out = Object.fromEntries(FAMILY_IDS.map((f) => [f, 0])) as Record<FamilyId, number>;
  for (const s of PART_SLOTS) out[g.parts[s]] += 1 / (PART_SLOTS.length + 1);
  out[g.palette.base] += 1 / (PART_SLOTS.length + 1);
  return out;
}

export function dominantFamily(g: Genome): { family: FamilyId; share: number; hybrid: boolean; second: FamilyId } {
  const share = familyShare(g);
  const sorted = [...FAMILY_IDS].sort((a, b) => share[b] - share[a]);
  return { family: sorted[0]!, share: share[sorted[0]!], second: share[sorted[1]!] > 0 ? sorted[1]! : sorted[0]!, hybrid: share[sorted[0]!] < 0.5 };
}

/** Readable form name from the two strongest families (e.g. "Ferrino" = metal + crystal). */
export function formName(g: Genome, seed: number): string {
  const d = dominantFamily(g);
  const a = FAMILIES[d.family];
  const b = FAMILIES[d.second];
  const pre = a.prefixes[seed % a.prefixes.length]!;
  const stem = pre.replace(/[aeiouáéíóú]+$/i, "");
  return d.family === d.second ? `${pre}${a.suffix}` : `${stem}${b.suffix}`;
}

/** Combined Arena stat multipliers of all parts (each part 1/5 weight). */
export function genomeStats(g: Genome): FamilyStats {
  const acc: FamilyStats = { hp: 0, str: 0, def: 0, spd: 0, crit: 0, skill: 0 };
  for (const s of PART_SLOTS) {
    const st = FAMILIES[g.parts[s]].stats;
    for (const k of Object.keys(acc) as (keyof FamilyStats)[]) acc[k] += st[k] / PART_SLOTS.length;
  }
  return acc;
}
export type FamilyStats = { hp: number; str: number; def: number; spd: number; crit: number; skill: number };
