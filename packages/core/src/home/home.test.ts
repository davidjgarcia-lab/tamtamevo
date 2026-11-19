import { describe, expect, it } from "vitest";
import {
  addItem,
  blockedFloorCells,
  checkPlacement,
  deserialize,
  emptyInventory,
  emptyRoom,
  mirrorItem,
  moveItem,
  placedCount,
  placeItem,
  PlacementRejected,
  recolorItem,
  removePlacement,
  rotateItem,
  serialize,
  type CatalogItem,
  type FurnitureSpec,
  type Placement,
  type RoomLayout,
} from "../index";

const furn = (id: string, f: FurnitureSpec): CatalogItem => ({
  id,
  name: { es: id, en: id },
  description: { es: "", en: "" },
  image: `placeholder/${id}`,
  price: { currency: "tamcoin", amount: 100 },
  category: "furniture",
  rarity: "common",
  level: 1,
  requirements: [],
  effects: [],
  maxOwned: 5,
  stackable: true,
  furniture: f,
  artStatus: "placeholder",
});

const catalog = new Map(
  [
    furn("bed", { layer: "floor", w: 3, h: 2, mirrorable: true, rotatable: false, interactions: [{ kind: "sleep", dx: 1, dy: 2, capacity: 1 }] }),
    furn("desk", { layer: "floor", w: 2, h: 1, mirrorable: true, rotatable: true, surfaceSlots: 2 }),
    furn("rug", { layer: "rug", w: 4, h: 2, mirrorable: false, rotatable: false }),
    furn("poster", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, colorVariants: ["red", "blue"] }),
    furn("lamp_small", { layer: "surface", w: 1, h: 1, mirrorable: false, rotatable: false }),
  ].map((i) => [i.id, i]),
);

const inv = emptyInventory();
for (const id of ["bed", "desk", "rug", "poster", "lamp_small"]) addItem(inv, id, 2, 0);

const P = (uid: string, itemId: string, layer: Placement["layer"], x: number, y: number, extra: Partial<Placement> = {}): Placement => ({
  uid,
  itemId,
  layer,
  x,
  y,
  mirrored: false,
  rotated: false,
  ...extra,
});

const room = (): RoomLayout => emptyRoom();

describe("furniture placement", () => {
  it("places within bounds and rejects out-of-bounds", () => {
    const r = room();
    placeItem(r, catalog, inv, P("b1", "bed", "floor", 0, 0));
    expect(checkPlacement(r, catalog, inv, P("x", "bed", "floor", 10, 0))).toBe("out_of_bounds");
    expect(checkPlacement(r, catalog, inv, P("x", "bed", "floor", 0, 3))).toBe("out_of_bounds");
    expect(checkPlacement(r, catalog, inv, P("x", "bed", "floor", -1, 0))).toBe("out_of_bounds");
  });

  it("prevents overlaps on the same layer but lets rugs go under furniture", () => {
    const r = room();
    placeItem(r, catalog, inv, P("b1", "bed", "floor", 0, 0));
    expect(checkPlacement(r, catalog, inv, P("d1", "desk", "floor", 2, 1))).toBe("overlap");
    expect(checkPlacement(r, catalog, inv, P("d1", "desk", "floor", 3, 1))).toBeNull();
    placeItem(r, catalog, inv, P("r1", "rug", "rug", 1, 1)); // under the bed
    expect(checkPlacement(r, catalog, inv, P("r2", "rug", "rug", 3, 2))).toBe("overlap");
  });

  it("keeps wall items off the window and off each other", () => {
    const r = room();
    expect(checkPlacement(r, catalog, inv, P("p1", "poster", "wall", 5, 1))).toBe("window");
    placeItem(r, catalog, inv, P("p1", "poster", "wall", 0, 0));
    expect(checkPlacement(r, catalog, inv, P("p2", "poster", "wall", 1, 1))).toBe("overlap");
    expect(checkPlacement(r, catalog, inv, P("p2", "poster", "floor", 8, 0))).toBe("wrong_layer");
  });

  it("limits placed copies to owned copies", () => {
    const r = room();
    placeItem(r, catalog, inv, P("d1", "desk", "floor", 0, 0));
    placeItem(r, catalog, inv, P("d2", "desk", "floor", 0, 1));
    expect(checkPlacement(r, catalog, inv, P("d3", "desk", "floor", 0, 2))).toBe("not_owned");
    expect(placedCount(r, "desk")).toBe(2);
  });

  it("moves, mirrors, rotates and recolours with validation", () => {
    const r = room();
    placeItem(r, catalog, inv, P("b1", "bed", "floor", 0, 0));
    placeItem(r, catalog, inv, P("d1", "desk", "floor", 5, 0));
    moveItem(r, catalog, inv, "d1", 6, 0);
    expect(() => moveItem(r, catalog, inv, "d1", 1, 0)).toThrow(PlacementRejected);
    mirrorItem(r, catalog, inv, "b1");
    rotateItem(r, catalog, inv, "d1"); // 2×1 → 1×2
    expect(checkPlacement(r, catalog, inv, P("x", "bed", "floor", 6, 1))).toBe("overlap");
    expect(() => rotateItem(r, catalog, inv, "b1")).toThrow(PlacementRejected); // bed not rotatable
    placeItem(r, catalog, inv, P("p1", "poster", "wall", 0, 0));
    recolorItem(r, catalog, inv, "p1", "blue");
    expect(() => recolorItem(r, catalog, inv, "p1", "green")).toThrow(PlacementRejected);
  });

  it("supports surface slots and removes children with their furniture", () => {
    const r = room();
    placeItem(r, catalog, inv, P("d1", "desk", "floor", 0, 0));
    placeItem(r, catalog, inv, P("l1", "lamp_small", "surface", 0, 0, { parentUid: "d1" }));
    expect(checkPlacement(r, catalog, inv, P("l2", "lamp_small", "surface", 0, 0, { parentUid: "d1" }))).toBe("overlap");
    expect(checkPlacement(r, catalog, inv, P("l2", "lamp_small", "surface", 2, 0, { parentUid: "d1" }))).toBe("out_of_bounds");
    expect(checkPlacement(r, catalog, inv, P("l2", "lamp_small", "surface", 0, 0, { parentUid: "nope" }))).toBe("no_surface");
    removePlacement(r, "d1");
    expect(r.placements).toHaveLength(0);
  });

  it("computes walkable cells (rugs are walkable)", () => {
    const r = room();
    placeItem(r, catalog, inv, P("b1", "bed", "floor", 0, 0));
    placeItem(r, catalog, inv, P("r1", "rug", "rug", 4, 0));
    const g = blockedFloorCells(r, catalog);
    expect(g[0]!.slice(0, 5)).toEqual([true, true, true, false, false]);
    expect(g[2]![0]).toBe(false);
  });

  it("persists the layout", () => {
    const r = room();
    placeItem(r, catalog, inv, P("b1", "bed", "floor", 0, 0, { mirrored: true }));
    expect(deserialize<RoomLayout>(serialize(r, 1, 0), 1).state).toEqual(r);
  });
});
