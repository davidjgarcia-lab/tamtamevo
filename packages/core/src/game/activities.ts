import { advanceCare, bumpStage, spendForActivity } from "../care/needs";
import { credit } from "../economy/wallet";
import { addAttributeXp } from "../progression/progression";
import { grantActivityReward, MINIGAME_ENTHUSIASM } from "../rewards/rewards";
import { FORM_QUALITY, formQuality } from "../appearance/appearance";
import { arenaStrength, GameRuleError, type GameState } from "./game";
import { FAMILIES } from "../genetics/families";
import { genomeStats } from "../genetics/genome";
import { canEvolve, evolveTamtam, type EvolutionRoll } from "../genetics/evolve";
import { rankOf } from "./arena";
import { recordSeen } from "./house";
import { afterFight, arenaGate, equipFighter, equipRival } from "./arenaPro";
import { payCare } from "./life";
import { addAlbumPiece, medalFor, praiseFor, recordPlayDay, starsFor, type Medal, type Metrics } from "./play";
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
  bumpStage(s.care, "study");
  payCare(s, "study", input.now);
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
export interface MinigameResult {
  coins: number;
  best: number;
  newRecord: boolean;
  duplicate: boolean;
  stars: number;
  medal: Medal;
  praise: string[];
  streak: number;
  streakReward: string | null;
  usedProtection: boolean;
  album: { painting: string; piece: number; completed: boolean } | null;
}

export function completeMinigame(s: GameState, input: { game: MinigameId; runId: string; score: number; now: number; tzOffsetMin: number; metrics?: Metrics }): MinigameResult {
  if (s.phase !== "home" || !s.tamtam) throw new GameRuleError("no_tamtam");
  const key = `reward:minigame:${input.game}:${input.runId}`;
  if (s.economy.wallet.keys[key] !== undefined) {
    return { coins: 0, best: s.records[input.game]?.best ?? 0, newRecord: false, duplicate: true, stars: 0, medal: "none", praise: [], streak: 0, streakReward: null, usedProtection: false, album: null };
  }
  const def = MINIGAMES[input.game];
  const quality = 0.5 + Math.min(1, Math.max(0, input.score / def.scoreForMax));
  const r = grantActivityReward(s.economy.wallet, s.rewardLog, {
    runId: input.runId, tamtamId: s.tamtam.id, source: `minigame:${input.game}`, baseCoins: def.baseCoins, quality,
    levelMultiplier: 1, baseXp: 40, ts: input.now, tzOffsetMin: input.tzOffsetMin, tiers: MINIGAME_ENTHUSIASM,
  });
  advanceCare(s.care, input.now);
  const stars = starsFor(input.score, def.scoreForMax);
  // Playing makes the Tamtam happy and active; better runs, more fun.
  s.care.needs.happiness = Math.min(100, s.care.needs.happiness + 8 + 4 * stars);
  s.care.needs.activity = Math.min(100, s.care.needs.activity + 12 + 4 * stars);
  s.care.needs.energy = Math.max(0, s.care.needs.energy - 6);
  s.care.lastInteractionAt = input.now;
  for (let i = 0; i < 4; i++) s.care.playLog.push(input.now);
  bumpStage(s.care, "games");
  payCare(s, "play", input.now, quality);
  const rec = s.records[input.game] ?? { best: 0, plays: 0 };
  const newRecord = input.score > rec.best;
  s.records[input.game] = { best: Math.max(rec.best, input.score), plays: rec.plays + 1 };
  // A little Agility/Intelligence from play goes to Creativity in this slice (no AGI attribute).
  s.tamtam = addAttributeXp(s.tamtam, input.game === "grid" ? "int" : "cre", Math.round(r.xp / 2)).tamtam;
  const day = recordPlayDay(s, input.game, input.now);
  const album = stars >= 3 ? addAlbumPiece(s, input.now) : null;
  const best = s.records[input.game]!.best;
  return {
    coins: r.coins, best, newRecord, duplicate: false, stars, medal: medalFor(best, def.scoreForMax),
    praise: praiseFor(stars, { ...input.metrics, newRecord: newRecord && rec.plays > 0 }), streak: day.streak, streakReward: day.reward, usedProtection: day.usedProtection, album,
  };
}

/** The player's fighter, from the current form, level, Gym and form quality (Lustre). */
export function playerFighter(s: Readonly<GameState>): Fighter {
  const t = s.tamtam!;
  const q = FORM_QUALITY[formQuality(t)];
  const str = arenaStrength(s).total;
  const lvl = 0.4 + 0.012 * t.level;
  // Evolved forms: each part's family shapes the stats; later stages are stronger.
  const g = t.genome ? genomeStats(t.genome) : { hp: 1, str: 1, def: 1, spd: 1, crit: 1, skill: 1 };
  const stageMul = { baby: 1, child: 1.25, juvenile: 1.55, adult: 1.9 }[t.stage];
  return {
    name: t.name, formId: t.formId, alleleId: s.alleleId,
    hp: Math.round((85 * 0.55 * lvl * 6 * q.statMul + 40) * g.hp * stageMul),
    str: Math.round(str * g.str * stageMul), def: Math.round(65 * 0.55 * lvl * q.statMul * g.def * stageMul), spd: Math.round((75 * 0.55 * lvl * q.statMul + 20) * g.spd * (0.8 + 0.2 * stageMul)),
    crit: Math.round(45 * g.crit), skillPower: 1.4 * q.skillPower * g.skill, skillCooldown: 6 * q.skillCooldown,
    skillName: t.genome ? FAMILIES[t.genome.parts.back].skill : "Lluvia de Ascuas",
    genome: t.genome, stage: t.stage,
  };
}

/** Runs and records a fight. Costs energy (fatigue). */
export function fight(s: GameState, rival: Fighter, d: Difficulty, input: { fightId: string; seed: number; now: number }) {
  if (s.phase !== "home" || !s.tamtam) throw new GameRuleError("no_tamtam");
  if (!s.arena.applied.includes(input.fightId)) {
    const gate = arenaGate(s, input.now);
    if (!gate.ok) throw new GameRuleError("arena_closed");
  }
  const me = equipFighter(s, playerFighter(s));
  const foe = equipRival(rival, rankOf(s.arena.pc).index);
  const result = simulateBattle(me, foe, input.seed);
  const rec = recordFight(s.arena, input.fightId, rival.name, d, result.winner === 0, input.now);
  let progress: ReturnType<typeof afterFight> | null = null;
  if (!rec.duplicate) {
    recordSeen(s, rival.genome, rival.name, false, input.now);
    progress = afterFight(s, input.now, result.winner === 0, { rival, difficulty: d, seed: input.seed, won: result.winner === 0 });
    if (rec.coins > 0) credit(s.economy.wallet, { key: `reward:arena:${input.fightId}`, currency: "tamcoin", amount: rec.coins, kind: "reward", source: "arena", ts: input.now });
    advanceCare(s.care, input.now);
    s.care.needs.energy = Math.max(0, s.care.needs.energy - 8);
    s.care.needs.hunger = Math.max(0, s.care.needs.hunger - 6);
    s.buffs = s.buffs.filter((b) => b !== "str_5_next_fight");
    s.tamtam = addAttributeXp(s.tamtam, "str", 20).tamtam;
    bumpStage(s.care, "fights");
    payCare(s, "fight", input.now);
    if (result.winner === 0) bumpStage(s.care, "wins");
  }
  return { me, foe, result, progress, ...rec };
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

/** Arena record used by Lustre. */
export function arenaRecord(s: Readonly<GameState>) {
  return { fights: s.arena.wins + s.arena.losses, wins: s.arena.wins, rankIndex: rankOf(s.arena.pc).index };
}

/** True when the active Tamtam can evolve now (maturity of the stage reached). */
export function readyToEvolve(s: Readonly<GameState>): boolean {
  return canEvolve(s.tamtam, s.care);
}

/** The Evolution Ritual: runs the evolution algorithm on the active Tamtam. */
export function evolve(s: GameState, now: number, force = false): EvolutionRoll {
  if (!s.tamtam) throw new GameRuleError("no_tamtam");
  advanceCare(s.care, now);
  const { tamtam, roll } = evolveTamtam(s.tamtam, s.care, now, arenaRecord(s), force);
  s.tamtam = tamtam;
  recordSeen(s, tamtam.genome, tamtam.name, true, now);
  return roll;
}
