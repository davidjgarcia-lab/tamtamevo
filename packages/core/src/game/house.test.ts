import { describe, expect, it } from "vitest";
import { buy, debugCoins, feedFood, hatch, nameNewTamtam, newGame, place, tick } from "./game";
import { CHISPIN_GENOME } from "../genetics/genome";
import { berryReadyIn, BERRY_COOLDOWN, bestiaryStats, harvestBerries, house, recordSeen, switchRoom, toggleLights } from "./house";

const T0 = Date.UTC(2026, 10, 20, 9, 0);
const home = () => {
  const s = newGame(T0, { tamtamId: "a" });
  hatch(s, T0 + 8_000);
  nameNewTamtam(s, "Brasa", T0 + 9_000);
  return s;
};

describe("house", () => {
  it("rooms unlock by level and keep their own furniture", () => {
    const s = home();
    expect(() => switchRoom(s, "kitchen")).toThrow(/room_locked/);
    s.economy.caretakerLevel = 6;
    const livingCount = s.room.placements.length;
    switchRoom(s, "bedroom");
    expect(s.room.placements.length).toBe(0);
    expect(toggleLights(s)).toBe(true);
    switchRoom(s, "living");
    expect(s.room.placements.length).toBe(livingCount);
    expect(s.lightsOn).toBe(true);
  });
  it("an item can't be placed in two rooms with one copy", () => {
    const s = home();
    s.economy.caretakerLevel = 2;
    switchRoom(s, "kitchen");
    expect(() => place(s, { uid: "x", itemId: "furn_bed_nest", layer: "floor", x: 0, y: 0, mirrored: false, rotated: false })).toThrow();
  });
  it("kitchen feeds more", () => {
    const a = home();
    const b = home();
    b.economy.caretakerLevel = 2;
    switchRoom(b, "kitchen");
    a.care.needs.hunger = b.care.needs.hunger = 20;
    feedFood(a, "food_berry_bun", T0 + 10_000);
    feedFood(b, "food_berry_bun", T0 + 10_000);
    expect(b.care.needs.hunger).toBeGreaterThan(a.care.needs.hunger);
  });
  it("litter box clears some poops", () => {
    const s = home();
    debugCoins(s, 2000, T0);
    s.economy.caretakerLevel = 4;
    buy(s, "furn_litter_moss", "k1", T0);
    place(s, { uid: "l", itemId: "furn_litter_moss", layer: "floor", x: 11, y: 3, mirrored: false, rotated: false });
    s.care.poops = [1000, 2000, 3000, 4000];
    tick(s, T0 + 20_000);
    expect(s.care.poops.length).toBe(2);
  });
  it("berry tree has a cooldown", () => {
    const s = home();
    expect(() => harvestBerries(s, T0)).toThrow(/berry_locked/);
    s.economy.caretakerLevel = 3;
    harvestBerries(s, T0 + 60_000);
    expect(berryReadyIn(s, T0 + 120_000)).toBeGreaterThan(0);
    expect(() => harvestBerries(s, T0 + 120_000)).toThrow();
    expect(harvestBerries(s, T0 + 60_000 + BERRY_COOLDOWN).kind).toBeDefined();
  });
  it("bestiary records forms once", () => {
    const s = home();
    expect(recordSeen(s, CHISPIN_GENOME, "x", false, T0)).toBe(true);
    expect(recordSeen(s, CHISPIN_GENOME, "x", true, T0)).toBe(false);
    expect(bestiaryStats(s)).toMatchObject({ seen: 1, mine: 1 });
  });
});
