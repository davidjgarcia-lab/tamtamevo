import { describe, expect, it } from "vitest";
import { matchup, simulateBattle, type Fighter } from "./arena";
import { ARENA_ENERGY, afterFight, arenaGate, arenaPro, chooseCard, equipFighter, offerCards, weeklyBoard } from "./arenaPro";
import { hatch, nameNewTamtam, newGame } from "./game";

const base: Fighter = { name: "A", formId: "f", alleleId: "x", hp: 300, str: 30, def: 20, spd: 40, crit: 20, skillPower: 1.4, skillCooldown: 6 };
const winRate = (a: Fighter, b: Fighter) => {
  let w = 0;
  for (let i = 0; i < 400; i++) if (simulateBattle(a, b, i + 1).winner === 0) w++;
  return w / 400;
};

describe("arena techniques and matchups", () => {
  it("matchup triangles", () => {
    expect(matchup("fire", "plant")).toBeCloseTo(1.15);
    expect(matchup("plant", "fire")).toBeCloseTo(0.87);
    expect(matchup("fire", "electric")).toBe(1);
  });
  it("advantage and techniques change the odds", () => {
    expect(winRate({ ...base, family: "fire" }, { ...base, name: "B", family: "plant" })).toBeGreaterThan(0.6);
    expect(winRate({ ...base, techniques: ["armor"] }, { ...base, name: "B" })).toBeGreaterThan(0.55);
    expect(winRate({ ...base, techniques: ["bounce"] }, { ...base, name: "B" })).toBeGreaterThan(0.55);
  });
  it("techniques show up as events", () => {
    const r = simulateBattle({ ...base, techniques: ["roots", "embers"] }, { ...base, name: "B" }, 5);
    expect(r.events.some((e) => e.type === "technique")).toBe(true);
  });
  it("fierce bites are never dodged", () => {
    const r = simulateBattle({ ...base, techniques: ["fierce"], spd: 1 }, { ...base, name: "B", spd: 400, dodgeBonus: 0.3 }, 9);
    expect(r.events.filter((e) => e.type === "dodge" && e.by === 1).length).toBe(0);
  });
});

describe("arena progression", () => {
  const game = () => {
    const s = newGame(0, { tamtamId: "a" });
    hatch(s, 8_000);
    nameNewTamtam(s, "Brasa", 9_000);
    return s;
  };
  it("energy 5/day, consolation after 3 losses", () => {
    const s = game();
    const now = 86_400_000 * 10;
    for (let i = 0; i < ARENA_ENERGY; i++) {
      expect(arenaGate(s, now).ok).toBe(true);
      afterFight(s, now, false, null);
      s.care.needs.energy = 100;
    }
    const g = arenaGate(s, now);
    expect(g.ok && g.consolation).toBe(true);
    afterFight(s, now, true, null);
    expect(arenaGate(s, now).ok).toBe(false);
    expect(arenaGate(s, now + 86_400_000).ok).toBe(true);
  });
  it("level-up offers two different cards and applies the choice", () => {
    const s = game();
    for (let i = 0; i < 4; i++) afterFight(s, 86_400_000 * (20 + i), true, null);
    const p = arenaPro(s);
    expect(p.level).toBeGreaterThan(1);
    expect(p.offer).toHaveLength(2);
    expect(p.offer![0]).not.toBe(p.offer![1]);
    chooseCard(s, p.offer![0]!);
    expect(p.cards).toHaveLength(1);
    expect(offerCards(s, 3)).toHaveLength(2);
    const f = equipFighter(s, base);
    expect(f.family).toBeDefined();
  });
  it("weekly board includes the player", () => {
    const s = game();
    afterFight(s, 86_400_000 * 30, true, null);
    const b = weeklyBoard(s, 86_400_000 * 30);
    expect(b.some((r) => r.me && r.wins === 1)).toBe(true);
  });
});
