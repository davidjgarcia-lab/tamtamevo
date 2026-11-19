/**
 * Wallet over an append-only ledger (ECONOMY_SYSTEM §2).
 * Pure functions on a mutable draft — call them inside `Store.transact` so a
 * composite operation (debit + inventory + …) is atomic.
 */

export type Currency = "tamcoin" | "astrolite";
export const CURRENCIES: readonly Currency[] = ["tamcoin", "astrolite"];

export type EntryKind = "reward" | "purchase" | "sale" | "upgrade" | "refund" | "adjustment";

export interface LedgerEntry {
  id: string;
  key: string;
  currency: Currency;
  amount: number;
  balanceAfter: number;
  kind: EntryKind;
  source: string;
  ts: number;
}

export interface WalletState {
  balances: Record<Currency, number>;
  ledger: LedgerEntry[];
  /** idempotency key → index in ledger of the entry applied with that key; -1 = applied without a money movement (free grant). */
  keys: Record<string, number>;
}

export const MAX_AMOUNT = 1_000_000_000;

export class InsufficientFunds extends Error {
  constructor(
    public readonly currency: Currency,
    public readonly needed: number,
    public readonly available: number,
  ) {
    super(`Insufficient ${currency}: need ${needed}, have ${available}`);
  }
}

export class InvalidAmount extends Error {}

export function emptyWallet(): WalletState {
  return { balances: { tamcoin: 0, astrolite: 0 }, ledger: [], keys: {} };
}

export interface Movement {
  key: string;
  currency: Currency;
  /** Positive integer; the sign comes from credit/debit. */
  amount: number;
  kind: EntryKind;
  source: string;
  ts: number;
}

export interface MovementResult {
  entry: LedgerEntry;
  /** true when the key had already been applied (nothing changed). */
  duplicate: boolean;
}

function check(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw new InvalidAmount(`Amount must be a positive integer ≤ ${MAX_AMOUNT}, got ${amount}`);
  }
}

function existing(w: WalletState, key: string): LedgerEntry | null {
  const i = w.keys[key];
  if (i === undefined) return null;
  if (i < 0) throw new Error(`Idempotency key "${key}" was already used by a non-monetary grant`);
  return w.ledger[i]!;
}

function append(w: WalletState, m: Movement, signed: number): LedgerEntry {
  const balanceAfter = w.balances[m.currency] + signed;
  const entry: LedgerEntry = {
    id: m.key,
    key: m.key,
    currency: m.currency,
    amount: signed,
    balanceAfter,
    kind: m.kind,
    source: m.source,
    ts: m.ts,
  };
  w.balances[m.currency] = balanceAfter;
  w.keys[m.key] = w.ledger.length;
  w.ledger.push(entry);
  return entry;
}

export function credit(w: WalletState, m: Movement): MovementResult {
  const prev = existing(w, m.key);
  if (prev) return { entry: prev, duplicate: true };
  check(m.amount);
  return { entry: append(w, m, m.amount), duplicate: false };
}

export function debit(w: WalletState, m: Movement): MovementResult {
  const prev = existing(w, m.key);
  if (prev) return { entry: prev, duplicate: true };
  check(m.amount);
  const available = w.balances[m.currency];
  if (available < m.amount) throw new InsufficientFunds(m.currency, m.amount, available);
  return { entry: append(w, m, -m.amount), duplicate: false };
}

export function hasApplied(w: Readonly<WalletState>, key: string): boolean {
  return w.keys[key] !== undefined;
}

/** Verifies that balances equal the sum of the ledger and every balanceAfter is consistent. */
export function auditWallet(w: Readonly<WalletState>): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const running: Record<Currency, number> = { tamcoin: 0, astrolite: 0 };
  w.ledger.forEach((e, i) => {
    running[e.currency] += e.amount;
    if (running[e.currency] !== e.balanceAfter) problems.push(`entry ${i} (${e.key}): balanceAfter mismatch`);
    if (running[e.currency] < 0) problems.push(`entry ${i} (${e.key}): negative balance`);
    if (w.keys[e.key] !== i) problems.push(`entry ${i} (${e.key}): key index mismatch`);
  });
  for (const c of CURRENCIES) {
    if (running[c] !== w.balances[c]) problems.push(`${c}: balance ${w.balances[c]} ≠ ledger sum ${running[c]}`);
  }
  return { ok: problems.length === 0, problems };
}

/** Most-recent-first page of transactions (for the history screen). */
export function history(w: Readonly<WalletState>, currency?: Currency, limit = 50): LedgerEntry[] {
  const out: LedgerEntry[] = [];
  for (let i = w.ledger.length - 1; i >= 0 && out.length < limit; i--) {
    const e = w.ledger[i]!;
    if (!currency || e.currency === currency) out.push(e);
  }
  return out;
}
