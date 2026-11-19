import { describe, expect, it } from "vitest";
import {
  advanceCare, arenaStrength, auditWallet, buy, careAction, completeGymSession, debugAttributeLevels, debugCoins, debugForceEvolution,
  deserialize, eggProgress, feedFood, GameRuleError, GYM, hatch, MemoryStore, nameNewTamtam, newCareState, newGame, place, quantity,
  rename, serialize, simulate, PROFILES, upgradeGym, tick, setFinish, DEFAULT_CARE_CONFIG, type GameState,
} from "../index";

const H = 3_600_000;
const T0 = Date.UTC(2026, 10, 20, 9, 0); // 10:00 local (UTC+1)

function hatched(name = "Pimpollo"): GameState {
  const s = newGame(T0, { tamtamId: "tt-1" });
  hatch(s, T0 + 8_000);
  nameNewTamtam(s, name, T0 + 21_000);
  return s;
}

describe("birth and naming", () => {
  it("incubates, hatches only when ready and keeps the chosen name", () => {
    const s = newGame(T0, { tamtamId: "tt-1" });
    expect(s.phase).toBe("egg");
    expect(eggProgress(s, T0 + 4_000)).toBeCloseTo(0.5);
    expect(() => hatch(s, T0 + 5_000)).toThrow(GameRuleError);
    hatch(s, T0 + 8_000);
    expect(s.phase).toBe("naming");
    const t = nameNewTamtam(s, "  Pimpollo ", T0 + 21_000);
    expect(t.name).toBe("Pimpollo");
    expect(s.phase).toBe("home");
  });

  it("uses a default name when left empty and persists names across save/load and evolution", () => {
    const s = newGame(T0, { tamtamId: "tt-9" });
    hatch(s, T0 + 8_000);
    nameNewTamtam(s, "", T0 + 21_000);
    expect(s.tamtam!.name.length).toBeGreaterThan(1);
    rename(s, "Tizón", T0 + 30_000);
    const back = deserialize<GameState>(serialize(s, 1, 0), 1).state;
    expect(back.tamtam!.name).toBe("Tizón");
    debugForceEvolution(back, { formId: "fire_child_fogarin", stage: "child" }, T0 + H);
    expect(back.tamtam!.name).toBe("Tizón");
    expect(back.tamtam!.formId).toBe("fire_child_fogarin");
    expect(() => debugForceEvolution(back, { formId: "fire_child_fogarin", stage: "child" }, T0 + H)).toThrow(/already_in_form/);
  });
});

describe("care over time (simulated clock)", () => {
  it("decays needs while closed exactly as if watched", () => {
    const a = newCareState(0);
    const b = newCareState(0);
    advanceCare(a, 3 * H);
    for (let m = 1; m <= 180; m++) advanceCare(b, m * 60_000);
    expect(a.needs.hunger).toBeCloseTo(80 - 18, 5);
    for (const k of Object.keys(a.needs) as (keyof typeof a.needs)[]) expect(b.needs[k]).toBeCloseTo(a.needs[k], 6);
    expect(Math.abs(a.maturity - b.maturity) / b.maturity).toBeLessThan(0.005);
  });

  it("halves decay after 8 h of absence and never drops below the floor", () => {
    const s = newCareState(0);
    advanceCare(s, 12 * H);
    // hunger: 80 − 6·8 = 32 → then −3/h for 4 h = 20 → floor 25
    expect(s.needs.hunger).toBe(25);
    advanceCare(s, 7 * 24 * H);
    for (const v of Object.values(s.needs)) expect(v).toBeGreaterThanOrEqual(25);
  });

  it("ignores clocks moved backwards", () => {
    const s = newCareState(10 * H);
    const before = JSON.stringify(s);
    advanceCare(s, 5 * H);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("recovers energy while sleeping and wakes up when full", () => {
    const s = hatched();
    s.care.needs.energy = 40;
    careAction(s, "sleep", T0 + H);
    tick(s, T0 + 3 * H);
    // 40 − 5 (1 h awake before sleeping) + 12·2 h asleep ≈ 59
    expect(s.care.needs.energy).toBeCloseTo(59, 0);
    expect(s.care.asleep).toBe(true);
    // Full at ≈ 59 + 12·3.4 h → wakes up by itself around T0 + 6.4 h.
    tick(s, T0 + 6.3 * H);
    expect(s.care.asleep).toBe(true);
    tick(s, T0 + 6.5 * H);
    expect(s.care.asleep).toBe(false);
    expect(s.care.needs.energy).toBeGreaterThan(99);
  });

  it("produces poop after meals that lowers hygiene until cleaned", () => {
    const s = hatched();
    feedFood(s, "food_berry_bun", T0 + H);
    tick(s, T0 + H + 89 * 60_000);
    expect(s.care.poops).toHaveLength(0);
    tick(s, T0 + H + 151 * 60_000);
    expect(s.care.poops).toHaveLength(1);
    const h = s.care.needs.hygiene;
    careAction(s, "clean", T0 + 3 * H);
    expect(s.care.poops).toHaveLength(0);
    expect(s.care.needs.hygiene).toBeGreaterThan(h);
  });
});

describe("feeding", () => {
  it("consumes inventory, rewards favourites, refuses when full without consuming", () => {
    const s = hatched();
    s.care.needs.hunger = 40;
    expect(feedFood(s, "food_ember_pepper", T0 + H)).toBe("eat_favorite");
    expect(quantity(s.economy.inventory, "food_ember_pepper")).toBe(1);
    // 40 − 6 (1 h of decay) + 30 = 64
    expect(s.care.needs.hunger).toBeCloseTo(64, 0);
    s.care.needs.hunger = 99;
    expect(feedFood(s, "food_berry_bun", T0 + H + 1)).toBe("refuse_full");
    expect(quantity(s.economy.inventory, "food_berry_bun")).toBe(3);
    expect(() => feedFood(s, "food_power_stew", T0 + H + 2)).toThrow(/no_food/);
  });

  it("dislikes cold food and applies special-food buffs", () => {
    const s = hatched();
    s.care.needs.hunger = 30;
    buy(s, "food_cool_jelly", "j1", T0);
    const hap = s.care.needs.happiness;
    expect(feedFood(s, "food_cool_jelly", T0 + 1)).toBe("dislike");
    expect(s.care.needs.happiness).toBeLessThan(hap);
    debugCoins(s, 500, T0);
    buy(s, "food_power_stew", "p1", T0);
    s.care.needs.hunger = 30;
    const e = s.care.needs.energy;
    feedFood(s, "food_power_stew", T0 + 2);
    expect(s.care.needs.energy).toBeGreaterThan(e);
    expect(s.buffs).toContain("str_5_next_fight");
  });
});

describe("gym", () => {
  it("costs energy, pays coins and STR XP, and is idempotent per run", () => {
    const s = hatched();
    const coins = s.economy.wallet.balances.tamcoin;
    const r = completeGymSession(s, { runId: "g1", quality: 1, now: T0 + H, tzOffsetMin: 60 });
    expect(r).toMatchObject({ ok: true, coins: 35, xp: 60 });
    expect(completeGymSession(s, { runId: "g1", quality: 1, now: T0 + H, tzOffsetMin: 60 }).duplicate).toBe(true);
    expect(s.economy.wallet.balances.tamcoin).toBe(coins + 35);
    expect(s.tamtam!.attributes.str.xp).toBe(60);
    expect(s.care.needs.energy).toBeLessThan(90);
  });

  it("refuses when too tired and lets the Tamtam recover", () => {
    const s = hatched();
    s.care.needs.energy = 3;
    expect(completeGymSession(s, { runId: "g", quality: 1, now: T0 + H, tzOffsetMin: 60 })).toMatchObject({ ok: false, reason: "too_tired" });
    // A 20-minute nap recovers 15 energy; then the gym (cost 5 at level 1) is possible again.
    expect(careAction(s, "nap", T0 + H)).toBe("nap");
    tick(s, T0 + H + 20 * 60_000);
    expect(s.care.needs.energy).toBeGreaterThanOrEqual(17);
    expect(s.care.napUntil).toBeNull();
    expect(completeGymSession(s, { runId: "g2", quality: 1, now: T0 + H + 21 * 60_000, tzOffsetMin: 60 }).ok).toBe(true);
  });

  it("naps have a 90-minute cooldown and gym cost grows with level (5/8/10)", () => {
    const s = hatched();
    expect(careAction(s, "nap", T0 + H)).toBe("nap");
    expect(careAction(s, "nap", T0 + H + 30 * 60_000)).toBe("not_sleepy");
    expect(careAction(s, "nap", T0 + H + 91 * 60_000)).toBe("nap");
    expect(GYM.energyCostByLevel).toEqual({ 1: 5, 2: 8, 3: 10 });
  });

  it("every 10 sessions raises STR and the Arena stat reflects it", () => {
    const s = hatched();
    const before = arenaStrength(s).total;
    for (let i = 0; i < 10; i++) {
      s.care.needs.energy = 100;
      completeGymSession(s, { runId: `r${i}`, quality: 1.2, now: T0 + H + i * 60_000, tzOffsetMin: 60 });
    }
    expect(s.gym.strTrainingPoints).toBe(1);
    expect(s.tamtam!.attributes.str.level).toBeGreaterThanOrEqual(3);
    const after = arenaStrength(s);
    expect(after.fromTraining).toBe(1);
    expect(after.total).toBeGreaterThan(before);
  });

  it("upgrades through three levels with requirements", () => {
    const s = hatched();
    expect(() => upgradeGym(s, "u1", T0)).toThrow(/attribute_too_low/);
    debugAttributeLevels(s, "str", 4);
    debugCoins(s, 2_000, T0);
    expect(upgradeGym(s, "u1", T0)).toBe(2);
    expect(GYM.levelMultiplier[2]).toBe(1.25);
    expect(auditWallet(s.economy.wallet).ok).toBe(true);
  });
});

describe("economy loop: gym coins → shop → room", () => {
  it("earns, buys a chair with those coins and places it", () => {
    const store = new MemoryStore(hatched());
    for (let i = 0; i < 4; i++) {
      store.transact((s) => {
        s.care.needs.energy = 100;
        completeGymSession(s, { runId: `run${i}`, quality: 1, now: T0 + H + i * 60_000, tzOffsetMin: 60 });
      });
    }
    expect(store.read().economy.wallet.balances.tamcoin).toBe(300 + 4 * 35);
    // Too expensive (650 > 440): nothing changes.
    expect(() => store.transact((s) => buy(s, "furn_sofa_cushion", "buy-sofa", T0 + 2 * H))).toThrow(/too_expensive/);
    expect(store.read().economy.wallet.balances.tamcoin).toBe(440);
    store.transact((s) => {
      buy(s, "furn_chair_wood", "buy-chair", T0 + 2 * H);
      place(s, { uid: "chair-1", itemId: "furn_chair_wood", layer: "floor", x: 7, y: 2, mirrored: false, rotated: false });
    });
    expect(store.read().economy.wallet.balances.tamcoin).toBe(320);
    expect(store.read().room.placements.some((p) => p.uid === "chair-1")).toBe(true);
    // Retrying the same purchase intent does not charge again.
    store.transact((s) => buy(s, "furn_chair_wood", "buy-chair", T0 + 3 * H));
    expect(store.read().economy.wallet.balances.tamcoin).toBe(320);
  });
});

describe("lifecycle simulation", () => {
  it("baby → adult eligibility takes 5–7 days for every engaged profile", () => {
    for (const p of PROFILES.filter((x) => x.id !== "absence")) {
      const r = simulate(p, 10, DEFAULT_CARE_CONFIG);
      expect(r.hoursToAdult, p.id).not.toBeNull();
      expect(r.hoursToAdult!, p.id).toBeGreaterThanOrEqual(119);
      expect(r.hoursToAdult!, p.id).toBeLessThanOrEqual(168);
    }
  });
});

describe("nest-house finishes", () => {
  it("applies owned wall/floor finishes and refuses others", () => {
    const s = hatched();
    expect(s.room.finishes.wallpaper).toBe("wall_woven");
    expect(() => setFinish(s, "wall", "wall_logs")).toThrow(/not_owned/);
    debugCoins(s, 1000, T0);
    buy(s, "wall_logs", "w1", T0);
    setFinish(s, "wall", "wall_logs");
    expect(s.room.finishes.wallpaper).toBe("wall_logs");
    expect(() => setFinish(s, "floor", "wall_logs")).toThrow(/not_a_finish/);
  });
});
