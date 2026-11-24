import type { CareState } from "../care/needs";
import { FAMILIES, type FamilyId } from "../genetics/families";
import { formName, type Genome } from "../genetics/genome";
import { emptyRoom, type RoomLayout } from "../home/placement";
import { addItem, quantity } from "../inventory/inventory";
import { credit } from "../economy/wallet";
import type { CatalogItem } from "../shop/catalog";
import { SLICE_CATALOG } from "./content";
import { GameRuleError, type GameState } from "./game";
import { payCare } from "./life";

/**
 * House and collection (PLAN_MEJORAS phase D, references batch 2):
 * rooms unlocked by caretaker level (each with its own furniture and finishes),
 * furniture that does something (bed + lights off = faster rest, litter box, toys),
 * berry tree in the Granja, bestiary of forms seen, wardrobe with accessories, photo count.
 */
export type RoomId = "living" | "kitchen" | "bath" | "bedroom";
export const ROOMS: Record<RoomId, { name: string; level: number; desc: string; wall: string; floor: string }> = {
  living: { name: "Salón", level: 1, desc: "La sala principal del nido.", wall: "wall_woven", floor: "floor_planks" },
  kitchen: { name: "Cocina", level: 2, desc: "Comer aquí sacia un 15 % más.", wall: "wall_woven", floor: "floor_planks" },
  bath: { name: "Baño", level: 4, desc: "Bañarse aquí limpia un 20 % más.", wall: "wall_woven", floor: "floor_planks" },
  bedroom: { name: "Dormitorio", level: 6, desc: "Con la luz apagada descansa más rápido.", wall: "wall_woven", floor: "floor_planks" },
};
export const ROOM_ORDER: RoomId[] = ["living", "kitchen", "bath", "bedroom"];

export interface BestiaryEntry { name: string; family: FamilyId; genome: Genome | null; first: number; mine: boolean }
export interface HouseState {
  current: RoomId;
  saved: Partial<Record<RoomId, RoomLayout>>;
  lastTick: number;
  litterCleaned: number;
  berry: { lastHarvest: number; harvested: number };
  bestiary: Record<string, BestiaryEntry>;
  accessory: string | null;
  photos: number;
}
const fresh = (): HouseState => ({ current: "living", saved: {}, lastTick: 0, litterCleaned: 0, berry: { lastHarvest: 0, harvested: 0 }, bestiary: {}, accessory: null, photos: 0 });
export function house(s: GameState): HouseState {
  const g = s as GameState & { house?: HouseState };
  if (!g.house) g.house = fresh();
  return g.house;
}
export function peekHouse(s: Readonly<GameState>): HouseState {
  return (s as GameState & { house?: HouseState }).house ?? fresh();
}

export const roomUnlocked = (s: Readonly<GameState>, id: RoomId) => s.economy.caretakerLevel >= ROOMS[id].level;

/** Switches the active room: the current layout is saved and the target one loaded. */
export function switchRoom(s: GameState, id: RoomId): void {
  if (!roomUnlocked(s, id)) throw new GameRuleError("room_locked");
  const h = house(s);
  if (h.current === id) return;
  h.saved[h.current] = s.room;
  const next = h.saved[id] ?? (() => {
    const r = emptyRoom();
    r.finishes = { ...r.finishes, wallpaper: ROOMS[id].wall, flooring: ROOMS[id].floor };
    return r;
  })();
  delete h.saved[id];
  s.room = next;
  h.current = id;
  if (id !== "bedroom" && !s.care.asleep) s.lightsOn = true;
}

/** All placements across rooms (an owned item can only be in one place at a time). */
export function placedEverywhere(s: Readonly<GameState>, itemId: string): number {
  const h = peekHouse(s);
  let n = s.room.placements.filter((p) => p.itemId === itemId).length;
  for (const r of Object.values(h.saved)) n += r!.placements.filter((p) => p.itemId === itemId).length;
  return n;
}

export function toggleLights(s: GameState): boolean {
  const h = house(s);
  if (h.current !== "bedroom") throw new GameRuleError("no_switch_here");
  s.lightsOn = !s.lightsOn;
  return !s.lightsOn;
}

const placed = (s: Readonly<GameState>, itemId: string) => s.room.placements.some((p) => p.itemId === itemId);
/** Furniture "stars" (1–3) = comfort, shown in the shop and decor tray. */
export const furnitureStars = (item: CatalogItem) => Math.max(1, Math.min(3, item.furniture?.comfort ?? 1));
export function roomComfort(s: Readonly<GameState>): number {
  return s.room.placements.reduce((a, p) => a + (SLICE_CATALOG.get(p.itemId)?.furniture?.comfort ?? 0), 0);
}
/** What the furniture in the current room does (shown in the decor panel). */
export function roomEffects(s: Readonly<GameState>): string[] {
  const h = peekHouse(s);
  const out: string[] = [ROOMS[h.current].desc];
  if (placed(s, "furn_bed_nest") && h.current === "bedroom") out.push(`Cama-nido: ${!s.lightsOn ? "descansa un 50 % más rápido" : "apaga la luz para descansar mejor"}.`);
  if (placed(s, "furn_litter_moss")) out.push("Arenero de musgo: recoge la mitad de las cacas solo.");
  if (placed(s, "furn_toy_ball") || placed(s, "furn_toy_spinner")) out.push("Juguetes: la felicidad baja más despacio.");
  const c = roomComfort(s);
  out.push(`Confort de la habitación: ${c}.`);
  return out;
}

/** Called from tick(): furniture effects over time (bed/lights, toys, litter box). */
export function tickHouse(s: GameState, now: number): void {
  const h = house(s);
  const dtH = h.lastTick > 0 ? Math.min(12, Math.max(0, (now - h.lastTick) / 3_600_000)) : 0;
  h.lastTick = now;
  const care: CareState = s.care;
  if (dtH > 0) {
    const resting = care.asleep || (care.napUntil != null && now < care.napUntil);
    if (resting && h.current === "bedroom" && !s.lightsOn && placed(s, "furn_bed_nest")) care.needs.energy = Math.min(100, care.needs.energy + dtH * 12);
    const toys = (placed(s, "furn_toy_ball") ? 1 : 0) + (placed(s, "furn_toy_spinner") ? 1 : 0);
    if (toys > 0 && !care.asleep) care.needs.happiness = Math.min(100, care.needs.happiness + dtH * 1.5 * toys);
  }
  if (placed(s, "furn_litter_moss") && care.poops.length > 0) {
    // Every other poop goes into the litter box (deterministic by timestamp).
    const keep = care.poops.filter((ts) => Math.floor(ts / 1000) % 2 === 0);
    h.litterCleaned += care.poops.length - keep.length;
    care.poops = keep;
  }
}

/** Room bonus multipliers used by feeding and bathing. */
export const roomFoodBonus = (s: Readonly<GameState>) => (peekHouse(s).current === "kitchen" ? 1.15 : 1);
export const roomBathBonus = (s: Readonly<GameState>) => (peekHouse(s).current === "bath" ? 1.2 : 1);

// ── Berry tree (Granja) ────────────────────────────────────────────────
export const BERRY_COOLDOWN = 10 * 60_000;
export function berryReadyIn(s: Readonly<GameState>, now: number): number {
  return Math.max(0, peekHouse(s).berry.lastHarvest + BERRY_COOLDOWN - now);
}
export function harvestBerries(s: GameState, now: number): { kind: "food" | "coins"; amount: number } {
  if (s.economy.caretakerLevel < 3) throw new GameRuleError("berry_locked");
  if (berryReadyIn(s, now) > 0) throw new GameRuleError("berry_not_ready");
  const h = house(s);
  h.berry.lastHarvest = now;
  h.berry.harvested++;
  payCare(s, "harvest", now);
  // Two of three harvests give a bun (if there is room), the third coins.
  if (h.berry.harvested % 3 !== 0 && quantity(s.economy.inventory, "food_berry_bun") < 99) {
    addItem(s.economy.inventory, "food_berry_bun", 1, now);
    return { kind: "food", amount: 1 };
  }
  credit(s.economy.wallet, { key: `reward:berry:${now}`, currency: "tamcoin", amount: 12, kind: "reward", source: "farm", ts: now });
  return { kind: "coins", amount: 12 };
}

// ── Bestiary ───────────────────────────────────────────────────────────
export function bestiaryKey(g: Genome | null | undefined): string {
  if (!g) return "chispin";
  const p = g.parts;
  return `${p.body}-${p.head}-${p.legs}-${p.tail}-${p.back}`;
}
export function recordSeen(s: GameState, g: Genome | null | undefined, name: string, mine: boolean, now: number): boolean {
  const h = house(s);
  const k = bestiaryKey(g);
  const e = h.bestiary[k];
  if (e) {
    if (mine && !e.mine) e.mine = true;
    return false;
  }
  h.bestiary[k] = { name: g ? formName(g, 1) : name, family: g?.parts.back ?? "fire", genome: g ?? null, first: now, mine };
  return true;
}
export function bestiaryStats(s: Readonly<GameState>): { seen: number; mine: number; byFamily: Record<FamilyId, number> } {
  const h = peekHouse(s);
  const byFamily = Object.fromEntries(Object.keys(FAMILIES).map((f) => [f, 0])) as Record<FamilyId, number>;
  let mine = 0;
  for (const e of Object.values(h.bestiary)) {
    byFamily[e.family]++;
    if (e.mine) mine++;
  }
  return { seen: Object.keys(h.bestiary).length, mine, byFamily };
}

// ── Wardrobe ───────────────────────────────────────────────────────────
export function equipAccessory(s: GameState, id: string | null): void {
  if (s.economy.caretakerLevel < 8) throw new GameRuleError("wardrobe_locked");
  if (id && quantity(s.economy.inventory, id) < 1) throw new GameRuleError("not_owned");
  house(s).accessory = id;
}
export function takePhoto(s: GameState): number {
  if (s.economy.caretakerLevel < 5) throw new GameRuleError("photo_locked");
  return ++house(s).photos;
}
