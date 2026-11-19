import { lifetimeCare, satisfaction, type CareState } from "../care/needs";
import type { AttributeId, Tamtam } from "../identity/tamtam";

/**
 * LUSTRE & LIFE MARK (decision N11, ART_BIBLE §8).
 *
 * Two visual layers on top of species, branch and genetic colours:
 *  - Lustre tier: how polished / magical the Tamtam looks. Earned by how it is cared for,
 *    trained and fought with. Updates live (a neglected Tamtam visibly dulls) and is
 *    recorded at each evolution Ritual.
 *  - Life mark: the Tamtam's dominant learned attribute leaves a visual signature.
 *
 * Branch (3) × Lustre (5) × Life mark (6) × colour allele (5) = 450 adult looks per family.
 */

export type LustreTier = "dull" | "plain" | "vivid" | "radiant" | "legendary";
export const LUSTRE_TIERS: readonly LustreTier[] = ["dull", "plain", "vivid", "radiant", "legendary"];
export const LUSTRE_THRESHOLDS: Record<LustreTier, number> = { dull: 0, plain: 30, vivid: 50, radiant: 70, legendary: 88 };

export type LifeMark = "none" | "warrior" | "sage" | "artist" | "wild" | "artisan";
const MARK_BY_ATTR: Record<AttributeId, LifeMark> = { str: "warrior", int: "sage", cre: "artist", nat: "wild", man: "artisan" };

export interface ArenaRecord {
  fights: number;
  wins: number;
  /** 0 = Bronze … 6 = Legend. */
  rankIndex: number;
}

export interface LustreBreakdown {
  care: number;
  activity: number;
  arena: number;
  bond: number;
  score: number;
  tier: LustreTier;
  /** Points to the next tier (0 at legendary). */
  toNext: number;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

/**
 * score = 0.45·care + 0.20·activity + 0.20·arena + 0.15·bond   (each 0–100)
 * care     = 70% lifetime satisfaction + 30% current satisfaction
 * activity = Σ attribute levels / 40 (capped)          → training, studying, gardening…
 * arena    = rank (60%) + win rate weighted by experience (40%)
 * bond     = current affection
 * Without Arena the maximum is 80 → "radiant" is reachable by care alone; "legendary" needs the Arena.
 */
export function lustre(care: CareState, t: Tamtam, arena: ArenaRecord = { fights: 0, wins: 0, rankIndex: 0 }): LustreBreakdown {
  const careScore = clamp(0.7 * lifetimeCare(care) + 0.3 * satisfaction(care.needs));
  const attrSum = (Object.keys(t.attributes) as AttributeId[]).reduce((a, k) => a + t.attributes[k].level, 0);
  const activity = clamp((attrSum / 40) * 100);
  const experience = Math.min(1, arena.fights / 20);
  const arenaScore = clamp((arena.rankIndex / 6) * 60 + (arena.fights ? arena.wins / arena.fights : 0) * 40 * experience);
  const bond = clamp(care.needs.affection);
  const score = 0.45 * careScore + 0.2 * activity + 0.2 * arenaScore + 0.15 * bond;
  let tier: LustreTier = "dull";
  for (const k of LUSTRE_TIERS) if (score >= LUSTRE_THRESHOLDS[k]) tier = k;
  const idx = LUSTRE_TIERS.indexOf(tier);
  const next = LUSTRE_TIERS[idx + 1];
  return { care: careScore, activity, arena: arenaScore, bond, score, tier, toNext: next ? LUSTRE_THRESHOLDS[next] - score : 0 };
}

/** Dominant learned attribute (needs level ≥ 3 and a 2-level lead) — otherwise "none". */
export function lifeMark(t: Tamtam): LifeMark {
  const entries = (Object.keys(t.attributes) as AttributeId[]).map((k) => [k, t.attributes[k].level] as const).sort((a, b) => b[1] - a[1]);
  const [first, second] = entries;
  if (!first || first[1] < 3 || (second && first[1] - second[1] < 2)) return "none";
  return MARK_BY_ATTR[first[0]];
}

/** Render parameters per tier (ART_BIBLE §8). */
export interface LookParams {
  saturation: number;
  emissive: number;
  sheen: number;
  halo: 0 | 1 | 2;
  particles: number;
  sparkle: boolean;
}

export const LOOK: Record<LustreTier, LookParams> = {
  dull: { saturation: 0.55, emissive: 0.35, sheen: 0, halo: 0, particles: 0.35, sparkle: false },
  plain: { saturation: 0.85, emissive: 0.7, sheen: 0, halo: 0, particles: 0.75, sparkle: false },
  vivid: { saturation: 1.0, emissive: 1.0, sheen: 0.22, halo: 0, particles: 1.0, sparkle: false },
  radiant: { saturation: 1.08, emissive: 1.3, sheen: 0.4, halo: 1, particles: 1.35, sparkle: true },
  legendary: { saturation: 1.14, emissive: 1.6, sheen: 0.55, halo: 2, particles: 1.7, sparkle: true },
};

export const LUSTRE_NAMES: Record<LustreTier, string> = { dull: "Apagado", plain: "Común", vivid: "Vivo", radiant: "Radiante", legendary: "Legendario" };
export const MARK_NAMES: Record<LifeMark, string> = { none: "Sin marca", warrior: "Guerrero", sage: "Sabio", artist: "Artista", wild: "Silvestre", artisan: "Artesano" };

// ── Form quality: the Lustre recorded at the evolution Ritual (user decision, 2026-11-19) ──

export const TIER_INDEX: Record<LustreTier, number> = { dull: 0, plain: 1, vivid: 2, radiant: 3, legendary: 4 };

export type SkillVariant = "weakened" | "normal" | "enhanced" | "ascended";

export interface FormQualityEffects {
  /** Multiplies every base combat stat of the new form. */
  statMul: number;
  /** Multiplies the power of the form's signature skills. */
  skillPower: number;
  /** Multiplies their cooldowns (lower is better). */
  skillCooldown: number;
  variant: SkillVariant;
  /** Legendary forms unlock an extra passive slot in the Arena. */
  extraPassive: boolean;
}

export const FORM_QUALITY: Record<LustreTier, FormQualityEffects> = {
  dull: { statMul: 0.88, skillPower: 0.85, skillCooldown: 1.2, variant: "weakened", extraPassive: false },
  plain: { statMul: 0.95, skillPower: 0.95, skillCooldown: 1.05, variant: "normal", extraPassive: false },
  vivid: { statMul: 1.0, skillPower: 1.0, skillCooldown: 1.0, variant: "normal", extraPassive: false },
  radiant: { statMul: 1.05, skillPower: 1.1, skillCooldown: 0.95, variant: "enhanced", extraPassive: false },
  legendary: { statMul: 1.1, skillPower: 1.15, skillCooldown: 0.9, variant: "ascended", extraPassive: true },
};

export const SKILL_VARIANT_NAMES: Record<SkillVariant, string> = { weakened: "Debilitada", normal: "Normal", enhanced: "Mejorada", ascended: "Ascendida" };

/** Quality of the Tamtam's current form; a baby (no Ritual yet) counts as "vivid" for stats. */
export function formQuality(t: Tamtam): LustreTier {
  return t.formQuality ?? "vivid";
}

/** Applies form quality to a skill (power %, cooldown s). */
export function qualifySkill(skill: { power: number; cooldown: number }, tier: LustreTier): { power: number; cooldown: number; variant: SkillVariant } {
  const q = FORM_QUALITY[tier];
  return { power: Math.round(skill.power * q.skillPower), cooldown: Math.round(skill.cooldown * q.skillCooldown * 10) / 10, variant: q.variant };
}
