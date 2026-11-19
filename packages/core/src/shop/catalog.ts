import type { Currency } from "../economy/wallet";

/** Shop catalogue model (ECONOMY_SYSTEM §4, HOME_SYSTEM §4). */

export type ShopCategory = "food" | "decoration" | "furniture" | "lighting" | "surfaces" | "equipment" | "special" | "upgrades";
export const SHOP_CATEGORIES: readonly ShopCategory[] = ["food", "decoration", "furniture", "lighting", "surfaces", "equipment", "special", "upgrades"];

export type Rarity = "common" | "uncommon" | "rare" | "epic";

export type PlacementLayer = "floor" | "wall" | "rug" | "surface";

export type InteractionKind =
  | "sit" | "sleep" | "play" | "look" | "toggle_light" | "train" | "study" | "garden" | "music" | "craft" | "eat";

export interface FurnitureSpec {
  layer: PlacementLayer;
  /** Cells: width × depth (floor/rug) or width × height (wall). */
  w: number;
  h: number;
  mirrorable: boolean;
  rotatable: boolean;
  surfaceSlots?: number;
  interactions?: { kind: InteractionKind; dx: number; dy: number; capacity: number }[];
  colorVariants?: string[];
  comfort?: number;
}

export type Requirement =
  | { type: "caretakerLevel"; level: number }
  | { type: "activityLevel"; activity: ActivityId; level: number }
  | { type: "owns"; itemId: string };

export type ActivityId = "gym" | "academy" | "garden" | "music" | "workshop";

export type Effect =
  | { type: "comfort"; value: number }
  | { type: "unlockActivity"; activity: ActivityId; level: number }
  | { type: "restore"; need: "hunger" | "energy" | "happiness"; value: number }
  | { type: "custom"; id: string };

export interface CatalogItem {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  /** Asset id of the illustration (art pipeline). */
  image: string;
  price: { currency: Currency; amount: number };
  category: ShopCategory;
  rarity: Rarity;
  /** Caretaker level at which it appears in the shop. */
  level: number;
  requirements: Requirement[];
  effects: Effect[];
  /** Maximum copies the player can own (1 for unique items). */
  maxOwned: number;
  stackable: boolean;
  furniture?: FurnitureSpec;
  /** Sell-back fraction (ECONOMY_SYSTEM §6). */
  sellRatio?: number;
  retired?: boolean;
  artStatus: "placeholder" | "prototype" | "final";
}

export class CatalogError extends Error {}

export function validateCatalog(items: CatalogItem[]): Map<string, CatalogItem> {
  const byId = new Map<string, CatalogItem>();
  for (const it of items) {
    if (byId.has(it.id)) throw new CatalogError(`Duplicate catalogue id "${it.id}"`);
    if (!/^[a-z0-9_]+$/.test(it.id)) throw new CatalogError(`Invalid id "${it.id}"`);
    if (!Number.isInteger(it.price.amount) || it.price.amount < 0) throw new CatalogError(`${it.id}: invalid price`);
    if (!Number.isInteger(it.maxOwned) || it.maxOwned < 1) throw new CatalogError(`${it.id}: maxOwned must be ≥ 1`);
    if (!it.name.es || !it.name.en) throw new CatalogError(`${it.id}: missing name`);
    const f = it.furniture;
    if (f) {
      if (!Number.isInteger(f.w) || !Number.isInteger(f.h) || f.w < 1 || f.h < 1) throw new CatalogError(`${it.id}: invalid footprint`);
      if (f.layer === "wall" && f.interactions?.some((i) => i.kind === "sleep" || i.kind === "sit")) {
        throw new CatalogError(`${it.id}: wall items cannot be sat or slept on`);
      }
    }
    byId.set(it.id, it);
  }
  for (const it of items) {
    for (const r of it.requirements) {
      if (r.type === "owns" && !byId.has(r.itemId)) throw new CatalogError(`${it.id}: requires unknown item "${r.itemId}"`);
    }
  }
  return byId;
}
