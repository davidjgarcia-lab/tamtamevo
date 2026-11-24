import { addItem, quantity } from "../inventory/inventory";
import type { GameState } from "./game";
import type { MinigameId } from "./activities";

/**
 * Common minigame layer (references batch 1, PLAN_MEJORAS phase B):
 * stars, specific praise, medals, daily play streak with protection, easier first game of the day,
 * and the landscape album (3-star runs give pieces that complete paintings for the house).
 */

export interface PlayState {
  streak: { lastDay: number; count: number; protections: number; best: number };
  lastPlayDay: Record<string, number>;
  album: { pieces: number };
}
export function playState(s: GameState): PlayState {
  const g = s as GameState & { play?: PlayState };
  if (!g.play) g.play = { streak: { lastDay: -99, count: 0, protections: 1, best: 0 }, lastPlayDay: {}, album: { pieces: 0 } };
  return g.play;
}
export function peekPlay(s: Readonly<GameState>): PlayState {
  return (s as GameState & { play?: PlayState }).play ?? { streak: { lastDay: -99, count: 0, protections: 1, best: 0 }, lastPlayDay: {}, album: { pieces: 0 } };
}
const dayOf = (t: number) => Math.floor(t / 86_400_000);

/** 0–3 stars from the score relative to the game's reference score. */
export function starsFor(score: number, scoreForMax: number): number {
  const r = score / scoreForMax;
  return r >= 0.85 ? 3 : r >= 0.55 ? 2 : r >= 0.25 ? 1 : 0;
}
export type Medal = "none" | "bronze" | "silver" | "gold" | "platinum";
export function medalFor(best: number, scoreForMax: number): Medal {
  const r = best / scoreForMax;
  return r >= 1 ? "platinum" : r >= 0.85 ? "gold" : r >= 0.55 ? "silver" : r >= 0.25 ? "bronze" : "none";
}
export const MEDAL_NAMES: Record<Medal, string> = { none: "Sin medalla", bronze: "Bronce", silver: "Plata", gold: "Oro", platinum: "Platino" };

/** The first game of each minigame per day is a bit easier (DDA, references batch 1). */
export function isFirstPlayToday(s: Readonly<GameState>, game: MinigameId, now: number): boolean {
  return peekPlay(s).lastPlayDay[game] !== dayOf(now);
}

export interface Metrics {
  seconds?: number;
  mistakes?: number;
  combo?: number;
  newRecord?: boolean;
}
/** Specific praise ("¡0 errores!", "En 42 s"), never a generic "¡bien!". */
export function praiseFor(stars: number, m: Metrics): string[] {
  const out: string[] = [];
  if (m.newRecord) out.push("¡Nuevo récord personal!");
  if (m.mistakes === 0) out.push("¡0 errores! Precisión total.");
  if (m.seconds !== undefined && m.seconds < 45) out.push(`¡Rapidísimo: ${Math.round(m.seconds)} s!`);
  if ((m.combo ?? 0) >= 5) out.push(`¡Combo de ${m.combo}!`);
  if (out.length === 0) out.push(stars >= 3 ? "Partida impecable." : stars === 2 ? "Muy bien jugado, casi perfecto." : stars === 1 ? "Buen intento: la siguiente sale mejor." : "Estuviste cerca. ¡Otra!");
  return out.slice(0, 2);
}

/** Records the play day: streak +1, protected gaps, rewards on days 3 and 7. */
export function recordPlayDay(s: GameState, game: MinigameId, now: number): { streak: number; usedProtection: boolean; reward: string | null } {
  const P = playState(s);
  const d = dayOf(now);
  P.lastPlayDay[game] = d;
  const st = P.streak;
  let usedProtection = false;
  if (st.lastDay === d) return { streak: st.count, usedProtection, reward: null };
  if (st.lastDay === d - 1) st.count += 1;
  else if (st.lastDay === d - 2 && st.protections > 0) {
    st.protections -= 1;
    st.count += 1;
    usedProtection = true;
  } else st.count = 1;
  st.lastDay = d;
  st.best = Math.max(st.best, st.count);
  let reward: string | null = null;
  if (st.count % 7 === 0) {
    st.protections = Math.min(2, st.protections + 1);
    addItem(s.economy.inventory, "food_power_stew", 1, now);
    reward = "Guiso de fuerza + 1 protección de racha";
  } else if (st.count % 3 === 0) {
    addItem(s.economy.inventory, "food_roast_skewer", 1, now);
    reward = "Brocheta asada";
  }
  return { streak: st.count, usedProtection, reward };
}

/** Landscape album: 4 pieces per painting; completing one gives that painting for the house. */
export const ALBUM = ["furn_poster_forest", "furn_poster_sea", "furn_poster_mountains", "furn_poster_waterfall", "furn_poster_desert", "furn_poster_stars", "furn_poster_aurora", "furn_poster_volcano"];
export const PIECES_PER_PAINTING = 4;
export function addAlbumPiece(s: GameState, now: number): { painting: string; piece: number; completed: boolean } | null {
  const P = playState(s);
  const idx = Math.floor(P.album.pieces / PIECES_PER_PAINTING);
  if (idx >= ALBUM.length) return null;
  P.album.pieces += 1;
  const painting = ALBUM[idx]!;
  const piece = ((P.album.pieces - 1) % PIECES_PER_PAINTING) + 1;
  const completed = piece === PIECES_PER_PAINTING;
  if (completed && quantity(s.economy.inventory, painting) < 3) addItem(s.economy.inventory, painting, 1, now);
  return { painting, piece, completed };
}
