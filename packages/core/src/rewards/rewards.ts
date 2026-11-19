import { credit, hasApplied, type LedgerEntry, type WalletState } from "../economy/wallet";

/**
 * Rewards with daily diminishing returns ("Entusiasmo", ECONOMY_SYSTEM §3.1)
 * and idempotency keys (a replayed reward is never paid twice).
 */

export interface RewardLog {
  /** `${dayKey}|${tamtamId}|${source}` → sessions counted that day */
  sessions: Record<string, number>;
}

export function emptyRewardLog(): RewardLog {
  return { sessions: {} };
}

/** Local "game day" that resets at 04:00 local time. `tzOffsetMin` = minutes east of UTC. */
export function dayKey(ts: number, tzOffsetMin: number, resetHour = 4): string {
  const local = new Date(ts + tzOffsetMin * 60_000 - resetHour * 3_600_000);
  return local.toISOString().slice(0, 10);
}

export interface EnthusiasmTier {
  upTo: number;
  coins: number;
  xp: number;
}

export const ACTIVITY_ENTHUSIASM: EnthusiasmTier[] = [
  { upTo: 4, coins: 1, xp: 1 },
  { upTo: 8, coins: 0.5, xp: 0.75 },
  { upTo: Infinity, coins: 0.1, xp: 0.5 },
];

export const MINIGAME_ENTHUSIASM: EnthusiasmTier[] = [
  { upTo: 5, coins: 1, xp: 1 },
  { upTo: 10, coins: 0.5, xp: 0.5 },
  { upTo: Infinity, coins: 0.2, xp: 0.2 },
];

/** Multipliers for the n-th session of the day (1-based). */
export function enthusiasm(n: number, tiers: EnthusiasmTier[]): { coins: number; xp: number } {
  const t = tiers.find((x) => n <= x.upTo) ?? tiers[tiers.length - 1]!;
  return { coins: t.coins, xp: t.xp };
}

export interface ActivityRewardInput {
  /** Unique id of the finished session/run — the idempotency anchor. */
  runId: string;
  tamtamId: string;
  source: string;
  baseCoins: number;
  /** Interaction quality in [0.5, 1.5]; clamped. */
  quality: number;
  /** Functional object level multiplier (1, 1.25, 1.5). */
  levelMultiplier: number;
  baseXp: number;
  ts: number;
  tzOffsetMin: number;
  tiers?: EnthusiasmTier[];
}

export interface ActivityRewardResult {
  coins: number;
  xp: number;
  session: number;
  entry: LedgerEntry | null;
  duplicate: boolean;
}

export function grantActivityReward(wallet: WalletState, log: RewardLog, r: ActivityRewardInput): ActivityRewardResult {
  const key = `reward:${r.source}:${r.runId}`;
  if (hasApplied(wallet, key)) {
    const i = wallet.keys[key]!;
    const entry = i >= 0 ? wallet.ledger[i]! : null;
    return { coins: entry?.amount ?? 0, xp: 0, session: 0, entry, duplicate: true };
  }
  const logKey = `${dayKey(r.ts, r.tzOffsetMin)}|${r.tamtamId}|${r.source}`;
  const session = (log.sessions[logKey] ?? 0) + 1;
  const m = enthusiasm(session, r.tiers ?? ACTIVITY_ENTHUSIASM);
  const q = Math.min(1.5, Math.max(0.5, r.quality));
  const raw = r.baseCoins * q * r.levelMultiplier * m.coins;
  const coins = Math.min(Math.round(raw), 2 * r.baseCoins * r.levelMultiplier);
  const xp = Math.round(r.baseXp * q * m.xp);
  log.sessions[logKey] = session;
  let entry: LedgerEntry | null = null;
  if (coins > 0) {
    entry = credit(wallet, { key, currency: "tamcoin", amount: coins, kind: "reward", source: r.source, ts: r.ts }).entry;
  } else {
    wallet.keys[key] = -1;
  }
  return { coins, xp, session, entry, duplicate: false };
}
