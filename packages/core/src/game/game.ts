import {
  bumpStage, cleanPoop as cleanPoopCare,
  advanceCare, bathe, clean, feed, goToSleep, nap, newCareState, pet, play, spendForActivity, wakeUp,
  DEFAULT_CARE_CONFIG, type CareConfig, type CareReaction, type CareState, type NeedId,
} from "../care/needs";
import { credit, debit, emptyWallet } from "../economy/wallet";
import { applyEvolution, hatchTamtam, renameTamtam, type Tamtam } from "../identity/tamtam";
import { addItem, emptyInventory, quantity, removeItem } from "../inventory/inventory";
import { emptyRoom, mirrorItem, moveItem, placeItem, PlacementRejected, removePlacement, type Placement, type RoomLayout } from "../home/placement";
import { addAttributeXp, attributeArenaBonuses, upgradeActivity } from "../progression/progression";
import { emptyRewardLog, grantActivityReward, type RewardLog } from "../rewards/rewards";
import { purchase, type PlayerEconomyState } from "../shop/shop";
import { FOODS, GYM, SLICE_CATALOG, STARTER_COINS, STARTER_ITEMS } from "./content";
import { newArenaState, type ArenaState } from "./arena";
import { FORM_QUALITY, formQuality, lustre } from "../appearance/appearance";
import { payCare, tickLife } from "./life";
import { pickStarter, starterById, starterGenome, starterOf } from "../genetics/starters";
import { placedEverywhere, roomFoodBonus, tickHouse } from "./house";

/**
 * Game state and actions of the first-Tamtam vertical slice.
 * Every action is a pure mutation of a draft — run it inside Store.transact.
 */

export const SCHEMA_VERSION = 2;

export interface GameState {
  schemaVersion: number;
  createdAt: number;
  phase: "egg" | "naming" | "home";
  egg: { tamtamId: string; speciesId: string; formId: string; laidAt: number; hatchAt: number; alleleId: string } | null;
  tamtam: Tamtam | null;
  alleleId: string;
  care: CareState;
  economy: PlayerEconomyState;
  room: RoomLayout;
  rewardLog: RewardLog;
  gym: { sessions: number; strTrainingPoints: number };
  buffs: string[];
  lightsOn: boolean;
  /** Tamtams that are not playing right now (decision: "Granja"). Their needs are paused. */
  farm: { tamtam: Tamtam; care: CareState; alleleId: string }[];
  /** Minigame best scores and play counts. */
  records: Record<string, { best: number; plays: number }>;
  study: { sessions: number };
  arena: ArenaState;
}

/** The first egg hatches quickly (tutorial); it sits in the room until the player opens it. */
export const FIRST_EGG_INCUBATION_MS = 8_000;

export function newGame(now: number, ids: { tamtamId: string }, alleleId = "brasa"): GameState {
  const wallet = emptyWallet();
  credit(wallet, { key: "grant:starter", currency: "tamcoin", amount: STARTER_COINS, kind: "reward", source: "welcome", ts: now });
  const inventory = emptyInventory();
  for (const [id, n] of Object.entries(STARTER_ITEMS)) addItem(inventory, id, n, now);
  const room = emptyRoom();
  const economy: PlayerEconomyState = { wallet, inventory, caretakerLevel: 1, activityLevels: { gym: 1, academy: 0, garden: 0, music: 0, workshop: 0 } };
  const starter: Placement[] = [
    { uid: "p-bed", itemId: "furn_bed_nest", layer: "floor", x: 0, y: 0, mirrored: false, rotated: false },
    { uid: "p-rug", itemId: "furn_rug_round", layer: "rug", x: 4, y: 2, mirrored: false, rotated: false },
    { uid: "p-lamp", itemId: "furn_lamp_mushroom", layer: "floor", x: 3, y: 0, mirrored: false, rotated: false },
    { uid: "p-poster", itemId: "furn_poster_volcano", layer: "wall", x: 1, y: 1, mirrored: false, rotated: false },
    { uid: "p-poster2", itemId: "furn_poster_forest", layer: "wall", x: 8, y: 1, mirrored: false, rotated: false },
    { uid: "p-gym", itemId: "gym_dumbbells", layer: "floor", x: 10, y: 0, mirrored: false, rotated: false },
    { uid: "p-desk", itemId: "study_desk", layer: "floor", x: 7, y: 0, mirrored: false, rotated: false },
  ];
  for (const p of starter) placeItem(room, SLICE_CATALOG, inventory, p);
  room.finishes = { ...room.finishes, wallpaper: "wall_woven", flooring: "floor_planks" };
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    phase: "egg",
    egg: newEgg(ids.tamtamId, now, alleleId),
    tamtam: null,
    alleleId,
    care: newCareState(now),
    economy,
    room,
    rewardLog: emptyRewardLog(),
    gym: { sessions: 0, strTrainingPoints: 0 },
    buffs: [],
    lightsOn: true,
    farm: [],
    records: {},
    study: { sessions: 0 },
    arena: newArenaState(),
  };
}

export class GameRuleError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

/** Egg progress in [0, 1]. */
export function eggProgress(s: Readonly<GameState>, now: number): number {
  if (!s.egg) return 1;
  return Math.min(1, Math.max(0, (now - s.egg.laidAt) / (s.egg.hatchAt - s.egg.laidAt)));
}

export function hatch(s: GameState, now: number): void {
  if (s.phase !== "egg" || !s.egg) throw new GameRuleError("not_an_egg");
  if (now < s.egg.hatchAt) throw new GameRuleError("not_ready");
  s.phase = "naming";
}

/** A new egg: it will hatch one of the starters at random (deterministic per egg id). */
export function newEgg(tamtamId: string, now: number, alleleId: string): NonNullable<GameState["egg"]> {
  const st = pickStarter(tamtamId);
  return { tamtamId, speciesId: st.family, formId: `starter_${st.id}`, laidAt: now, hatchAt: now + FIRST_EGG_INCUBATION_MS, alleleId };
}

/** Tamtam that comes out of an egg: a starter with its genome and personality (or the legacy Chispín). */
function hatchFromEgg(egg: NonNullable<GameState["egg"]>, requestedName: string, now: number): Tamtam {
  const st = starterOf(egg.formId);
  const t = hatchTamtam({
    id: egg.tamtamId,
    speciesId: egg.speciesId,
    formId: egg.formId,
    requestedName,
    bornAt: now,
    personality: st ? st.traits : ["playful", "glutton"],
    affinity: { primary: st?.family ?? "fire", secondary: st?.family ?? "fire" },
  });
  return st ? { ...t, genome: starterGenome(st), formName: st.species, starterId: st.id } : t;
}

export function nameNewTamtam(s: GameState, requestedName: string, now: number): Tamtam {
  if (s.phase !== "naming" || !s.egg) throw new GameRuleError("not_naming");
  const t = hatchFromEgg(s.egg, requestedName, now);
  s.tamtam = t;
  s.alleleId = s.egg.alleleId;
  s.egg = null;
  s.phase = "home";
  s.care = newCareState(now);
  return t;
}

export function rename(s: GameState, requested: string, now: number): void {
  if (!s.tamtam) throw new GameRuleError("no_tamtam");
  s.tamtam = renameTamtam(s.tamtam, requested, now);
}

export function tick(s: GameState, now: number, cfg: CareConfig = DEFAULT_CARE_CONFIG): void {
  if (s.phase === "home") {
    advanceCare(s.care, now, cfg);
    tickLife(s, now);
    tickHouse(s, now);
  }
}

export type CareKind = "bathe" | "clean" | "pet" | "play" | "sleep" | "wake" | "nap";

export function careAction(s: GameState, kind: CareKind, now: number): CareReaction {
  if (s.phase !== "home") throw new GameRuleError("no_tamtam");
  switch (kind) {
    case "bathe": return bathe(s.care, now);
    case "clean": return clean(s.care, now);
    case "pet": {
      const r = pet(s.care, now);
      if (r === "pet") payCare(s, "pet", now);
      return r;
    }
    case "play": return play(s.care, now);
    case "sleep": s.lightsOn = false; return goToSleep(s.care, now);
    case "wake": s.lightsOn = true; return wakeUp(s.care, now);
    case "nap": return nap(s.care, now);
  }
}

/** Feeds a food from the inventory. Refused food is not consumed. */
export function feedFood(s: GameState, foodId: string, now: number): CareReaction {
  if (s.phase !== "home" || !s.tamtam) throw new GameRuleError("no_tamtam");
  const food = FOODS[foodId];
  if (!food) throw new GameRuleError("unknown_food");
  if (quantity(s.economy.inventory, foodId) < 1) throw new GameRuleError("no_food");
  const bonus = roomFoodBonus(s);
  // The starter's own favourite food also counts as a favourite (personality).
  const fav = starterById(s.tamtam.starterId ?? "")?.favoriteFood === foodId;
  const tuned = { ...food, hunger: Math.round(food.hunger * bonus), favoriteOf: fav ? [...food.favoriteOf, s.tamtam.speciesId] : food.favoriteOf };
  const r = feed(s.care, tuned, s.tamtam.speciesId, now);
  if (r === "refuse_full" || r === "already_asleep") return r;
  removeItem(s.economy.inventory, foodId, 1);
  payCare(s, "feed", now);
  if (food.buff && !s.buffs.includes(food.buff)) s.buffs.push(food.buff);
  return r;
}

export interface GymResult {
  ok: boolean;
  reason?: "too_tired";
  coins: number;
  xp: number;
  strLevelsGained: number;
  strPointGained: boolean;
  duplicate: boolean;
}

/** Completes one gym session. `runId` makes the reward idempotent. */
export function completeGymSession(s: GameState, input: { runId: string; quality: number; now: number; tzOffsetMin: number }): GymResult {
  if (s.phase !== "home" || !s.tamtam) throw new GameRuleError("no_tamtam");
  const level = s.economy.activityLevels.gym;
  if (level < 1) throw new GameRuleError("no_gym");
  const key = `reward:activity:gym:${input.runId}`;
  if (s.economy.wallet.keys[key] !== undefined) {
    return { ok: true, coins: 0, xp: 0, strLevelsGained: 0, strPointGained: false, duplicate: true };
  }
  if (!spendForActivity(s.care, input.now, GYM.energyCostByLevel[level] ?? GYM.energyCost, GYM.hungerCost, 4)) {
    return { ok: false, reason: "too_tired", coins: 0, xp: 0, strLevelsGained: 0, strPointGained: false, duplicate: false };
  }
  const r = grantActivityReward(s.economy.wallet, s.rewardLog, {
    runId: input.runId,
    tamtamId: s.tamtam.id,
    source: "activity:gym",
    baseCoins: GYM.baseCoins,
    quality: input.quality,
    levelMultiplier: GYM.levelMultiplier[level] ?? 1,
    baseXp: GYM.baseXp,
    ts: input.now,
    tzOffsetMin: input.tzOffsetMin,
  });
  const up = addAttributeXp(s.tamtam, "str", r.xp);
  s.tamtam = up.tamtam;
  s.gym.sessions += 1;
  payCare(s, "gym", input.now);
  bumpStage(s.care, "gym");
  const point = s.gym.sessions % GYM.sessionsPerStrPoint === 0;
  if (point) s.gym.strTrainingPoints += 1;
  return { ok: true, coins: r.coins, xp: r.xp, strLevelsGained: up.gained, strPointGained: point, duplicate: false };
}

export function upgradeGym(s: GameState, key: string, now: number): number {
  if (!s.tamtam) throw new GameRuleError("no_tamtam");
  return upgradeActivity(s.economy, "gym", s.tamtam.attributes.str.level, { key, ts: now }).level;
}

export function buy(s: GameState, itemId: string, key: string, now: number, qty = 1) {
  const item = SLICE_CATALOG.get(itemId);
  if (!item) throw new GameRuleError("unknown_item");
  return purchase(s.economy, item, { key, qty, ts: now });
}

export function place(s: GameState, p: Placement): void {
  if (placedEverywhere(s, p.itemId) >= quantity(s.economy.inventory, p.itemId)) throw new PlacementRejected("not_owned");
  placeItem(s.room, SLICE_CATALOG, s.economy.inventory, p);
}
export function move(s: GameState, uid: string, x: number, y: number): void {
  moveItem(s.room, SLICE_CATALOG, s.economy.inventory, uid, x, y);
}
export function mirror(s: GameState, uid: string): void {
  mirrorItem(s.room, SLICE_CATALOG, s.economy.inventory, uid);
}
export function unplace(s: GameState, uid: string): void {
  removePlacement(s.room, uid);
}

/** Arena stat preview for the current form: shows how the Gym feeds the Arena (ACTIVITIES_SYSTEM §6). */
export const FORM_BASE_STR: Record<string, number> = {
  fire_baby_chispin: Math.round(90 * 0.55),
  fire_child_fogarin: Math.round(90 * 0.75),
  fire_juvenile_brasko: 90,
  fire_adult_volcaurio: 120,
  fire_adult_fenixara: 105,
};

export function arenaStrength(s: Readonly<GameState>): { base: number; fromAttribute: number; fromTraining: number; fromFood: number; total: number; quality: string } {
  if (!s.tamtam) return { base: 0, fromAttribute: 0, fromTraining: 0, fromFood: 0, total: 0, quality: "vivid" };
  // Form quality (Lustre recorded at the Ritual) scales the form's base stat.
  const quality = formQuality(s.tamtam);
  const baseForm = (FORM_BASE_STR[s.tamtam.formId] ?? 50) * FORM_QUALITY[quality].statMul;
  const potential = 7; // placeholder until genetics lands in the slice (EVOLUTION_SYSTEM §6)
  const base = Math.round(baseForm * (0.4 + 0.012 * s.tamtam.level) * (1 + potential / 60));
  const pct = attributeArenaBonuses(s.tamtam).strPct;
  const fromAttribute = Math.round((base * pct) / 100);
  const fromTraining = s.gym.strTrainingPoints;
  const fromFood = s.buffs.includes("str_5_next_fight") ? Math.round(base * 0.05) : 0;
  return { base, fromAttribute, fromTraining, fromFood, total: base + fromAttribute + fromTraining + fromFood, quality };
}

// ── Developer debug actions (only used on the debug profile) ───────────────────

export function debugSetNeed(s: GameState, need: NeedId, value: number): void {
  s.care.needs[need] = Math.min(100, Math.max(0, value));
}

let debugSeq = 0;
export function debugCoins(s: GameState, delta: number, now: number): void {
  const key = `debug:${now}:${++debugSeq}`;
  if (delta > 0) credit(s.economy.wallet, { key, currency: "tamcoin", amount: delta, kind: "adjustment", source: "debug", ts: now });
  else if (delta < 0) debit(s.economy.wallet, { key, currency: "tamcoin", amount: Math.min(-delta, s.economy.wallet.balances.tamcoin), kind: "adjustment", source: "debug", ts: now });
}

export function debugAttributeLevels(s: GameState, attr: "str" | "int" | "cre" | "nat" | "man", levels: number): void {
  if (!s.tamtam) return;
  let t = s.tamtam;
  for (let i = 0; i < levels; i++) {
    const cur = t.attributes[attr];
    t = addAttributeXp(t, attr, 50 * (cur.level + 2) - cur.xp).tamtam;
  }
  s.tamtam = t;
}

/** Sets the lifetime care average (Lustre testing). */
export function debugSetLifetimeCare(s: GameState, avg: number, hours = 100): void {
  s.care.satIntegral = Math.min(100, Math.max(0, avg)) * hours;
  s.care.satHours = hours;
}

export function debugLevelUp(s: GameState, levels: number): void {
  if (s.tamtam) s.tamtam = { ...s.tamtam, level: Math.min(50, s.tamtam.level + levels) };
}

export function debugGrantAll(s: GameState, now: number): void {
  for (const item of SLICE_CATALOG.values()) {
    const missing = item.maxOwned - quantity(s.economy.inventory, item.id);
    const n = item.stackable ? Math.min(missing, item.category === "food" ? 5 : missing) : missing;
    if (n > 0) addItem(s.economy.inventory, item.id, n, now);
  }
}

export function debugNewEgg(s: GameState, now: number, tamtamId: string, alleleId: string): void {
  // With a Tamtam at home, the newborn goes to the farm (Granja); otherwise it is the egg in the room.
  if (s.tamtam) {
    const t = hatchFromEgg(newEgg(tamtamId, now, alleleId), "", now);
    s.farm.push({ tamtam: t, care: newCareState(now), alleleId });
    return;
  }
  s.phase = "egg";
  s.egg = newEgg(tamtamId, now, alleleId);
}

/**
 * Forces the stage change in data (for testing the evolution pipeline). The vertical slice
 * only has artwork for the baby form, so the app keeps rendering Chispín and flags it.
 */
export function debugForceEvolution(s: GameState, to: { formId: string; stage: Tamtam["stage"] }, now: number): void {
  if (!s.tamtam) throw new GameRuleError("no_tamtam");
  if (s.tamtam.formId === to.formId) throw new GameRuleError("already_in_form");
  // The Lustre at this moment is engraved into the new form (looks, stats and skills).
  const tier = lustre(s.care, s.tamtam).tier;
  s.tamtam = applyEvolution(s.tamtam, to, now, 1, tier);
  s.care.maturity = 0;
}

/** Changes the wall or floor finish of the room (the player must own it). */
export function setFinish(s: GameState, slot: "wall" | "floor", itemId: string): void {
  const item = SLICE_CATALOG.get(itemId);
  if (!item || item.category !== "surfaces" || !itemId.startsWith(slot === "wall" ? "wall_" : "floor_")) throw new GameRuleError("not_a_finish");
  if (quantity(s.economy.inventory, itemId) < 1) throw new GameRuleError("not_owned");
  s.room.finishes = slot === "wall" ? { ...s.room.finishes, wallpaper: itemId } : { ...s.room.finishes, flooring: itemId };
}

/** Mops one poop up (pays a little). */
export function mopPoop(s: GameState, ts: number, now: number): CareReaction {
  const had = s.care.poops.includes(ts);
  const r = cleanPoopCare(s.care, ts, now);
  if (had) payCare(s, "poop", now);
  return r;
}
