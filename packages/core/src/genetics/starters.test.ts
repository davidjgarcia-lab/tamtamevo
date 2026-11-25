import { describe, expect, it } from "vitest";
import { feedFood, hatch, nameNewTamtam, newGame, speechFor, starterById, STARTERS, pickStarter } from "../index";

const T0 = Date.UTC(2026, 10, 25, 9, 0);
const born = (id: string) => {
  const s = newGame(T0, { tamtamId: id });
  hatch(s, T0 + 8_000);
  nameNewTamtam(s, "", T0 + 9_000);
  return s;
};

describe("starters", () => {
  it("there is one starter per family (plasma has two looks) and every one can hatch", () => {
    expect(STARTERS).toHaveLength(11);
    expect(new Set(STARTERS.map((s) => s.family)).size).toBe(10);
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) seen.add(pickStarter(`egg-${i}`).id);
    expect(seen.size).toBe(11);
  });
  it("the egg hatches its starter with genome, species name, traits and a themed default name", () => {
    const s = born("tt-1");
    const st = pickStarter("tt-1");
    expect(s.tamtam!.starterId).toBe(st.id);
    expect(s.tamtam!.genome!.parts.body).toBe(st.family);
    expect(s.tamtam!.formName).toBe(st.species);
    expect(s.tamtam!.personality).toEqual(st.traits);
    expect(s.tamtam!.name.length).toBeGreaterThan(1);
  });
  it("its own favourite food counts as favourite and it speaks with its own lines", () => {
    const s = born("tt-1");
    const st = starterById(s.tamtam!.starterId!)!;
    s.care.needs.hunger = 10;
    s.economy.inventory.items[st.favoriteFood] = { qty: 2 } as never;
    expect(feedFood(s, st.favoriteFood, T0 + 20_000)).toBe("eat_favorite");
    const lines = new Set<string>();
    s.care.needs.hunger = 90;
    for (let m = 0; m < 20; m++) lines.add(speechFor(s, T0 + m * 60_000).text);
    expect([...lines].some((l) => [...st.lines.happy, ...st.lines.bored, ...st.lines.lonely].includes(l))).toBe(true);
  });
});

describe("evolution lines", () => {
  it("keep the starter's line until another family takes 3+ parts", async () => {
    const { nextLine, evolvedLook } = await import("./physics");
    const g = (parts: string[]) => ({ parts: { body: parts[0], head: parts[1], legs: parts[2], tail: parts[3], back: parts[4] } }) as never;
    expect(nextLine("fire", g(["fire", "water", "water", "plant", "fire"]))).toBe("fire");
    expect(nextLine("fire", g(["water", "water", "water", "plant", "fire"]))).toBe("water");
    expect(nextLine("fire", g(["light", "water", "plant", "rock", "shadow"]))).toBe("fire");
    const look = evolvedLook({ ...(g(["fire", "shadow", "light", "shadow", "fire"]) as object), line: "fire" } as never, "adult");
    expect(look).toMatchObject({ art: "fire", secondary: "shadow", gait: "fly" });
  });
});
