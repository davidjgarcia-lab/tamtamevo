import { FAMILIES, type FamilyId } from "../genetics/families";
import { rng } from "../genetics/evolve";
import type { GameState } from "./game";

import { TECHNIQUES, type Fighter, type TechniqueId } from "./arena";

/**
 * Arena progression (PLAN_MEJORAS phase C, references batch 3):
 * Arena level from fights with a "choose 1 of 2" card on each level-up (stat, technique or companion),
 * 5 fights per day, a consolation fight after 3 losses, schools at caretaker level 10,
 * a weekly local leaderboard with badges, and revenge/replay of the last fight.
 * Everything is local: rivals and leaderboard are generated on the device (no server).
 */
export type StatCard = "hp" | "str" | "def" | "spd" | "crit";
export type CardId = `stat:${StatCard}` | `tech:${TechniqueId}` | "companion";
export type SchoolId = "garra" | "pluma" | "rayo";
export const SCHOOLS: Record<SchoolId, { name: string; desc: string }> = {
  garra: { name: "Escuela Garra", desc: "+8 % de fuerza." },
  pluma: { name: "Escuela Pluma", desc: "+5 % de esquiva." },
  rayo: { name: "Escuela Rayo", desc: "Golpea siempre primero." },
};
export const STAT_CARDS: Record<StatCard, { name: string; desc: string; mul: number }> = {
  hp: { name: "Vitalidad", desc: "+10 % de vida", mul: 0.1 },
  str: { name: "Fuerza", desc: "+8 % de fuerza", mul: 0.08 },
  def: { name: "Aguante", desc: "+8 % de defensa", mul: 0.08 },
  spd: { name: "Agilidad", desc: "+8 % de velocidad", mul: 0.08 },
  crit: { name: "Puntería", desc: "+10 de crítico", mul: 10 },
};
export const ARENA_ENERGY = 5;
export const SCHOOL_LEVEL = 10;

export interface ArenaPro {
  xp: number;
  level: number;
  cards: CardId[];
  offer: CardId[] | null;
  energy: { day: number; used: number; losses: number; consolation: boolean };
  school: SchoolId | null;
  week: { id: number; wins: number };
  badges: string[];
  last: { rival: Fighter; difficulty: "easy" | "even" | "hard"; seed: number; won: boolean } | null;
}
const dayOf = (t: number) => Math.floor(t / 86_400_000);
const weekOf = (t: number) => Math.floor((t / 86_400_000 + 3) / 7); // weeks start on Monday
const fresh = (): ArenaPro => ({ xp: 0, level: 1, cards: [], offer: null, energy: { day: -1, used: 0, losses: 0, consolation: false }, school: null, week: { id: -1, wins: 0 }, badges: [], last: null });

export function arenaPro(s: GameState): ArenaPro {
  const a = s.arena as GameState["arena"] & { pro?: ArenaPro };
  if (!a.pro) a.pro = fresh();
  return a.pro;
}
export function peekArenaPro(s: Readonly<GameState>): ArenaPro {
  return (s.arena as GameState["arena"] & { pro?: ArenaPro }).pro ?? fresh();
}
export const arenaXpFor = (level: number) => 60 + 40 * level;

/** Fight availability: energy per day, the consolation fight, and the Tamtam's condition. */
export function arenaGate(s: Readonly<GameState>, now: number): { ok: boolean; left: number; consolation: boolean; reason: string | null } {
  const p = peekArenaPro(s);
  const sameDay = p.energy.day === dayOf(now);
  const used = sameDay ? p.energy.used : 0;
  const losses = sameDay ? p.energy.losses : 0;
  const consolation = used >= ARENA_ENERGY && losses >= 3 && !(sameDay && p.energy.consolation);
  const n = s.care.needs;
  if (s.care.asleep || s.care.napUntil && s.care.napUntil > now) return { ok: false, left: ARENA_ENERGY - used, consolation, reason: "Está durmiendo." };
  if (n.energy < 15) return { ok: false, left: ARENA_ENERGY - used, consolation, reason: "Está agotado: déjale descansar." };
  if (n.hunger < 10) return { ok: false, left: ARENA_ENERGY - used, consolation, reason: "Tiene demasiada hambre para luchar." };
  if (used >= ARENA_ENERGY && !consolation) return { ok: false, left: 0, consolation: false, reason: "Sin energía de Arena hasta mañana." };
  return { ok: true, left: Math.max(0, ARENA_ENERGY - used), consolation, reason: null };
}

/** Called after each fight: energy, XP, level-ups (offers 2 cards), weekly wins and the replay record. */
export function afterFight(s: GameState, now: number, won: boolean, last: ArenaPro["last"]): { xp: number; levelUp: boolean; consolation: boolean } {
  const p = arenaPro(s);
  const d = dayOf(now);
  if (p.energy.day !== d) p.energy = { day: d, used: 0, losses: 0, consolation: false };
  const consolation = p.energy.used >= ARENA_ENERGY;
  if (consolation) p.energy.consolation = true;
  else p.energy.used++;
  if (!won) p.energy.losses++;
  rollWeek(p, now);
  if (won) p.week.wins++;
  p.last = last;
  const xp = won ? 30 : 12;
  p.xp += xp;
  let levelUp = false;
  while (p.xp >= arenaXpFor(p.level)) {
    p.xp -= arenaXpFor(p.level);
    p.level++;
    levelUp = true;
  }
  if (levelUp && !p.offer) p.offer = offerCards(s, p.level);
  return { xp, levelUp, consolation };
}

/** Two different cards: own-family technique more likely; a companion only with Tamtams on the farm. */
export function offerCards(s: Readonly<GameState>, level: number): CardId[] {
  const p = peekArenaPro(s);
  const r = rng(level * 7919 + p.cards.length * 31 + 17);
  const fam = fighterFamily(s);
  const pool: CardId[] = [];
  for (const k of Object.keys(STAT_CARDS) as StatCard[]) pool.push(`stat:${k}`);
  for (const [id, t] of Object.entries(TECHNIQUES) as [TechniqueId, (typeof TECHNIQUES)[TechniqueId]][]) {
    if (p.cards.includes(`tech:${id}`)) continue;
    pool.push(`tech:${id}`);
    if (fam && t.family === fam) pool.push(`tech:${id}`, `tech:${id}`, `tech:${id}`);
  }
  if (s.farm.length > 0 && !p.cards.includes("companion")) pool.push("companion", "companion");
  const a = pool[Math.floor(r() * pool.length)]!;
  const rest = pool.filter((c) => c !== a);
  return [a, rest[Math.floor(r() * rest.length)]!];
}

export function chooseCard(s: GameState, card: CardId): void {
  const p = arenaPro(s);
  if (!p.offer || !p.offer.includes(card)) throw new Error("no_offer");
  p.cards.push(card);
  p.offer = null;
}

export function cardInfo(c: CardId): { name: string; desc: string; kind: "stat" | "tech" | "companion" } {
  if (c === "companion") return { name: "Compañero", desc: "Un Tamtam de tu Granja te ayuda en el combate.", kind: "companion" };
  const [k, id] = c.split(":") as ["stat" | "tech", string];
  if (k === "stat") return { ...STAT_CARDS[id as StatCard], kind: "stat" };
  const t = TECHNIQUES[id as TechniqueId];
  return { name: t.name, desc: t.desc, kind: "tech" };
}

export function canChooseSchool(s: Readonly<GameState>): boolean {
  return s.economy.caretakerLevel >= SCHOOL_LEVEL && !peekArenaPro(s).school;
}
export function chooseSchool(s: GameState, school: SchoolId): void {
  if (!canChooseSchool(s)) throw new Error("school_locked");
  arenaPro(s).school = school;
}

/** Family that decides matchups: the back part (it also gives the skill). */
export function fighterFamily(s: Readonly<GameState>): FamilyId | undefined {
  return s.tamtam?.genome?.parts.back ?? (s.tamtam ? "fire" : undefined);
}

/** Applies cards, school and family to the base fighter. */
export function equipFighter(s: Readonly<GameState>, base: Fighter): Fighter {
  const p = peekArenaPro(s);
  const f: Fighter = { ...base, family: fighterFamily(s), techniques: [] };
  for (const c of p.cards) {
    if (c === "companion") {
      const mate = s.farm[0];
      if (mate) f.companion = { name: mate.tamtam.name, power: Math.round(base.str * 0.35) };
    } else if (c.startsWith("tech:")) f.techniques!.push(c.slice(5) as TechniqueId);
    else {
      const k = c.slice(5) as StatCard;
      if (k === "crit") f.crit += STAT_CARDS.crit.mul;
      else f[k] = Math.round(f[k] * (1 + STAT_CARDS[k].mul));
    }
  }
  if (p.school === "garra") f.str = Math.round(f.str * 1.08);
  if (p.school === "pluma") f.dodgeBonus = 0.05;
  if (p.school === "rayo") f.firstStrike = true;
  return f;
}

/** Rivals also get one technique from their family (from Plata on) so matchups matter. */
export function equipRival(rival: Fighter, rankIndex: number): Fighter {
  const family = rival.genome?.parts.back ?? "fire";
  const tech = (Object.entries(TECHNIQUES) as [TechniqueId, { family: FamilyId }][]).find(([, t]) => t.family === family)?.[0];
  return { ...rival, family, techniques: rankIndex >= 1 && tech ? [tech] : [] };
}

/** Local weekly leaderboard: generated rivals + the player, by wins this week. */
const LEADER_NAMES = ["Brasa Mayor", "Musgo Viejo", "Pinza Fría", "Lumbre", "Niebla", "Coral", "Tormenta", "Escama"];
export function weeklyBoard(s: Readonly<GameState>, now: number): { name: string; wins: number; me: boolean; family: FamilyId }[] {
  const p = peekArenaPro(s);
  const w = weekOf(now);
  const r = rng(w * 104729 + 3);
  const elapsed = Math.min(1, ((now / 86_400_000 + 3) / 7 - w) + 0.05);
  const fams = Object.keys(FAMILIES) as FamilyId[];
  const rows = LEADER_NAMES.slice(0, 5).map((name) => ({ name, wins: Math.round((6 + r() * 24) * elapsed), me: false, family: fams[Math.floor(r() * fams.length)]! }));
  rows.push({ name: s.tamtam?.name ?? "Tu Tamtam", wins: p.week.id === w ? p.week.wins : 0, me: true, family: fighterFamily(s) ?? "fire" });
  return rows.sort((a, b) => b.wins - a.wins || (a.me ? -1 : 1));
}
/** On a new week, the previous week's top 3 earns a badge. */
function rollWeek(p: ArenaPro, now: number): void {
  const w = weekOf(now);
  if (p.week.id === w) return;
  if (p.week.id >= 0 && p.week.wins > 0) {
    const r = rng(p.week.id * 104729 + 3);
    const others = LEADER_NAMES.slice(0, 5).map(() => Math.round(6 + r() * 24));
    const place = 1 + others.filter((x) => x > p.week.wins).length;
    if (place <= 3) p.badges.push(`${["Oro", "Plata", "Bronce"][place - 1]} · semana ${p.week.id}`);
  }
  p.week = { id: w, wins: 0 };
}

/** Battle narration for the comic-style log. */
export function narrate(e: { type: string; by?: number; on?: number; dmg?: number; crit?: boolean; name?: string }, names: [string, string]): string | null {
  switch (e.type) {
    case "attack": return null;
    case "skill": return `${names[e.by!]} lanza su habilidad.`;
    case "technique": return `${names[e.by!]}: ¡${e.name}!`;
    case "companion": return `${e.name} ayuda a ${names[e.by!]}.`;
    case "dodge": return `${names[e.by!]} lo esquiva.`;
    case "hit": return e.crit ? `¡Crítico! ${names[e.on!]} pierde ${e.dmg}.` : null;
    default: return null;
  }
}

/** Debug: next Arena level now (offers the 2 cards). */
export function debugArenaLevel(s: GameState): void {
  const p = arenaPro(s);
  p.level++;
  p.xp = 0;
  if (!p.offer) p.offer = offerCards(s, p.level);
}
