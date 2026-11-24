import { advanceCare, bathe, type CareReaction } from "../care/needs";
import { credit } from "../economy/wallet";
import { GameRuleError, type GameState } from "./game";

/**
 * "Feels alive" layer (references batch 2, PLAN_MEJORAS phase A):
 * - care pays a little (coins + caretaker XP) with daily caps, like the reference pet games;
 * - caretaker level 1–60 unlocks shop items (CatalogItem.level) and features;
 * - timed Tamtam problems solved with short tactile challenges;
 * - speech lines by need.
 */

export interface LifeState {
  xp: number; // caretaker XP inside the current level
  totalXp: number;
  problem: { id: ProblemId; since: number; until: number } | null;
  nextProblemAt: number;
  problemsSolved: number;
  /** Day-scoped reward counters `${day}|${kind}`. */
  caps: Record<string, number>;
}

export const MAX_LEVEL = 60;
/** XP to go from level n to n+1 (n ≥ 1): 30 at level 1 … ~4.000 near 60. */
export const xpForLevel = (n: number) => Math.round(25 + 9 * n + 1.05 * n * n);

export function life(s: GameState): LifeState {
  const g = s as GameState & { life?: LifeState };
  if (!g.life) g.life = { xp: 0, totalXp: 0, problem: null, nextProblemAt: (s.tamtam?.bornAt ?? s.createdAt) + 2 * HOUR, problemsSolved: 0, caps: {} };
  return g.life;
}

/** Read-only view (never mutates: safe on frozen/readonly state). */
export function peekLife(s: Readonly<GameState>): LifeState {
  return (s as GameState & { life?: LifeState }).life ?? { xp: 0, totalXp: 0, problem: null, nextProblemAt: Infinity, problemsSolved: 0, caps: {} };
}

const HOUR = 3_600_000;
const dayOf = (t: number) => Math.floor(t / 86_400_000);

/** What each care action pays (base values; coins get ± variation). Daily caps stop farming. */
export const CARE_PAY = {
  pet: { coins: 8, vary: 2, xp: 6, cap: 25 },
  bath: { coins: 25, vary: 10, xp: 20, cap: 4 },
  poop: { coins: 6, vary: 0, xp: 8, cap: 30 },
  feed: { coins: 0, vary: 0, xp: 5, cap: 20 },
  play: { coins: 0, vary: 0, xp: 15, cap: 30 },
  gym: { coins: 0, vary: 0, xp: 15, cap: 20 },
  study: { coins: 0, vary: 0, xp: 15, cap: 20 },
  fight: { coins: 0, vary: 0, xp: 12, cap: 20 },
  problem: { coins: 20, vary: 5, xp: 30, cap: 10 },
  harvest: { coins: 0, vary: 0, xp: 4, cap: 60 },
} as const;
export type CareKindPay = keyof typeof CARE_PAY;

export interface PayResult {
  coins: number;
  xp: number;
  levelUp: number[]; // new levels reached
  capped: boolean;
}

/** Grants the reward of one care action (idempotent per action timestamp). */
export function payCare(s: GameState, kind: CareKindPay, now: number, quality = 1): PayResult {
  const L = life(s);
  const def = CARE_PAY[kind];
  const key = `${dayOf(now)}|${kind}`;
  const n = L.caps[key] ?? 0;
  if (n >= def.cap) return { coins: 0, xp: 0, levelUp: [], capped: true };
  L.caps[key] = n + 1;
  // Drop counters of past days.
  for (const k of Object.keys(L.caps)) if (Number(k.split("|")[0]) < dayOf(now) - 1) delete L.caps[k];
  const q = Math.max(0.3, Math.min(1.5, quality));
  const v = def.vary ? Math.round(((now % 997) / 997) * 2 * def.vary - def.vary) : 0;
  const coins = Math.max(0, Math.round((def.coins + v) * q));
  if (coins > 0) credit(s.economy.wallet, { key: `care:${kind}:${now}`, currency: "tamcoin", amount: coins, kind: "reward", source: `care:${kind}`, ts: now });
  const xp = Math.round(def.xp * q);
  return { coins, xp, levelUp: addCaretakerXp(s, xp), capped: false };
}

export function addCaretakerXp(s: GameState, xp: number): number[] {
  const L = life(s);
  const ups: number[] = [];
  L.totalXp += xp;
  L.xp += xp;
  while (s.economy.caretakerLevel < MAX_LEVEL && L.xp >= xpForLevel(s.economy.caretakerLevel)) {
    L.xp -= xpForLevel(s.economy.caretakerLevel);
    s.economy.caretakerLevel += 1;
    ups.push(s.economy.caretakerLevel);
  }
  if (s.economy.caretakerLevel >= MAX_LEVEL) L.xp = 0;
  return ups;
}

/** Features unlocked by caretaker level (shop items use CatalogItem.level). */
export const LEVEL_FEATURES: { level: number; id: string; label: string }[] = [
  { level: 2, id: "room_kitchen", label: "Cocina" },
  { level: 3, id: "berry_tree", label: "Árbol de bayas en la Granja" },
  { level: 4, id: "room_bath", label: "Baño" },
  { level: 5, id: "photo", label: "Modo foto" },
  { level: 6, id: "room_bedroom", label: "Dormitorio" },
  { level: 8, id: "wardrobe", label: "Armario (ropa y accesorios)" },
  { level: 10, id: "arena_school", label: "Escuela de combate" },
  { level: 12, id: "farm_slot_2", label: "Segunda plaza en la Granja" },
];
export const hasFeature = (s: GameState, id: string) => (LEVEL_FEATURES.find((f) => f.id === id)?.level ?? 1) <= s.economy.caretakerLevel;

// ── Bath with steps (soap → rinse → towel) ──────────────────────────────────
/** quality 0–1: how thoroughly each step was rubbed. Hygiene gain 25–70. */
export function finishBath(s: GameState, quality: number, now: number): { reaction: CareReaction; pay: PayResult | null } {
  if (!s.tamtam) throw new GameRuleError("no_tamtam");
  const q = Math.max(0, Math.min(1, quality));
  const reaction = bathe(s.care, now, undefined, Math.round(25 + 45 * q));
  if (reaction !== "bathe") return { reaction, pay: null };
  return { reaction, pay: payCare(s, "bath", now, 0.6 + 0.6 * q) };
}

// ── Problems ─────────────────────────────────────────────────────────────────
export type ProblemId = "thorn" | "ash" | "cold" | "tangle";
export const PROBLEMS: Record<ProblemId, { name: string; hint: string; penalty: { need: "happiness" | "hygiene" | "energy"; amount: number } }> = {
  thorn: { name: "Espina en la pata", hint: "Mantén y tira de la espina hacia fuera.", penalty: { need: "happiness", amount: 15 } },
  ash: { name: "Ceniza en la cresta", hint: "Frota la cresta hasta que brille.", penalty: { need: "hygiene", amount: 15 } },
  cold: { name: "Resfriado", hint: "Prepara la poción: toca los ingredientes en el orden de la receta.", penalty: { need: "energy", amount: 20 } },
  tangle: { name: "Nudo de lianas en la cola", hint: "Desliza siguiendo el nudo para deshacerlo.", penalty: { need: "happiness", amount: 10 } },
};
const PROBLEM_IDS = Object.keys(PROBLEMS) as ProblemId[];
const PROBLEM_WINDOW = 2 * HOUR;

/** Called on every tick: spawns a problem every 3–6 h; unsolved problems expire with a small penalty. */
export function tickLife(s: GameState, now: number): { spawned?: ProblemId; expired?: ProblemId } {
  if (s.phase !== "home" || !s.tamtam) return {};
  const L = life(s);
  if (L.problem && now >= L.problem.until) {
    const p = PROBLEMS[L.problem.id];
    advanceCare(s.care, now);
    s.care.needs[p.penalty.need] = Math.max(0, s.care.needs[p.penalty.need] - p.penalty.amount);
    const expired = L.problem.id;
    L.problem = null;
    L.nextProblemAt = now + schedule(now);
    return { expired };
  }
  if (!L.problem && now >= L.nextProblemAt && !s.care.asleep) {
    // Dirty or hungry Tamtams catch colds more often.
    const sickly = s.care.needs.hygiene < 25 || s.care.needs.hunger < 25;
    const r = ((now / 60_000) * 9301 + 49297) % 233280 / 233280;
    const id: ProblemId = sickly && r < 0.6 ? "cold" : PROBLEM_IDS[Math.floor(r * PROBLEM_IDS.length) % PROBLEM_IDS.length]!;
    L.problem = { id, since: now, until: now + PROBLEM_WINDOW };
    return { spawned: id };
  }
  return {};
}
const schedule = (now: number) => (3 + ((now / 1000) % 3)) * HOUR;

export function solveProblem(s: GameState, now: number, quality = 1): PayResult {
  const L = life(s);
  if (!L.problem) throw new GameRuleError("no_problem");
  advanceCare(s.care, now);
  s.care.needs.happiness = Math.min(100, s.care.needs.happiness + 10);
  s.care.needs.affection = Math.min(100, s.care.needs.affection + 6);
  L.problem = null;
  L.problemsSolved += 1;
  L.nextProblemAt = now + schedule(now);
  return payCare(s, "problem", now, quality);
}

/** Debug / tests: force a problem now. */
export function debugProblem(s: GameState, id: ProblemId, now: number): void {
  life(s).problem = { id, since: now, until: now + PROBLEM_WINDOW };
}

// ── Speech lines ─────────────────────────────────────────────────────────────
export type SpeechMood = "hungry" | "dirty" | "bored" | "tired" | "lonely" | "sick" | "happy" | "problem";
export const SPEECH: Record<SpeechMood, string[]> = {
  hungry: ["¡Me ruge la tripa!", "¿Hay algo picante para comer?", "Huelo comida… ¿es para mí?", "Tengo un hambre de dragón.", "Un bocado y vuelvo a ser yo."],
  dirty: ["Creo que necesito un baño…", "Huelo a ceniza vieja.", "¿Me das una ducha? Porfa.", "Tengo barro hasta en la cresta.", "Las moscas me han hecho su casa."],
  bored: ["¿Jugamos a algo?", "Me aburro como una piedra.", "¡Vamos a la Arena! O a un minijuego.", "Tengo energía para quemar.", "¿Me lanzas la pelota?"],
  tired: ["Bostezo… un ratito de siesta…", "Se me cierran los ojos.", "Necesito dormir un poco.", "Hoy ha sido un día largo."],
  lonely: ["¿Me haces mimos?", "Te echaba de menos.", "Acaríciame la cresta, ¡me encanta!", "¿Te quedas un rato conmigo?"],
  sick: ["Me encuentro fatal…", "Atchís… ¿tienes una poción?", "Tengo la cresta apagada."],
  happy: ["¡Hoy es un gran día!", "¡Me encanta esta casa!", "¿Has visto lo que brillo?", "¡Somos el mejor equipo!", "Me siento fuerte."],
  problem: ["¡Ay! Algo me molesta…", "¿Me ayudas? Mira…", "¡Socorro! ¡Esto pica!"],
};

/** Most urgent thing the Tamtam wants to say right now (deterministic per minute). */
export function speechFor(s: Readonly<GameState>, now: number): { mood: SpeechMood; text: string } {
  const n = s.care.needs;
  const L = peekLife(s);
  let mood: SpeechMood = "happy";
  if (L.problem) mood = L.problem.id === "cold" ? "sick" : "problem";
  else if (n.hunger < 35) mood = "hungry";
  else if (n.hygiene < 35 || s.care.poops.length >= 2) mood = "dirty";
  else if (n.energy < 25) mood = "tired";
  else if (n.affection < 35) mood = "lonely";
  else if (n.happiness < 40 || n.activity < 30) mood = "bored";
  const list = SPEECH[mood];
  return { mood, text: list[Math.floor(now / 60_000) % list.length]! };
}
