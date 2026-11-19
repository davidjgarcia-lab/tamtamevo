import { describe, expect, it } from "vitest";
import {
  cleanPoop, completeMinigame, completeStudySession, debugNewEgg, feedFood, fight, hatch, makeRivals, nameNewTamtam, newGame,
  playerFighter, poopSpot, rankOf, simulateBattle, swapWithFarm, tick, type GameState,
} from "../index";

const H = 3_600_000;
const T0 = Date.UTC(2026, 10, 20, 9, 0);
const home = (): GameState => {
  const s = newGame(T0, { tamtamId: "a" });
  hatch(s, T0 + 8_000);
  nameNewTamtam(s, "Brasa", T0 + 9_000);
  return s;
};

describe("study", () => {
  it("pays coins and Intelligence once per run and costs energy", () => {
    const s = home();
    const e = s.care.needs.energy;
    const r = completeStudySession(s, { runId: "s1", quality: 1.2, now: T0 + H, tzOffsetMin: 60 });
    expect(r.ok).toBe(true);
    expect(r.coins).toBe(36);
    expect(s.tamtam!.attributes.int.xp).toBe(60);
    expect(s.care.needs.energy).toBeLessThan(e);
    expect(completeStudySession(s, { runId: "s1", quality: 1.2, now: T0 + H, tzOffsetMin: 60 }).duplicate).toBe(true);
  });
});

describe("minigames", () => {
  it("records best scores, rewards with diminishing returns and never pays twice", () => {
    const s = home();
    const a = completeMinigame(s, { game: "trail", runId: "r1", score: 200, now: T0 + H, tzOffsetMin: 60 });
    expect(a.coins).toBe(Math.round(30 * 1.0));
    expect(a.newRecord).toBe(true);
    expect(completeMinigame(s, { game: "trail", runId: "r1", score: 200, now: T0 + H, tzOffsetMin: 60 }).duplicate).toBe(true);
    const b = completeMinigame(s, { game: "trail", runId: "r2", score: 100, now: T0 + H + 1, tzOffsetMin: 60 });
    expect(b.newRecord).toBe(false);
    expect(s.records.trail).toEqual({ best: 200, plays: 2 });
  });
});

describe("arena", () => {
  it("simulates deterministic fights and stronger fighters win more", () => {
    const s = home();
    const me = playerFighter(s);
    const weak = { ...me, name: "Weak", hp: Math.round(me.hp * 0.7), str: Math.round(me.str * 0.7) };
    expect(simulateBattle(me, weak, 5)).toEqual(simulateBattle(me, weak, 5));
    let wins = 0;
    for (let i = 1; i <= 100; i++) if (simulateBattle(me, weak, i).winner === 0) wins++;
    expect(wins).toBeGreaterThan(80);
    // Even fights are close to 50/50 (variability, not level comparison).
    let even = 0;
    for (let i = 1; i <= 200; i++) if (simulateBattle(me, { ...me, name: "Twin" }, i).winner === 0) even++;
    expect(even).toBeGreaterThan(70);
    expect(even).toBeLessThan(130);
  });

  it("records results once, moves PC and protects Bronze from relegation", () => {
    const s = home();
    const rivals = makeRivals(playerFighter(s), 42);
    expect(rivals.map((r) => r.difficulty)).toEqual(["easy", "even", "hard"]);
    const r1 = fight(s, rivals[0]!.fighter, "easy", { fightId: "f1", seed: 1, now: T0 + H });
    const dup = fight(s, rivals[0]!.fighter, "easy", { fightId: "f1", seed: 1, now: T0 + H });
    expect(dup.duplicate).toBe(true);
    expect(s.arena.wins + s.arena.losses).toBe(1);
    expect(s.arena.pc).toBeGreaterThanOrEqual(0);
    expect(r1.result.events.at(-1)!.type).toBe("end");
    expect(rankOf(0).name).toBe("Bronce");
    expect(rankOf(750).name).toBe("Oro");
  });
});

describe("farm and room mess", () => {
  it("adds newborns to the farm and swaps them with the active Tamtam", () => {
    const s = home();
    debugNewEgg(s, T0 + H, "b", "azul");
    expect(s.farm).toHaveLength(1);
    swapWithFarm(s, 0, T0 + 2 * H);
    expect(s.tamtam!.id).toBe("b");
    expect(s.alleleId).toBe("azul");
    expect(s.farm[0]!.tamtam.name).toBe("Brasa");
  });

  it("poops sit at stable spots and the mop removes the right one", () => {
    const s = home();
    feedFood(s, "food_berry_bun", T0 + H);
    tick(s, T0 + 4 * H);
    expect(s.care.poops.length).toBe(1);
    const ts = s.care.poops[0]!;
    expect(poopSpot(ts)).toEqual(poopSpot(ts));
    cleanPoop(s.care, ts, T0 + 4 * H);
    expect(s.care.poops).toHaveLength(0);
  });
});
