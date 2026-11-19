/**
 * Arena (vertical slice): real-time automatic combat, deterministic (seeded) so a fight can be
 * replayed and, later, validated by a server (GAMEPLAY_SYSTEMS §5). Simplified rules:
 * 20 Hz simulation, attack cadence from speed, dodge, crits, one signature skill with cooldown,
 * elemental multiplier, 60 s limit. Ranks: Bronce → Leyenda with competitive points (PC).
 */
import { CHISPIN_GENOME, type Genome } from "../genetics/genome";
import { rollEvolution } from "../genetics/evolve";
import { FAMILIES } from "../genetics/families";

export interface Fighter {
  name: string;
  formId: string;
  alleleId: string;
  hp: number;
  str: number;
  def: number;
  spd: number;
  crit: number; // 0–100 rating
  skillPower: number; // multiplier for the signature skill
  skillCooldown: number; // seconds
  skillName?: string;
  /** Evolved body plan (absent = baby Chispín). */
  genome?: Genome;
  stage?: string;
}

export type BattleEvent =
  | { t: number; type: "attack"; by: 0 | 1 }
  | { t: number; type: "skill"; by: 0 | 1; name: string }
  | { t: number; type: "hit"; on: 0 | 1; dmg: number; crit: boolean; hp: number }
  | { t: number; type: "dodge"; by: 0 | 1 }
  | { t: number; type: "end"; winner: 0 | 1 | -1 };

export interface BattleResult {
  events: BattleEvent[];
  winner: 0 | 1 | -1;
  duration: number;
  hpLeft: [number, number];
}

function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return ((a >>> 0) % 1_000_000) / 1_000_000;
  };
}

export function simulateBattle(a: Fighter, b: Fighter, seed: number): BattleResult {
  const r = rng(seed);
  const f = [a, b];
  const hp: [number, number] = [a.hp, b.hp];
  // Symmetric, seeded openings: neither side always strikes first.
  const next = [0.6 / (1 + a.spd / 120) + r() * 0.4, 0.6 / (1 + b.spd / 120) + r() * 0.4];
  const skillAt = [a.skillCooldown * (0.5 + r() * 0.2), b.skillCooldown * (0.5 + r() * 0.2)];
  let tick = 0;
  const events: BattleEvent[] = [];
  const dt = 0.05;
  let t = 0;
  while (t < 60 && hp[0] > 0 && hp[1] > 0) {
    t = Math.round((t + dt) * 100) / 100;
    tick++;
    for (const i of (tick % 2 ? [0, 1] : [1, 0]) as (0 | 1)[]) {
      if (hp[0] <= 0 || hp[1] <= 0) break;
      const me = f[i]!;
      const foe = f[1 - i]!;
      const o = (1 - i) as 0 | 1;
      let power = 0;
      if (t >= skillAt[i]!) {
        power = me.skillPower;
        skillAt[i] = t + me.skillCooldown;
        events.push({ t, type: "skill", by: i, name: me.skillName ?? "Lluvia de Ascuas" });
      } else if (t >= next[i]!) {
        power = 1;
        events.push({ t, type: "attack", by: i });
      }
      if (power === 0) continue;
      next[i] = t + 1.8 / (1 + me.spd / 120);
      const dodge = Math.min(0.25, Math.max(0.02, 0.04 + (foe.spd - me.spd) / 400));
      if (r() < dodge) {
        events.push({ t: t + 0.25, type: "dodge", by: o });
        continue;
      }
      const crit = r() < Math.min(0.35, 0.05 + me.crit / 400);
      const variance = 0.92 + r() * 0.16;
      const dmg = Math.max(1, Math.round(me.str * power * variance * (crit ? 1.5 : 1) * (100 / (100 + foe.def)) * 0.9));
      hp[o] = Math.max(0, hp[o] - dmg);
      events.push({ t: t + 0.25, type: "hit", on: o, dmg, crit, hp: hp[o] });
    }
  }
  const winner: 0 | 1 | -1 = hp[1] <= 0 ? 0 : hp[0] <= 0 ? 1 : hp[0] / a.hp > hp[1] / b.hp ? 0 : hp[1] / b.hp > hp[0] / a.hp ? 1 : -1;
  events.push({ t: t + 0.4, type: "end", winner });
  return { events, winner, duration: t + 0.4, hpLeft: hp };
}

export const RANKS = ["Bronce", "Plata", "Oro", "Platino", "Diamante", "Maestro", "Leyenda"] as const;
export const RANK_PC = [0, 300, 700, 1200, 1800, 2500, 3300];

export function rankOf(pc: number): { index: number; name: string; division: string; toNext: number } {
  let i = 0;
  for (let k = 0; k < RANK_PC.length; k++) if (pc >= RANK_PC[k]!) i = k;
  const lo = RANK_PC[i]!;
  const hi = RANK_PC[i + 1] ?? lo;
  const div = i >= 5 ? "" : ["III", "II", "I"][Math.min(2, Math.floor(((pc - lo) / Math.max(1, hi - lo)) * 3))]!;
  return { index: i, name: RANKS[i]!, division: div, toNext: Math.max(0, hi - pc) };
}

export interface ArenaState {
  pc: number;
  wins: number;
  losses: number;
  streak: number;
  history: { at: number; rival: string; won: boolean; pc: number; coins: number }[];
  applied: string[]; // idempotency of fight results
}

export function newArenaState(): ArenaState {
  return { pc: 0, wins: 0, losses: 0, streak: 0, history: [], applied: [] };
}

export type Difficulty = "easy" | "even" | "hard";
export const DIFF = {
  easy: { mul: 0.85, win: 12, loss: -20, coins: 25, label: "Fácil" },
  even: { mul: 1.0, win: 20, loss: -15, coins: 40, label: "Igualado" },
  hard: { mul: 1.15, win: 30, loss: -8, coins: 60, label: "Difícil" },
} as const;

const RIVAL_NAMES = ["Tizona", "Brasero", "Pirox", "Cendra", "Fogón", "Ascuro", "Volcán", "Chispa", "Rescoldo", "Hornillo"];
const RIVAL_ALLELES = ["ceniza", "oro", "rubi", "azul", "brasa"];

/** Three rivals around the player's power (deterministic per day and rank). */
export function makeRivals(me: Fighter, seed: number): { fighter: Fighter; difficulty: Difficulty }[] {
  const r = rng(seed);
  return (["easy", "even", "hard"] as Difficulty[]).map((d) => {
    const m = DIFF[d].mul * (0.96 + r() * 0.08);
    return {
      difficulty: d,
      fighter: {
        ...me,
        name: RIVAL_NAMES[Math.floor(r() * RIVAL_NAMES.length)]!,
        alleleId: RIVAL_ALLELES[Math.floor(r() * RIVAL_ALLELES.length)]!,
        hp: Math.round(me.hp * m),
        str: Math.round(me.str * m),
        def: Math.round(me.def * m),
        spd: Math.round(me.spd * (0.9 + r() * 0.2)),
        crit: Math.round(me.crit * (0.8 + r() * 0.4)),
        ...(me.genome ? rivalForm(r) : { genome: undefined, skillName: undefined }),
      },
    };
  });
}

/** Applies a finished fight once (idempotent by fightId). */
export function recordFight(a: ArenaState, fightId: string, rival: string, d: Difficulty, won: boolean, at: number): { pc: number; coins: number; duplicate: boolean } {
  if (a.applied.includes(fightId)) return { pc: 0, coins: 0, duplicate: true };
  a.applied.push(fightId);
  if (a.applied.length > 200) a.applied.shift();
  const rank = rankOf(a.pc);
  let pc = won ? DIFF[d].win + Math.min(9, a.streak * 3) : DIFF[d].loss;
  if (!won && rank.index <= 1) pc = Math.max(pc, RANK_PC[rank.index]! - a.pc); // no relegation in Bronze/Silver
  a.pc = Math.max(0, a.pc + pc);
  a.streak = won ? a.streak + 1 : 0;
  if (won) a.wins++;
  else a.losses++;
  const coins = won ? DIFF[d].coins : Math.round(DIFF[d].coins / 3);
  a.history.unshift({ at, rival, won, pc, coins });
  a.history = a.history.slice(0, 50);
  return { pc, coins, duplicate: false };
}

/** Evolved rivals get a random form (a random care style) so the Arena shows the variety of Tamtams. */
function rivalForm(r: () => number): { genome: Genome; skillName: string } {
  const p = { care: r(), affection: r(), hygiene: r(), training: r(), fighting: r(), study: r(), play: r(), neglect: 0 };
  p.neglect = 1 - p.care;
  const g = rollEvolution(CHISPIN_GENOME, p, Math.floor(r() * 1e9)).genome;
  return { genome: g, skillName: FAMILIES[g.parts.back].skill };
}
