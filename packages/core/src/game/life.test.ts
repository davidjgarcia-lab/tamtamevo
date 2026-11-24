import { describe, expect, it } from "vitest";
import { careAction, debugProblem, finishBath, hatch, life, mopPoop, nameNewTamtam, newGame, payCare, solveProblem, speechFor, tick, xpForLevel, type GameState } from "../index";

const T0 = Date.UTC(2026, 10, 20, 9, 0);
const H = 3_600_000;
function home(): GameState {
  const s = newGame(T0, { tamtamId: "tt-life" });
  hatch(s, T0 + 8_000);
  nameNewTamtam(s, "Chispa", T0 + 9_000);
  return s;
}

describe("care pays and caretaker level", () => {
  it("petting pays coins and XP, with a daily cap", () => {
    const s = home();
    const c0 = s.economy.wallet.balances.tamcoin;
    careAction(s, "pet", T0 + H);
    expect(s.economy.wallet.balances.tamcoin).toBeGreaterThan(c0);
    expect(life(s).totalXp).toBe(6);
    for (let i = 0; i < 40; i++) payCare(s, "pet", T0 + H + 1000 * (i + 1));
    expect(payCare(s, "pet", T0 + H + 99_000).capped).toBe(true);
  });

  it("levels up with the curve and unlocks shop items", () => {
    const s = home();
    expect(s.economy.caretakerLevel).toBe(1);
    expect(xpForLevel(1)).toBe(35);
    for (let i = 0; i < 6; i++) payCare(s, "problem", T0 + H + i);
    expect(s.economy.caretakerLevel).toBeGreaterThanOrEqual(3);
  });

  it("a thorough bath cleans more than a quick one", () => {
    const a = home(), b = home();
    a.care.needs.hygiene = 20; b.care.needs.hygiene = 20;
    finishBath(a, 1, T0 + 1000); finishBath(b, 0, T0 + 1000);
    expect(a.care.needs.hygiene).toBeGreaterThan(b.care.needs.hygiene + 30);
  });

  it("mopping each poop pays", () => {
    const s = home();
    s.care.poops.push(T0 + 500);
    const c0 = s.economy.wallet.balances.tamcoin;
    mopPoop(s, T0 + 500, T0 + 1000);
    expect(s.care.poops).toHaveLength(0);
    expect(s.economy.wallet.balances.tamcoin).toBe(c0 + 6);
  });
});

describe("problems", () => {
  it("spawn after a few hours, expire with a penalty, or are solved for a reward", () => {
    const s = home();
    tick(s, T0 + 3 * H);
    expect(life(s).problem).not.toBeNull();
    const id = life(s).problem!.id;
    const c0 = s.economy.wallet.balances.tamcoin;
    solveProblem(s, T0 + 3 * H + 60_000);
    expect(life(s).problem).toBeNull();
    expect(s.economy.wallet.balances.tamcoin).toBeGreaterThan(c0);
    expect(id).toBeTruthy();
    debugProblem(s, "thorn", T0 + 4 * H);
    const hap = s.care.needs.happiness;
    tick(s, T0 + 6.5 * H);
    expect(life(s).problem).toBeNull();
    expect(s.care.needs.happiness).toBeLessThan(hap);
  });

  it("the Tamtam says what it needs", () => {
    const s = home();
    s.care.needs.hunger = 10;
    expect(speechFor(s, T0).mood).toBe("hungry");
    s.care.needs.hunger = 90; s.care.needs.hygiene = 10;
    expect(speechFor(s, T0).mood).toBe("dirty");
  });
});
