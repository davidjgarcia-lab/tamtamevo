import { credit, debit, hasApplied, type LedgerEntry, type WalletState } from "../economy/wallet";
import { addItem, quantity, removeItem, type InventoryState } from "../inventory/inventory";
import type { ActivityId, CatalogItem, Requirement } from "./catalog";

/** Purchase / sale flows (ECONOMY_SYSTEM §2.4). Run inside Store.transact. */

export interface PlayerEconomyState {
  wallet: WalletState;
  inventory: InventoryState;
  caretakerLevel: number;
  activityLevels: Record<ActivityId, number>;
}

export type ItemStatus =
  | { status: "available" }
  | { status: "owned" }
  | { status: "too_expensive"; missing: number }
  | { status: "locked"; requirement: Requirement | { type: "retired" } };

export class PurchaseError extends Error {
  constructor(public readonly detail: ItemStatus) {
    super(`Cannot buy: ${detail.status}`);
  }
}

function unmet(state: Readonly<PlayerEconomyState>, item: CatalogItem): Requirement | null {
  if (state.caretakerLevel < item.level) return { type: "caretakerLevel", level: item.level };
  for (const r of item.requirements) {
    if (r.type === "caretakerLevel" && state.caretakerLevel < r.level) return r;
    if (r.type === "activityLevel" && (state.activityLevels[r.activity] ?? 0) < r.level) return r;
    if (r.type === "owns" && quantity(state.inventory, r.itemId) < 1) return r;
  }
  return null;
}

export function itemStatus(state: Readonly<PlayerEconomyState>, item: CatalogItem, qty = 1): ItemStatus {
  if (item.retired) return { status: "locked", requirement: { type: "retired" } };
  if (quantity(state.inventory, item.id) + qty > item.maxOwned) return { status: "owned" };
  const req = unmet(state, item);
  if (req) return { status: "locked", requirement: req };
  const cost = item.price.amount * qty;
  const have = state.wallet.balances[item.price.currency];
  if (have < cost) return { status: "too_expensive", missing: cost - have };
  return { status: "available" };
}

export interface PurchaseResult {
  entry: LedgerEntry | null;
  duplicate: boolean;
}

/**
 * Buys `qty` copies. `key` is the client's purchase-intent id: retrying with the same
 * key never charges twice. Free items (price 0) are granted without a ledger entry,
 * but still idempotently (the key is recorded in `wallet.keys` with index -1).
 */
export function purchase(
  state: PlayerEconomyState,
  item: CatalogItem,
  opts: { key: string; qty?: number; ts: number },
): PurchaseResult {
  const qty = opts.qty ?? 1;
  const ledgerKey = `purchase:${opts.key}`;
  if (hasApplied(state.wallet, ledgerKey)) {
    const i = state.wallet.keys[ledgerKey]!;
    return { entry: i >= 0 ? state.wallet.ledger[i]! : null, duplicate: true };
  }
  if (!item.stackable && qty !== 1) throw new RangeError("Non-stackable items are bought one at a time");
  const st = itemStatus(state, item, qty);
  if (st.status !== "available") throw new PurchaseError(st);

  let entry: LedgerEntry | null = null;
  const cost = item.price.amount * qty;
  if (cost > 0) {
    entry = debit(state.wallet, { key: ledgerKey, currency: item.price.currency, amount: cost, kind: "purchase", source: `shop:${item.id}`, ts: opts.ts }).entry;
  } else {
    // zero-cost grants still need an idempotency record
    state.wallet.keys[ledgerKey] = -1;
  }
  addItem(state.inventory, item.id, qty, opts.ts);
  return { entry, duplicate: false };
}

/** Sells copies that are not placed in the house. */
export function sell(
  state: PlayerEconomyState,
  item: CatalogItem,
  opts: { key: string; qty?: number; ts: number; placedCount: number },
): PurchaseResult {
  const qty = opts.qty ?? 1;
  const ledgerKey = `sale:${opts.key}`;
  if (hasApplied(state.wallet, ledgerKey)) {
    const i = state.wallet.keys[ledgerKey]!;
    return { entry: i >= 0 ? state.wallet.ledger[i]! : null, duplicate: true };
  }
  const free = quantity(state.inventory, item.id) - opts.placedCount;
  if (free < qty) throw new RangeError(`Only ${free} unplaced copies of "${item.id}" can be sold`);
  removeItem(state.inventory, item.id, qty);
  const value = Math.floor(item.price.amount * (item.sellRatio ?? 0.4)) * qty;
  if (value <= 0) {
    state.wallet.keys[ledgerKey] = -1;
    return { entry: null, duplicate: false };
  }
  const { entry } = credit(state.wallet, { key: ledgerKey, currency: item.price.currency, amount: value, kind: "sale", source: `shop:${item.id}`, ts: opts.ts });
  return { entry, duplicate: false };
}
