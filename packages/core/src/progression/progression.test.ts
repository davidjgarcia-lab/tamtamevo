import { describe, expect, it } from "vitest";
import {
  addAttributeXp,
  addItem,
  attributeArenaBonuses,
  auditWallet,
  credit,
  dayKey,
  emptyInventory,
  emptyRewardLog,
  emptyWallet,
  grantActivityReward,
  hatchTamtam,
  MAX_ATTRIBUTE_LEVEL,
  MemoryStore,
  totalXpFor,
  upgradeActivity,
  UpgradeRejected,
  xpToNext,
} from "../index";

const tamtam = () =>
  hatchTamtam({
    id: "t",
    speciesId: "fire",
    formId: "fire_baby_chispin",
    requestedName: "Brasa",
    bornAt: 0,
    personality: [],
    affinity: { primary: "fire", secondary: "fire" },
  });

const DAY = 86_400_000;
const reward = (runId: string, ts: number, quality = 1) => ({
  runId,
  tamtamId: "t",
  source: "activity:gym",
  baseCoins: 35,
  quality,
  levelMultiplier: 1,
  baseXp: 60,
  ts,
  tzOffsetMin: 60,
});

describe("activity rewards", () => {
  it("pays once per run id", () => {
    const w = emptyWallet();
    const log = emptyRewardLog();
    const a = grantActivityReward(w, log, reward("run-1", 10 * 3_600_000));
    const b = grantActivityReward(w, log, reward("run-1", 10 * 3_600_000));
    expect(a.coins).toBe(35);
    expect(b.duplicate).toBe(true);
    expect(w.balances.tamcoin).toBe(35);
    expect(log.sessions[Object.keys(log.sessions)[0]!]).toBe(1);
  });

  it("applies diminishing returns per day and resets at 04:00 local", () => {
    const w = emptyWallet();
    const log = emptyRewardLog();
    const base = 2 * DAY + 10 * 3_600_000; // 10:00 UTC = 11:00 local (UTC+1)
    const coins = Array.from({ length: 10 }, (_, i) => grantActivityReward(w, log, reward(`r${i}`, base + i * 60_000)).coins);
    expect(coins).toEqual([35, 35, 35, 35, 18, 18, 18, 18, 4, 4]);
    // 02:30 UTC next day = 03:30 local → still the same game day
    expect(grantActivityReward(w, log, reward("late", 3 * DAY + 2.5 * 3_600_000)).coins).toBe(4);
    // 03:30 UTC = 04:30 local → new day
    expect(grantActivityReward(w, log, reward("new", 3 * DAY + 3.5 * 3_600_000)).coins).toBe(35);
    expect(auditWallet(w).ok).toBe(true);
  });

  it("clamps quality and caps the reward per session", () => {
    const w = emptyWallet();
    const log = emptyRewardLog();
    expect(grantActivityReward(w, log, reward("hi", 0, 99)).coins).toBe(Math.round(35 * 1.5));
    expect(grantActivityReward(w, log, reward("lo", 0, -5)).coins).toBe(Math.round(35 * 0.5));
  });

  it("uses local day keys", () => {
    expect(dayKey(Date.UTC(2026, 10, 19, 3, 59), 0)).toBe("2026-11-18");
    expect(dayKey(Date.UTC(2026, 10, 19, 4, 0), 0)).toBe("2026-11-19");
  });
});

describe("attributes", () => {
  it("follows the XP curve and caps at level 20", () => {
    expect(xpToNext(0)).toBe(100);
    expect(totalXpFor(4)).toBe(700);
    expect(totalXpFor(10)).toBe(3_250);
    let t = tamtam();
    t = addAttributeXp(t, "str", 650).tamtam;
    expect(t.attributes.str).toEqual({ level: 3, xp: 200 }); // 100 + 150 + 200 = 450 → 200 left
    const r = addAttributeXp(t, "str", 1e6);
    expect(r.tamtam.attributes.str.level).toBe(MAX_ATTRIBUTE_LEVEL);
    expect(r.tamtam.attributes.str.xp).toBe(0);
    expect(t.attributes.int.level).toBe(0); // independent attributes
  });

  it("caps Arena bonuses", () => {
    const t = addAttributeXp(addAttributeXp(tamtam(), "str", 1e6).tamtam, "man", 1e6).tamtam;
    const b = attributeArenaBonuses(t);
    expect(b.strPct).toBe(10);
    expect(b.equipmentEfficacyPct).toBe(20);
    expect(b.energyRegenPct).toBe(0);
  });
});

describe("functional object upgrades", () => {
  const state = (coins: number) => {
    const wallet = emptyWallet();
    if (coins) credit(wallet, { key: "seed", currency: "tamcoin", amount: coins, kind: "adjustment", source: "t", ts: 0 });
    return { wallet, inventory: emptyInventory(), activityLevels: { gym: 1, academy: 0, garden: 0, music: 0, workshop: 0 } };
  };

  it("checks attribute, coins and materials, then upgrades atomically", () => {
    const s = state(8_500);
    expect(() => upgradeActivity(s, "gym", 3, { key: "u1", ts: 1 })).toThrow(UpgradeRejected);
    expect(upgradeActivity(s, "gym", 4, { key: "u1", ts: 1 })).toEqual({ level: 2, duplicate: false });
    expect(upgradeActivity(s, "gym", 4, { key: "u1", ts: 2 }).duplicate).toBe(true);
    expect(s.wallet.balances.tamcoin).toBe(6_500);
    expect(() => upgradeActivity(s, "gym", 12, { key: "u2", ts: 3 })).toThrow(/insufficient_funds/);
    credit(s.wallet, { key: "more", currency: "tamcoin", amount: 1_000, kind: "adjustment", source: "t", ts: 3 });
    expect(() => upgradeActivity(s, "gym", 12, { key: "u2", ts: 3 })).toThrow(/missing_materials/);
    expect(s.wallet.balances.tamcoin).toBe(7_500); // failed attempts charged nothing
    addItem(s.inventory, "mat_metal", 6, 3);
    expect(upgradeActivity(s, "gym", 12, { key: "u2", ts: 4 }).level).toBe(3);
    expect(s.inventory.items).toEqual({});
    expect(() => upgradeActivity(s, "gym", 20, { key: "u3", ts: 5 })).toThrow(/max_level/);
    expect(() => upgradeActivity(s, "music", 20, { key: "u4", ts: 5 })).toThrow(/not_owned/);
  });

  it("rolls back inside a store transaction on failure", () => {
    const store = new MemoryStore(state(1_000));
    expect(() => store.transact((s) => upgradeActivity(s, "gym", 4, { key: "u", ts: 1 }))).toThrow(UpgradeRejected);
    expect(store.read().activityLevels.gym).toBe(1);
    expect(store.read().wallet.balances.tamcoin).toBe(1_000);
  });
});
