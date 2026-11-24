/**
 * Arena (vertical slice): real-time automatic combat, deterministic (seeded) so a fight can be
 * replayed and, later, validated by a server (GAMEPLAY_SYSTEMS §5). Simplified rules:
 * 20 Hz simulation, attack cadence from speed, dodge, crits, one signature skill with cooldown,
 * elemental multiplier, 60 s limit. Ranks: Bronce → Leyenda with competitive points (PC).
 */
import { CHISPIN_GENOME, type Genome } from "../genetics/genome";
import { rollEvolution } from "../genetics/evolve";
import { FAMILIES, type FamilyId } from "../genetics/families";

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
  /** Arena techniques (cards) and dominant family for matchups. */
  techniques?: TechniqueId[];
  family?: FamilyId;
  /** Companion from the Granja: extra small hits every few seconds. */
  companion?: { name: string; power: number } | null;
  /** First strike (ether technique or Rayo school). */
  firstStrike?: boolean;
  dodgeBonus?: number;
}

/** Techniques: one per family (references batch 3: My Brute skills, redesigned). */
export type TechniqueId = "embers" | "armor" | "reflect" | "phantom" | "roots" | "whirl" | "bounce" | "gust" | "fierce";
export const TECHNIQUES: Record<TechniqueId, { family: FamilyId; name: string; desc: string }> = {
  embers: { family: "fire", name: "Ascuas", desc: "Su habilidad deja quemaduras: daño extra durante 3 s." },
  armor: { family: "metal", name: "Coraza", desc: "Recibe un 12 % menos de daño." },
  reflect: { family: "crystal", name: "Reflejo", desc: "20 % de probabilidad de devolver la mitad del golpe." },
  phantom: { family: "ghost", name: "Esquiva fantasma", desc: "+10 % de esquiva." },
  roots: { family: "plant", name: "Raíces", desc: "Una vez por combate inmoviliza al rival 2 s." },
  whirl: { family: "water", name: "Torbellino", desc: "Su habilidad retrasa el siguiente ataque rival." },
  bounce: { family: "gel", name: "Rebote", desc: "Una vez por combate sobrevive con 1 de vida." },
  gust: { family: "ether", name: "Corriente", desc: "Golpea primero y es más rápido." },
  fierce: { family: "reptile", name: "Mordisco feroz", desc: "Sus ataques no se pueden esquivar." },
};
/** Matchups: each family beats the next one in its triangle (+15 % damage). */
export const BEATS: Record<FamilyId, FamilyId> = { fire: "plant", plant: "water", water: "fire", metal: "crystal", crystal: "ghost", ghost: "metal", gel: "reptile", reptile: "ether", ether: "gel" };
export function matchup(att?: FamilyId, def?: FamilyId): number {
  if (!att || !def) return 1;
  return BEATS[att] === def ? 1.15 : BEATS[def] === att ? 0.87 : 1;
}

export type BattleEvent =
  | { t: number; type: "attack"; by: 0 | 1 }
  | { t: number; type: "skill"; by: 0 | 1; name: string }
  | { t: number; type: "hit"; on: 0 | 1; dmg: number; crit: boolean; hp: number }
  | { t: number; type: "dodge"; by: 0 | 1 }
  | { t: number; type: "technique"; by: 0 | 1; name: string }
  | { t: number; type: "companion"; by: 0 | 1; name: string }
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
  const has = (i: number, tq: TechniqueId) => !!f[i]!.techniques?.includes(tq);
  for (const i of [0, 1]) if (f[i]!.firstStrike || has(i, "gust")) next[i] = 0.1;
  const burns: { on: 0 | 1; at: number; dmg: number }[] = [];
  const rootsUsed = [false, false];
  const bounceUsed = [false, false];
  const compAt = [3, 3];
  const deal = (to: 0 | 1, dmg: number, at: number, crit: boolean) => {
    if (hp[to] - dmg <= 0 && has(to, "bounce") && !bounceUsed[to]) {
      bounceUsed[to] = true;
      dmg = hp[to] - 1;
      events.push({ t: at, type: "technique", by: to, name: TECHNIQUES.bounce.name });
    }
    hp[to] = Math.max(0, hp[to] - dmg);
    events.push({ t: at, type: "hit", on: to, dmg, crit, hp: hp[to] });
  };
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
      // Burns (embers) tick on the foe.
      for (let k = burns.length - 1; k >= 0; k--) if (burns[k]!.on === o && t >= burns[k]!.at) {
        deal(o, burns[k]!.dmg, t, false);
        burns.splice(k, 1);
      }
      if (hp[o] <= 0) break;
      // Roots: once per fight, a few seconds in.
      if (has(i, "roots") && !rootsUsed[i] && t >= 4) {
        rootsUsed[i] = true;
        next[o] = Math.max(next[o]!, t + 2);
        skillAt[o] = Math.max(skillAt[o]!, t + 2);
        events.push({ t, type: "technique", by: i, name: TECHNIQUES.roots.name });
      }
      // Companion from the Granja.
      if (me.companion && t >= compAt[i]!) {
        compAt[i] = t + 3.2;
        events.push({ t, type: "companion", by: i, name: me.companion.name });
        deal(o, Math.max(1, Math.round(me.companion.power * (100 / (100 + foe.def)))), t + 0.2, false);
        if (hp[o] <= 0) break;
      }
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
      const isSkill = power !== 1;
      if (isSkill && has(i, "whirl")) {
        next[o] = next[o]! + 0.8;
        events.push({ t, type: "technique", by: i, name: TECHNIQUES.whirl.name });
      }
      const dodge = Math.min(0.35, Math.max(0.02, 0.04 + (foe.spd - me.spd) / 400 + (foe.dodgeBonus ?? 0) + (has(o, "phantom") ? 0.1 : 0)));
      if (!has(i, "fierce") && r() < dodge) {
        events.push({ t: t + 0.25, type: "dodge", by: o });
        continue;
      }
      const crit = r() < Math.min(0.35, 0.05 + me.crit / 400);
      const variance = 0.92 + r() * 0.16;
      let dmg = Math.max(1, Math.round(me.str * power * variance * (crit ? 1.5 : 1) * (100 / (100 + foe.def)) * 0.9 * matchup(me.family, foe.family) * (has(o, "armor") ? 0.88 : 1)));
      deal(o, dmg, t + 0.25, crit);
      if (isSkill && has(i, "embers")) burns.push({ on: o, at: t + 1, dmg: Math.max(1, Math.round(foe.hp * 0.04)) }, { on: o, at: t + 2, dmg: Math.max(1, Math.round(foe.hp * 0.04)) }, { on: o, at: t + 3, dmg: Math.max(1, Math.round(foe.hp * 0.04)) });
      if (has(o, "reflect") && hp[o] > 0 && r() < 0.2) {
        dmg = Math.max(1, Math.round(dmg * 0.5));
        events.push({ t: t + 0.3, type: "technique", by: o, name: TECHNIQUES.reflect.name });
        deal(i, dmg, t + 0.35, false);
      }
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
