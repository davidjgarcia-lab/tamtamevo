/**
 * Care simulation (GAMEPLAY_SYSTEMS §2, EVOLUTION_SYSTEM §2.1).
 *
 * State is stored as "snapshot + timestamp". `advanceCare` integrates elapsed real
 * time piecewise between boundary events (absence damping threshold, poop spawns,
 * wake-up), so closing the app for hours gives exactly the same result as watching.
 * Rates are configuration (BALANCE_CONFIG.md) — nothing here reads the system clock.
 */

export type NeedId = "hunger" | "hygiene" | "happiness" | "affection" | "energy" | "activity";
export const NEED_IDS: readonly NeedId[] = ["hunger", "hygiene", "happiness", "affection", "energy", "activity"];

export interface CareConfig {
  /** Per-hour change while awake (negative = decays). */
  awake: Record<NeedId, number>;
  /** Per-hour change while asleep. */
  asleep: Record<NeedId, number>;
  /** Extra hygiene loss per hour per visible poop. */
  poopHygienePerHour: number;
  /** Hours without interaction after which decay is halved. */
  dampAfterHours: number;
  dampFactor: number;
  /** Time-only decay never pushes a need below this value. */
  floor: number;
  /** Poop appears this long after a meal (+ deterministic jitter up to poopJitterMin). */
  poopAfterMin: number;
  poopJitterMin: number;
  maxPoops: number;
  /** Maturity (growth) model, EVOLUTION_SYSTEM §2.1. */
  maturity: { base: number; bonus: number; careLow: number; careHigh: number; playMinutesForMax: number };
  /** Maturity needed to become eligible for each stage transition. */
  maturityThresholds: { baby: number; child: number; juvenile: number };
}

export const DEFAULT_CARE_CONFIG: CareConfig = {
  awake: { hunger: -6, hygiene: -4, happiness: -3, affection: -4, energy: -5, activity: -5 },
  asleep: { hunger: -2, hygiene: -1, happiness: 0, affection: 0, energy: 12, activity: 0 },
  poopHygienePerHour: 3,
  dampAfterHours: 8,
  dampFactor: 0.5,
  floor: 25,
  poopAfterMin: 90,
  poopJitterMin: 60,
  maxPoops: 3,
  maturity: { base: 1, bonus: 0.4, careLow: 40, careHigh: 90, playMinutesForMax: 45 },
  maturityThresholds: { baby: 17, child: 67, juvenile: 168 },
};

export interface CareState {
  needs: Record<NeedId, number>;
  updatedAt: number;
  lastInteractionAt: number;
  asleep: boolean;
  /** Timestamps at which poops will appear (future) — moved to `poops` when due. */
  pendingPoops: number[];
  poops: number[];
  /** Growth points accumulated in the current stage. */
  maturity: number;
  /** Timestamps of play/interaction minutes in the last 24 h (one entry ≈ 3 min of active play). */
  playLog: number[];
  /** Day-scoped counters (pets per day…) keyed by `${day}|${what}`. */
  counters: Record<string, number>;
}

const HOUR = 3_600_000;

export function newCareState(now: number): CareState {
  return {
    needs: { hunger: 80, hygiene: 90, happiness: 80, affection: 70, energy: 90, activity: 70 },
    updatedAt: now,
    lastInteractionAt: now,
    asleep: false,
    pendingPoops: [],
    poops: [],
    maturity: 0,
    playLog: [],
    counters: {},
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function satisfaction(needs: Record<NeedId, number>): number {
  return NEED_IDS.reduce((a, n) => a + needs[n], 0) / NEED_IDS.length;
}

function playFactor(s: CareState, at: number, cfg: CareConfig): number {
  const minutes = s.playLog.filter((t) => t > at - 24 * HOUR && t <= at).length * 3;
  return clamp(minutes / cfg.maturity.playMinutesForMax, 0, 1);
}

/** Growth rate (maturity points per hour) right now. */
export function growthRate(s: CareState, at: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): number {
  const m = cfg.maturity;
  const care = clamp((satisfaction(s.needs) - m.careLow) / (m.careHigh - m.careLow), 0, 1);
  const g = 0.5 * care + 0.5 * playFactor(s, at, cfg);
  return m.base + m.bonus * g;
}

/**
 * Advances the simulation to `now`. Never goes backwards (a clock moved back is ignored).
 * `frozen` (Guardería / Abatido) pauses everything.
 */
export function advanceCare(s: CareState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG, frozen = false): void {
  if (now <= s.updatedAt) return;
  if (frozen) {
    s.updatedAt = now;
    return;
  }
  let t = s.updatedAt;
  let guard = 0;
  while (t < now && guard++ < 1_000_000) {
    const dampAt = s.lastInteractionAt + cfg.dampAfterHours * HOUR;
    const nextPoop = s.pendingPoops.length ? Math.min(...s.pendingPoops) : Infinity;
    const rates = s.asleep ? cfg.asleep : cfg.awake;
    const damp = t >= dampAt ? cfg.dampFactor : 1;
    // Wake-up event when energy fills up while asleep.
    let wakeAt = Infinity;
    if (s.asleep && rates.energy > 0) wakeAt = t + ((100 - s.needs.energy) / rates.energy) * HOUR;
    let next = Math.min(now, nextPoop, wakeAt);
    if (t < dampAt) next = Math.min(next, dampAt);
    // Growth depends on satisfaction, which changes within a segment: integrate it in ≤15-min steps.
    next = Math.min(next, t + 15 * 60_000);
    if (next <= t) next = Math.min(now, t + 1); // safety: always progress

    const dtH = (next - t) / HOUR;
    // Growth uses the state at the start of the segment (piecewise-constant rate).
    s.maturity += growthRate(s, t, cfg) * dtH;
    for (const n of NEED_IDS) {
      let r = rates[n];
      if (n === "hygiene") r -= s.poops.length * cfg.poopHygienePerHour;
      if (r < 0) {
        r *= damp;
        const v = s.needs[n] + r * dtH;
        // time never pushes below the floor (but does not raise a need that is already lower)
        s.needs[n] = Math.min(s.needs[n], Math.max(v, cfg.floor));
      } else {
        s.needs[n] = clamp(s.needs[n] + r * dtH, 0, 100);
      }
    }
    t = next;
    // Process events at t.
    const due = s.pendingPoops.filter((p) => p <= t);
    if (due.length) {
      s.pendingPoops = s.pendingPoops.filter((p) => p > t);
      for (const p of due) if (s.poops.length < cfg.maxPoops) s.poops.push(p);
    }
    if (s.asleep && s.needs.energy >= 100) s.asleep = false;
  }
  s.updatedAt = now;
  s.playLog = s.playLog.filter((p) => p > now - 24 * HOUR);
}

// ── Actions ──────────────────────────────────────────────────────────────────

export type CareReaction =
  | "eat" | "eat_favorite" | "refuse_full" | "bathe" | "clean" | "pet" | "pet_saturated"
  | "play" | "too_tired" | "sleep" | "wake" | "already_asleep" | "dislike";

export interface FoodDef {
  id: string;
  hunger: number;
  happiness: number;
  energy: number;
  /** Families that love it (bonus happiness, "eat_favorite" reaction). */
  favoriteOf: string[];
  dislikedBy: string[];
  /** Effect id applied on the next Arena fight (BALANCE_CONFIG). */
  buff?: string;
}

function touch(s: CareState, now: number, playMinutes = 0): void {
  s.lastInteractionAt = now;
  for (let i = 0; i < Math.ceil(playMinutes / 3); i++) s.playLog.push(now);
}

const dayOf = (now: number) => Math.floor(now / (24 * HOUR));

export function feed(s: CareState, food: FoodDef, family: string, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): CareReaction {
  advanceCare(s, now, cfg);
  if (s.asleep) return "already_asleep";
  if (s.needs.hunger >= 95) {
    // Overfeeding: refuses, small happiness penalty (incorrect feeding).
    s.needs.happiness = clamp(s.needs.happiness - 3, 0, 100);
    touch(s, now);
    return "refuse_full";
  }
  const disliked = food.dislikedBy.includes(family);
  const fav = food.favoriteOf.includes(family);
  s.needs.hunger = clamp(s.needs.hunger + food.hunger, 0, 100);
  s.needs.energy = clamp(s.needs.energy + food.energy, 0, 100);
  s.needs.happiness = clamp(s.needs.happiness + (disliked ? -8 : food.happiness + (fav ? 10 : 0)), 0, 100);
  s.pendingPoops.push(now + (cfg.poopAfterMin + (Math.abs(Math.sin(now)) * cfg.poopJitterMin)) * 60_000);
  touch(s, now, 3);
  return disliked ? "dislike" : fav ? "eat_favorite" : "eat";
}

export function bathe(s: CareState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): CareReaction {
  advanceCare(s, now, cfg);
  if (s.asleep) return "already_asleep";
  s.needs.hygiene = clamp(s.needs.hygiene + 60, 0, 100);
  s.needs.happiness = clamp(s.needs.happiness + 4, 0, 100);
  touch(s, now, 3);
  return "bathe";
}

/** Picks up one poop (or wipes the Tamtam when there are none). */
export function clean(s: CareState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): CareReaction {
  advanceCare(s, now, cfg);
  if (s.poops.length) s.poops.shift();
  s.needs.hygiene = clamp(s.needs.hygiene + 20, 0, 100);
  touch(s, now);
  return "clean";
}

export const MAX_PETS_PER_DAY = 20;

export function pet(s: CareState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): CareReaction {
  advanceCare(s, now, cfg);
  const key = `${dayOf(now)}|pets`;
  const n = (s.counters[key] ?? 0) + 1;
  s.counters[key] = n;
  touch(s, now, 1);
  if (n > MAX_PETS_PER_DAY) return "pet_saturated";
  s.needs.affection = clamp(s.needs.affection + 8, 0, 100);
  s.needs.happiness = clamp(s.needs.happiness + 3, 0, 100);
  return "pet";
}

export function play(s: CareState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): CareReaction {
  advanceCare(s, now, cfg);
  if (s.asleep) return "already_asleep";
  if (s.needs.energy < 15) return "too_tired";
  s.needs.happiness = clamp(s.needs.happiness + 15, 0, 100);
  s.needs.activity = clamp(s.needs.activity + 20, 0, 100);
  s.needs.energy = clamp(s.needs.energy - 5, 0, 100);
  touch(s, now, 6);
  return "play";
}

export function goToSleep(s: CareState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): CareReaction {
  advanceCare(s, now, cfg);
  if (s.asleep) return "already_asleep";
  s.asleep = true;
  touch(s, now);
  return "sleep";
}

export function wakeUp(s: CareState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): CareReaction {
  advanceCare(s, now, cfg);
  s.asleep = false;
  touch(s, now);
  return "wake";
}

/** Spends energy/hunger for an activity; returns false (no change) if too tired. */
export function spendForActivity(s: CareState, now: number, energy: number, hunger: number, playMinutes: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): boolean {
  advanceCare(s, now, cfg);
  if (s.asleep || s.needs.energy < energy) return false;
  s.needs.energy = clamp(s.needs.energy - energy, 0, 100);
  s.needs.hunger = clamp(s.needs.hunger - hunger, 0, 100);
  s.needs.activity = clamp(s.needs.activity + 15, 0, 100);
  touch(s, now, playMinutes);
  return true;
}

/** Dominant mood used to pick the idle animation and the expression. */
export function mood(s: CareState): "asleep" | "hungry" | "sad" | "tired" | "dirty" | "happy" | "ok" {
  if (s.asleep) return "asleep";
  if (s.needs.hunger < 35) return "hungry";
  if (s.needs.energy < 25) return "tired";
  if (s.needs.hygiene < 35 || s.poops.length >= 2) return "dirty";
  if (s.needs.happiness < 35 || s.needs.affection < 30) return "sad";
  if (satisfaction(s.needs) > 75) return "happy";
  return "ok";
}

export function stageEligible(s: CareState, stage: "baby" | "child" | "juvenile", cfg: CareConfig = DEFAULT_CARE_CONFIG): boolean {
  const need = stage === "baby" ? cfg.maturityThresholds.baby : stage === "child" ? cfg.maturityThresholds.child - cfg.maturityThresholds.baby : cfg.maturityThresholds.juvenile - cfg.maturityThresholds.child;
  return s.maturity >= need;
}
