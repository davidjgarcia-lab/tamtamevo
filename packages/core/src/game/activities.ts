import { advanceCare, spendForActivity } from "../care/needs";
import { credit } from "../economy/wallet";
import { addAttributeXp } from "../progression/progression";
import { grantActivityReward, MINIGAME_ENTHUSIASM } from "../rewards/rewards";
import { FORM_QUALITY, formQuality } from "../appearance/appearance";
import { arenaStrength, GameRuleError, type GameState } from "./game";
import { recordFight, simulateBattle, type Difficulty, type Fighter } from "./arena";

/** Study (Academy · Cocina): memory session at the desk → Intelligence. */
export const STUDY = { energyCost: 6, hungerCost: 3, baseCoins: 30, baseXp: 50 };

export function completeStudySession(s: GameState, input: { runId: string; quality: number; now: number; tzOffsetMin: number }) {
  if (s.phase !== "home" || !s.tamtam) throw new GameRuleError("no_tamtam");
  const key = `reward:activity:academy:${input.runId}`;
  if (s.economy.wallet.keys[key] !== undefined) return { ok: true, coins: 0, xp: 0, levels: 0, duplicate: true };
  if (!spendForActivity(s.care, input.now, STUDY.energyCost, STUDY.hungerCost, 4)) return { ok: false, coins: 0, xp: 0, levels: 0, duplicate: false };
  const r = grantActivityReward(s.economy.wallet, s.rewardLog, {
    runId: input.runId, tamtamId: s.tamtam.id, source: "activity:academy", baseCoins: STUDY.baseCoins, quality: input.quality,
    levelMultiplier: 1, baseXp: STUDY.baseXp, ts: input.now, tzOffsetMin: input.tzOffsetMin,
  });
  const up = addAttributeXp(s.tamtam, "int", r.xp);
  s.tamtam = up.tamtam;
  s.study.sessions += 1;
  return { ok: true, coins: r.coins, xp: r.xp, levels: up.gained, duplicate: false };
}

export type MinigameId = "maze" | "bricks" | "grid" | "trail";
export const MINIGAMES: Record<MinigameId, { baseCoins: number; scoreForMax: number }> = {
  maze: { baseCoins: 30, scoreForMax: 900 },
  bricks: { baseCoins: 30, scoreForMax: 1500 },
  grid: { baseCoins: 35, scoreForMax: 1000 },
  trail: { baseCoins: 30, scoreForMax: 400 },
};

/** Ends a minigame run: coins (with daily diminishing returns), record, fun for the Tamtam. */
export function completeMinigame(s: GameState, input: { game: MinigameId; runId: string; score: number; now: number; tzOffsetMin: number }) {
  if (s.phase !== "home" || !s.tamtam) throw new GameRuleError("no_tamtam");
  const key = `reward:minigame:${input.game}:${input.runId}`;
  if (s.economy.wallet.keys[key] !== undefined) return { coins: 0, best: s.records[input.game]?.best ?? 0, newRecord: false, duplicate: true };
  const def = MINIGAMES[input.game];
  const quality = 0.5 + Math.min(1, Math.max(0, input.score / def.scoreForMax));
  const r = grantActivityReward(s.economy.wallet, s.rewardLog, {
    runId: input.runId, tamtamId: s.tamtam.id, source: `minigame:${input.game}`, baseCoins: def.baseCoins, quality,
    levelMultiplier: 1, baseXp: 40, ts: input.now, tzOffsetMin: input.tzOffsetMin, tiers: MINIGAME_ENTHUSIASM,
  });
  advanceCare(s.care, input.now);
  s.care.needs.happiness = Math.min(100, s.care.needs.happiness + 15);
  s.care.needs.activity = Math.min(100, s.care.needs.activity + 20);
  s.care.needs.energy = Math.max(0, s.care.needs.energy - 6);
  s.care.lastInteractionAt = input.now;
  for (let i = 0; i < 4; i++) s.care.playLog.push(input.now);
  const rec = s.records[input.game] ?? { best: 0, plays: 0 };
  const newRecord = input.score > rec.best;
  s.records[input.game] = { best: Math.max(rec.best, input.score), plays: rec.plays + 1 };
  // A little Agility/Intelligence from play goes to Creativity in this slice (no AGI attribute).
  s.tamtam = addAttributeXp(s.tamtam, input.game === "grid" ? "int" : "cre", Math.round(r.xp / 2)).tamtam;
  return { coins: r.coins, best: s.records[input.game]!.best, newRecord, duplicate: false };
}

/** The player's fighter, from the current form, level, Gym and form quality (Lustre). */
export function playerFighter(s: Readonly<GameState>): Fighter {
  const t = s.tamtam!;
  const q = FORM_QUALITY[formQuality(t)];
  const str = arenaStrength(s).total;
  const lvl = 0.4 + 0.012 * t.level;
  return {
    name: t.name, formId: t.formId, alleleId: s.alleleId,
    hp: Math.round(85 * 0.55 * lvl * 6 * q.statMul + 40),
    str, def: Math.round(65 * 0.55 * lvl * q.statMul), spd: Math.round(75 * 0.55 * lvl * q.statMul + 20),
    crit: 45, skillPower: 1.4 * q.skillPower, skillCooldown: 6 * q.skillCooldown,
  };
}

/** Runs and records a fight. Costs energy (fatigue). */
export function fight(s: GameState, rival: Fighter, d: Difficulty, input: { fightId: string; seed: number; now: number }) {
  if (s.phase !== "home" || !s.tamtam) throw new GameRuleError("no_tamtam");
  const me = playerFighter(s);
  const result = simulateBattle(me, rival, input.seed);
  const rec = recordFight(s.arena, input.fightId, rival.name, d, result.winner === 0, input.now);
  if (!rec.duplicate) {
    if (rec.coins > 0) credit(s.economy.wallet, { key: `reward:arena:${input.fightId}`, currency: "tamcoin", amount: rec.coins, kind: "reward", source: "arena", ts: input.now });
    advanceCare(s.care, input.now);
    s.care.needs.energy = Math.max(0, s.care.needs.energy - 8);
    s.care.needs.hunger = Math.max(0, s.care.needs.hunger - 6);
    s.buffs = s.buffs.filter((b) => b !== "str_5_next_fight");
    s.tamtam = addAttributeXp(s.tamtam, "str", 20).tamtam;
  }
  return { me, result, ...rec };
}

/** Granja: swap the active Tamtam with one resting on the farm. Needs pause while on the farm. */
export function swapWithFarm(s: GameState, index: number, now: number): void {
  const entry = s.farm[index];
  if (!entry || !s.tamtam) throw new GameRuleError("no_farm_entry");
  advanceCare(s.care, now);
  const leaving = { tamtam: s.tamtam, care: s.care, alleleId: s.alleleId };
  s.tamtam = entry.tamtam;
  s.care = { ...entry.care, updatedAt: now, lastInteractionAt: now };
  s.alleleId = entry.alleleId;
  s.farm[index] = leaving;
}
