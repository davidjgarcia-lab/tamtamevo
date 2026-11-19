import { debit, hasApplied, type WalletState } from "../economy/wallet";
import { consumeItems, type InventoryState } from "../inventory/inventory";
import type { ActivityId } from "../shop/catalog";
import type { AttributeId, Tamtam } from "../identity/tamtam";

/** Development attributes and functional-object upgrades (ACTIVITIES_SYSTEM §1, §3). */

export const MAX_ATTRIBUTE_LEVEL = 20;

/** XP needed to go from level n to n+1. */
export const xpToNext = (n: number) => 50 * (n + 2);

/** Total XP needed to reach `level` from 0. */
export function totalXpFor(level: number): number {
  let t = 0;
  for (let n = 0; n < level; n++) t += xpToNext(n);
  return t;
}

/** Adds attribute XP, levelling up as needed. Returns the new Tamtam and levels gained. */
export function addAttributeXp(t: Tamtam, attr: AttributeId, xp: number): { tamtam: Tamtam; gained: number } {
  if (!Number.isFinite(xp) || xp < 0) throw new RangeError("XP must be a non-negative number");
  let { level, xp: cur } = t.attributes[attr];
  cur += Math.round(xp);
  let gained = 0;
  while (level < MAX_ATTRIBUTE_LEVEL && cur >= xpToNext(level)) {
    cur -= xpToNext(level);
    level++;
    gained++;
  }
  if (level >= MAX_ATTRIBUTE_LEVEL) cur = 0;
  return { tamtam: { ...t, attributes: { ...t.attributes, [attr]: { level, xp: cur } } }, gained };
}

/** Arena bonuses from attributes, with the caps of ACTIVITIES_SYSTEM §1. */
export function attributeArenaBonuses(t: Tamtam) {
  const L = (a: AttributeId) => Math.min(MAX_ATTRIBUTE_LEVEL, t.attributes[a].level);
  return {
    strPct: Math.min(10, 0.5 * L("str")),
    energyRegenPct: Math.min(8, 0.4 * L("int")),
    cooldownReductionPct: Math.min(6, 0.3 * L("cre")),
    elementalResistPct: Math.min(5, 0.25 * L("nat")),
    equipmentEfficacyPct: Math.min(20, 1 * L("man")),
  };
}

export interface UpgradeDef {
  activity: ActivityId;
  toLevel: 2 | 3;
  cost: number;
  attribute: AttributeId;
  attributeLevel: number;
  materials: Record<string, number>;
}

/** ECONOMY_SYSTEM §4.3 (Academy's "2 subjects" requirement is checked by the activity module). */
export const UPGRADES: UpgradeDef[] = [
  { activity: "gym", toLevel: 2, cost: 2000, attribute: "str", attributeLevel: 4, materials: {} },
  { activity: "gym", toLevel: 3, cost: 7000, attribute: "str", attributeLevel: 10, materials: { mat_metal: 6 } },
  { activity: "academy", toLevel: 2, cost: 2500, attribute: "int", attributeLevel: 4, materials: {} },
  { activity: "academy", toLevel: 3, cost: 8000, attribute: "int", attributeLevel: 10, materials: {} },
  { activity: "garden", toLevel: 2, cost: 2000, attribute: "nat", attributeLevel: 4, materials: {} },
  { activity: "garden", toLevel: 3, cost: 7500, attribute: "nat", attributeLevel: 10, materials: { mat_wood: 8 } },
  { activity: "music", toLevel: 2, cost: 2500, attribute: "cre", attributeLevel: 4, materials: {} },
  { activity: "music", toLevel: 3, cost: 8000, attribute: "cre", attributeLevel: 10, materials: {} },
  { activity: "workshop", toLevel: 2, cost: 3000, attribute: "man", attributeLevel: 4, materials: {} },
  { activity: "workshop", toLevel: 3, cost: 9000, attribute: "man", attributeLevel: 10, materials: { mat_metal: 6 } },
];

export type UpgradeError = "max_level" | "not_owned" | "attribute_too_low" | "insufficient_funds" | "missing_materials";

export class UpgradeRejected extends Error {
  constructor(public readonly reason: UpgradeError) {
    super(`Upgrade rejected: ${reason}`);
  }
}

/**
 * Upgrades a functional object atomically: checks requirements, charges coins,
 * consumes materials and raises the level. `bestAttributeLevel` is the highest level
 * among the player's Tamtams for the required attribute.
 */
export function upgradeActivity(
  state: { wallet: WalletState; inventory: InventoryState; activityLevels: Record<ActivityId, number> },
  activity: ActivityId,
  bestAttributeLevel: number,
  opts: { key: string; ts: number },
): { level: number; duplicate: boolean } {
  const key = `upgrade:${opts.key}`;
  if (hasApplied(state.wallet, key)) return { level: state.activityLevels[activity], duplicate: true };
  const cur = state.activityLevels[activity] ?? 0;
  if (cur === 0) throw new UpgradeRejected("not_owned");
  const def = UPGRADES.find((u) => u.activity === activity && u.toLevel === cur + 1);
  if (!def) throw new UpgradeRejected("max_level");
  if (bestAttributeLevel < def.attributeLevel) throw new UpgradeRejected("attribute_too_low");
  if (state.wallet.balances.tamcoin < def.cost) throw new UpgradeRejected("insufficient_funds");
  for (const [m, n] of Object.entries(def.materials)) {
    if ((state.inventory.items[m]?.qty ?? 0) < n) throw new UpgradeRejected("missing_materials");
  }
  debit(state.wallet, { key, currency: "tamcoin", amount: def.cost, kind: "upgrade", source: `upgrade:${activity}:${def.toLevel}`, ts: opts.ts });
  consumeItems(state.inventory, def.materials);
  state.activityLevels[activity] = def.toLevel;
  return { level: def.toLevel, duplicate: false };
}
