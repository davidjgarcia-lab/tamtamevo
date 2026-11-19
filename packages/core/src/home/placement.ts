import type { CatalogItem, PlacementLayer } from "../shop/catalog";
import { quantity, type InventoryState } from "../inventory/inventory";

/** Room layout and furniture placement rules (HOME_SYSTEM §2–4). */

export interface RoomLayout {
  schemaVersion: 1;
  floor: { cols: number; rows: number };
  wall: { cols: number; rows: number };
  finishes: { wallColor: string; wallpaper?: string; flooring: string };
  placements: Placement[];
  windowView: string;
  /** Wall cells occupied by the window (fixed architecture). */
  windowCells: { x: number; y: number; w: number; h: number };
}

export interface Placement {
  uid: string;
  itemId: string;
  layer: PlacementLayer;
  x: number;
  y: number;
  mirrored: boolean;
  rotated: boolean;
  colorVariant?: string;
  parentUid?: string;
}

export type PlacementError =
  | "not_furniture"
  | "wrong_layer"
  | "out_of_bounds"
  | "overlap"
  | "window"
  | "not_owned"
  | "not_mirrorable"
  | "not_rotatable"
  | "unknown_placement"
  | "no_surface"
  | "invalid_color";

export class PlacementRejected extends Error {
  constructor(public readonly reason: PlacementError) {
    super(`Placement rejected: ${reason}`);
  }
}

export type Catalog = ReadonlyMap<string, CatalogItem>;

export function emptyRoom(): RoomLayout {
  return {
    schemaVersion: 1,
    floor: { cols: 12, rows: 4 },
    wall: { cols: 12, rows: 6 },
    finishes: { wallColor: "#2E2560", flooring: "floor_wood_basic" },
    placements: [],
    windowView: "fire",
    windowCells: { x: 4, y: 1, w: 3, h: 3 },
  };
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Footprint in cells, taking rotation into account. */
export function footprint(p: Pick<Placement, "x" | "y" | "rotated">, item: CatalogItem): Rect {
  const f = item.furniture!;
  return p.rotated ? { x: p.x, y: p.y, w: f.h, h: f.w } : { x: p.x, y: p.y, w: f.w, h: f.h };
}

function furnitureOf(catalog: Catalog, itemId: string): CatalogItem {
  const item = catalog.get(itemId);
  if (!item?.furniture) throw new PlacementRejected("not_furniture");
  return item;
}

/** Validates a candidate placement against the room (ignoring `ignoreUid`, used when moving). */
export function checkPlacement(
  room: Readonly<RoomLayout>,
  catalog: Catalog,
  inventory: Readonly<InventoryState>,
  candidate: Placement,
  ignoreUid?: string,
): PlacementError | null {
  const item = catalog.get(candidate.itemId);
  if (!item?.furniture) return "not_furniture";
  const f = item.furniture;
  if (f.layer !== candidate.layer) return "wrong_layer";
  if (candidate.mirrored && !f.mirrorable) return "not_mirrorable";
  if (candidate.rotated && !f.rotatable) return "not_rotatable";
  if (candidate.colorVariant !== undefined && !(f.colorVariants ?? []).includes(candidate.colorVariant)) return "invalid_color";

  const others = room.placements.filter((p) => p.uid !== ignoreUid);

  // Ownership: placed copies of this item (excluding the one being moved) + 1 ≤ owned.
  const placedCopies = others.filter((p) => p.itemId === candidate.itemId).length;
  if (placedCopies + 1 > quantity(inventory, candidate.itemId)) return "not_owned";

  if (candidate.layer === "surface") {
    const parent = others.find((p) => p.uid === candidate.parentUid);
    const slots = parent ? catalog.get(parent.itemId)?.furniture?.surfaceSlots ?? 0 : 0;
    if (!parent || slots === 0) return "no_surface";
    if (!Number.isInteger(candidate.x) || candidate.x < 0 || candidate.x >= slots) return "out_of_bounds";
    if (others.some((p) => p.layer === "surface" && p.parentUid === candidate.parentUid && p.x === candidate.x)) return "overlap";
    return null;
  }

  const r = footprint(candidate, item);
  const grid = candidate.layer === "wall" ? room.wall : room.floor;
  if (!Number.isInteger(r.x) || !Number.isInteger(r.y) || r.x < 0 || r.y < 0 || r.x + r.w > grid.cols || r.y + r.h > grid.rows) {
    return "out_of_bounds";
  }
  if (candidate.layer === "wall" && overlaps(r, room.windowCells)) return "window";
  for (const o of others) {
    if (o.layer !== candidate.layer) continue; // rugs never collide with floor items, wall with floor, etc.
    const oi = catalog.get(o.itemId);
    if (!oi?.furniture) continue;
    if (overlaps(r, footprint(o, oi))) return "overlap";
  }
  return null;
}

function assertOk(err: PlacementError | null): void {
  if (err) throw new PlacementRejected(err);
}

export function placeItem(room: RoomLayout, catalog: Catalog, inv: Readonly<InventoryState>, p: Placement): void {
  furnitureOf(catalog, p.itemId);
  if (room.placements.some((q) => q.uid === p.uid)) throw new Error(`Duplicate placement uid "${p.uid}"`);
  assertOk(checkPlacement(room, catalog, inv, p));
  room.placements.push({ ...p });
}

function find(room: RoomLayout, uid: string): Placement {
  const p = room.placements.find((q) => q.uid === uid);
  if (!p) throw new PlacementRejected("unknown_placement");
  return p;
}

export function moveItem(room: RoomLayout, catalog: Catalog, inv: Readonly<InventoryState>, uid: string, x: number, y: number): void {
  const p = find(room, uid);
  const next = { ...p, x, y };
  assertOk(checkPlacement(room, catalog, inv, next, uid));
  p.x = x;
  p.y = y;
}

export function mirrorItem(room: RoomLayout, catalog: Catalog, inv: Readonly<InventoryState>, uid: string): void {
  const p = find(room, uid);
  const next = { ...p, mirrored: !p.mirrored };
  assertOk(checkPlacement(room, catalog, inv, next, uid));
  p.mirrored = next.mirrored;
}

export function rotateItem(room: RoomLayout, catalog: Catalog, inv: Readonly<InventoryState>, uid: string): void {
  const p = find(room, uid);
  const next = { ...p, rotated: !p.rotated };
  assertOk(checkPlacement(room, catalog, inv, next, uid));
  p.rotated = next.rotated;
}

export function recolorItem(room: RoomLayout, catalog: Catalog, inv: Readonly<InventoryState>, uid: string, variant: string): void {
  const p = find(room, uid);
  const next = { ...p, colorVariant: variant };
  assertOk(checkPlacement(room, catalog, inv, next, uid));
  p.colorVariant = variant;
}

/** Removes a placement (and anything standing on its surface slots); items stay in the inventory. */
export function removePlacement(room: RoomLayout, uid: string): void {
  find(room, uid);
  room.placements = room.placements.filter((p) => p.uid !== uid && p.parentUid !== uid);
}

export function placedCount(room: Readonly<RoomLayout>, itemId: string): number {
  return room.placements.filter((p) => p.itemId === itemId).length;
}

/** Floor cells blocked for walking (rugs are walkable). */
export function blockedFloorCells(room: Readonly<RoomLayout>, catalog: Catalog): boolean[][] {
  const g = Array.from({ length: room.floor.rows }, () => new Array<boolean>(room.floor.cols).fill(false));
  for (const p of room.placements) {
    if (p.layer !== "floor") continue;
    const it = catalog.get(p.itemId);
    if (!it?.furniture) continue;
    const r = footprint(p, it);
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) g[y]![x] = true;
  }
  return g;
}
