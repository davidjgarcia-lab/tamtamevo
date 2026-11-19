import { describe, expect, it } from "vitest";
import {
  addItem,
  auditWallet,
  consumeItems,
  credit,
  debit,
  deserialize,
  emptyInventory,
  emptyWallet,
  history,
  InsufficientFunds,
  InsufficientItems,
  InvalidAmount,
  itemStatus,
  MemoryStore,
  purchase,
  PurchaseError,
  quantity,
  removeItem,
  sell,
  serialize,
  validateCatalog,
  CatalogError,
  type CatalogItem,
  type PlayerEconomyState,
} from "../index";

const item = (over: Partial<CatalogItem> = {}): CatalogItem => ({
  id: "furn_chair_wood",
  name: { es: "Silla de madera", en: "Wooden chair" },
  description: { es: "", en: "" },
  image: "placeholder/chair",
  price: { currency: "tamcoin", amount: 120 },
  category: "furniture",
  rarity: "common",
  level: 1,
  requirements: [],
  effects: [],
  maxOwned: 5,
  stackable: true,
  furniture: { layer: "floor", w: 1, h: 1, mirrorable: true, rotatable: false },
  artStatus: "placeholder",
  ...over,
});

const player = (coins = 0): PlayerEconomyState => {
  const wallet = emptyWallet();
  if (coins > 0) credit(wallet, { key: "seed", currency: "tamcoin", amount: coins, kind: "adjustment", source: "test", ts: 0 });
  return {
    wallet,
    inventory: emptyInventory(),
    caretakerLevel: 1,
    activityLevels: { gym: 1, academy: 0, garden: 0, music: 0, workshop: 0 },
  };
};

const m = (key: string, amount: number) => ({ key, currency: "tamcoin" as const, amount, kind: "reward" as const, source: "test", ts: 1 });

describe("wallet", () => {
  it("credits and debits, keeping an auditable ledger", () => {
    const w = emptyWallet();
    credit(w, m("a", 100));
    debit(w, m("b", 30));
    credit(w, { ...m("c", 5), currency: "astrolite" });
    expect(w.balances).toEqual({ tamcoin: 70, astrolite: 5 });
    expect(w.ledger.map((e) => e.balanceAfter)).toEqual([100, 70, 5]);
    expect(auditWallet(w).ok).toBe(true);
    expect(history(w, "tamcoin").map((e) => e.key)).toEqual(["b", "a"]);
  });

  it("is idempotent: the same key never applies twice", () => {
    const w = emptyWallet();
    expect(credit(w, m("reward:run-1", 50)).duplicate).toBe(false);
    expect(credit(w, m("reward:run-1", 50)).duplicate).toBe(true);
    expect(credit(w, m("reward:run-1", 999)).duplicate).toBe(true);
    expect(w.balances.tamcoin).toBe(50);
    expect(w.ledger).toHaveLength(1);
  });

  it("never goes negative", () => {
    const w = emptyWallet();
    credit(w, m("a", 10));
    expect(() => debit(w, m("b", 11))).toThrow(InsufficientFunds);
    expect(w.balances.tamcoin).toBe(10);
  });

  it("rejects invalid amounts", () => {
    const w = emptyWallet();
    for (const bad of [0, -5, 1.5, NaN, Infinity, 2e9]) expect(() => credit(w, m(`k${bad}`, bad))).toThrow(InvalidAmount);
    expect(w.ledger).toHaveLength(0);
  });

  it("detects tampering in audit", () => {
    const w = emptyWallet();
    credit(w, m("a", 10));
    w.balances.tamcoin = 1_000;
    expect(auditWallet(w).ok).toBe(false);
  });
});

describe("inventory", () => {
  it("adds, removes and refuses to go below zero", () => {
    const inv = emptyInventory();
    addItem(inv, "seed_tomato", 3, 1);
    removeItem(inv, "seed_tomato", 2);
    expect(quantity(inv, "seed_tomato")).toBe(1);
    expect(() => removeItem(inv, "seed_tomato", 2)).toThrow(InsufficientItems);
    removeItem(inv, "seed_tomato", 1);
    expect(inv.items).toEqual({});
    expect(() => addItem(inv, "x", 0, 1)).toThrow(RangeError);
  });

  it("consumes recipes all-or-nothing", () => {
    const inv = emptyInventory();
    addItem(inv, "mat_wood", 2, 1);
    addItem(inv, "mat_cloth", 1, 1);
    expect(() => consumeItems(inv, { mat_wood: 2, mat_cloth: 2 })).toThrow(InsufficientItems);
    expect(quantity(inv, "mat_wood")).toBe(2);
    consumeItems(inv, { mat_wood: 2, mat_cloth: 1 });
    expect(inv.items).toEqual({});
  });
});

describe("shop", () => {
  it("validates the catalogue", () => {
    expect(validateCatalog([item(), item({ id: "rug_round" })]).size).toBe(2);
    expect(() => validateCatalog([item(), item()])).toThrow(CatalogError);
    expect(() => validateCatalog([item({ price: { currency: "tamcoin", amount: -1 } })])).toThrow(CatalogError);
    expect(() => validateCatalog([item({ requirements: [{ type: "owns", itemId: "nope" }] })])).toThrow(CatalogError);
  });

  it("reports item status", () => {
    const p = player(100);
    expect(itemStatus(p, item())).toEqual({ status: "too_expensive", missing: 20 });
    expect(itemStatus(p, item({ level: 3 }))).toMatchObject({ status: "locked" });
    expect(itemStatus(p, item({ requirements: [{ type: "activityLevel", activity: "gym", level: 2 }] }))).toMatchObject({ status: "locked" });
    expect(itemStatus(player(500), item())).toEqual({ status: "available" });
  });

  it("charges and delivers atomically and idempotently", () => {
    const store = new MemoryStore(player(500));
    const chair = item();
    const r1 = store.transact((s) => purchase(s, chair, { key: "intent-1", ts: 10 }));
    const r2 = store.transact((s) => purchase(s, chair, { key: "intent-1", ts: 11 })); // double tap / retry
    expect(r1.duplicate).toBe(false);
    expect(r2.duplicate).toBe(true);
    expect(store.read().wallet.balances.tamcoin).toBe(380);
    expect(quantity(store.read().inventory, chair.id)).toBe(1);
    expect(auditWallet(store.read().wallet).ok).toBe(true);
  });

  it("leaves no trace when a purchase fails mid-way", () => {
    const store = new MemoryStore(player(100));
    const before = store.read();
    expect(() => store.transact((s) => purchase(s, item(), { key: "intent-2", ts: 10 }))).toThrow(PurchaseError);
    expect(store.read()).toBe(before);
    // A failure *after* the debit (simulated) also rolls back:
    const rich = new MemoryStore(player(1_000));
    expect(() =>
      rich.transact((s) => {
        purchase(s, item(), { key: "intent-3", ts: 10 });
        throw new Error("crash after debit");
      }),
    ).toThrow("crash after debit");
    expect(rich.read().wallet.balances.tamcoin).toBe(1_000);
    expect(rich.read().inventory.items).toEqual({});
  });

  it("respects maxOwned and grants free items idempotently", () => {
    const s = player(10_000);
    const unique = item({ id: "gym_dumbbells", price: { currency: "tamcoin", amount: 0 }, maxOwned: 1, stackable: false });
    purchase(s, unique, { key: "gift", ts: 1 });
    expect(purchase(s, unique, { key: "gift", ts: 2 }).duplicate).toBe(true);
    expect(() => purchase(s, unique, { key: "gift-2", ts: 3 })).toThrow(PurchaseError);
    expect(quantity(s.inventory, "gym_dumbbells")).toBe(1);
  });

  it("sells only unplaced copies at the sell-back ratio", () => {
    const s = player(1_000);
    const chair = item();
    purchase(s, chair, { key: "a", ts: 1, qty: 2 });
    expect(() => sell(s, chair, { key: "s1", ts: 2, qty: 2, placedCount: 1 })).toThrow(RangeError);
    sell(s, chair, { key: "s1", ts: 2, qty: 1, placedCount: 1 });
    sell(s, chair, { key: "s1", ts: 3, qty: 1, placedCount: 1 }); // duplicate
    expect(s.wallet.balances.tamcoin).toBe(1_000 - 240 + 48);
    expect(quantity(s.inventory, chair.id)).toBe(1);
  });
});

describe("persistence", () => {
  it("round-trips economy state through a versioned snapshot", () => {
    const s = player(300);
    purchase(s, item(), { key: "p", ts: 5 });
    const json = serialize(s, 1, 99);
    const back = deserialize<PlayerEconomyState>(json, 1).state;
    expect(back).toEqual(s);
    expect(auditWallet(back.wallet).ok).toBe(true);
    // idempotency survives a reload
    expect(purchase(back, item(), { key: "p", ts: 6 }).duplicate).toBe(true);
  });

  it("refuses saves from newer versions", () => {
    expect(() => deserialize(serialize({}, 3, 0), 2)).toThrow(/newer version/);
  });
});
