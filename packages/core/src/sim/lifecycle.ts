import { advanceCare, bathe, clean, feed, goToSleep, nap, newCareState, pet, play, spendForActivity, wakeUp, DEFAULT_CARE_CONFIG, satisfaction, type CareConfig, type CareState } from "../care/needs";
import { FOODS } from "../game/content";
import { lustre, type LustreTier } from "../appearance/appearance";
import { hatchTamtam } from "../identity/tamtam";
import { addAttributeXp } from "../progression/progression";

/**
 * Life-cycle simulator with a simulated clock (PROGRESSION_TIMELINE.md).
 * A "profile" describes how a player behaves; the simulator steps through simulated
 * days applying the profile's actions at their local hours, and records when the
 * Tamtam becomes eligible for each stage transition.
 */

const HOUR = 3_600_000;

export interface Profile {
  id: string;
  label: string;
  /** Local hours at which the player opens the app (each visit = care actions). */
  visits: number[];
  feedsPerVisit: number;
  petsPerVisit: number;
  playsPerVisit: number;
  gymPerVisit: number;
  batheOncePerDay: boolean;
  putsToSleep: boolean;
  /** Days on which the player does not open the app at all. */
  absentDays?: number[];
}

export const PROFILES: Profile[] = [
  { id: "optimal", label: "Cuidado óptimo + ~45 min de juego/día", visits: [8, 11, 14, 17, 20, 22], feedsPerVisit: 1, petsPerVisit: 3, playsPerVisit: 2, gymPerVisit: 1, batheOncePerDay: true, putsToSleep: true },
  { id: "moderate", label: "Cuidado medio (3 sesiones/día)", visits: [8, 14, 21], feedsPerVisit: 1, petsPerVisit: 2, playsPerVisit: 1, gymPerVisit: 1, batheOncePerDay: true, putsToSleep: true },
  { id: "casual", label: "Casual (2 sesiones/día, poco juego)", visits: [9, 21], feedsPerVisit: 1, petsPerVisit: 1, playsPerVisit: 0, gymPerVisit: 0, batheOncePerDay: false, putsToSleep: true },
  { id: "neglect", label: "Descuido (1 visita/día, solo comida)", visits: [20], feedsPerVisit: 1, petsPerVisit: 0, playsPerVisit: 0, gymPerVisit: 0, batheOncePerDay: false, putsToSleep: false },
  { id: "absence", label: "Medio + 3 días de ausencia (días 2–4)", visits: [8, 14, 21], feedsPerVisit: 1, petsPerVisit: 2, playsPerVisit: 1, gymPerVisit: 1, batheOncePerDay: true, putsToSleep: true, absentDays: [1, 2, 3] },
];

export interface SimResult {
  profile: string;
  /** Hours from hatching until eligible for child / juvenile / adult. */
  hoursToChild: number | null;
  hoursToJuvenile: number | null;
  hoursToAdult: number | null;
  avgSatisfaction: number;
  minNeed: number;
  gymSessions: number;
  /** Lustre tier when the Tamtam becomes eligible for adulthood (no Arena in the simulation). */
  lustreAtAdult: LustreTier | null;
  lustreScoreAtAdult: number | null;
}

export function simulate(profile: Profile, maxDays = 14, cfg: CareConfig = DEFAULT_CARE_CONFIG): SimResult {
  const start = 0;
  const s: CareState = newCareState(start);
  const th = cfg.maturityThresholds;
  const res: SimResult = { profile: profile.id, hoursToChild: null, hoursToJuvenile: null, hoursToAdult: null, avgSatisfaction: 0, minNeed: 100, gymSessions: 0, lustreAtAdult: null, lustreScoreAtAdult: null };
  let tt = hatchTamtam({ id: `sim-${profile.id}`, speciesId: "fire", formId: "fire_baby_chispin", requestedName: "Sim", bornAt: 0, personality: [], affinity: { primary: "fire", secondary: "fire" } });
  let total = 0; // cumulative maturity (simulator view, ignores per-stage reset)
  let satSum = 0;
  let satN = 0;
  const food = FOODS.food_ember_pepper!;
  for (let h = 0; h < maxDays * 24; h++) {
    const now = start + h * HOUR;
    const before = s.maturity;
    advanceCare(s, now, cfg);
    total += s.maturity - before;
    s.maturity = total; // keep a single cumulative counter for the timeline
    const day = Math.floor(h / 24);
    const hour = h % 24;
    const absent = profile.absentDays?.includes(day);
    if (!absent && profile.visits.includes(hour)) {
      if (s.asleep) wakeUp(s, now, cfg);
      for (let i = 0; i < profile.feedsPerVisit; i++) feed(s, food, "fire", now, cfg);
      while (s.poops.length) clean(s, now, cfg);
      for (let i = 0; i < profile.petsPerVisit; i++) pet(s, now, cfg);
      for (let i = 0; i < profile.playsPerVisit; i++) play(s, now, cfg);
      if (s.needs.energy < 40) nap(s, now, cfg); // players nap a tired Tamtam (decision N12)
      for (let i = 0; i < profile.gymPerVisit; i++) if (spendForActivity(s, now, 5, 6, 4, cfg)) {
        res.gymSessions++;
        tt = addAttributeXp(tt, "str", 60).tamtam;
      }
      if (profile.batheOncePerDay && hour === profile.visits[0]) bathe(s, now, cfg);
      if (profile.putsToSleep && hour === profile.visits[profile.visits.length - 1]) goToSleep(s, now, cfg);
    }
    total = s.maturity;
    const sat = satisfaction(s.needs);
    satSum += sat;
    satN++;
    res.minNeed = Math.min(res.minNeed, ...Object.values(s.needs));
    if (res.hoursToChild === null && total >= th.baby) res.hoursToChild = h;
    if (res.hoursToJuvenile === null && total >= th.child) res.hoursToJuvenile = h;
    if (res.hoursToAdult === null && total >= th.juvenile) {
      res.hoursToAdult = h;
      const l = lustre(s, tt);
      res.lustreAtAdult = l.tier;
      res.lustreScoreAtAdult = Math.round(l.score);
    }
  }
  res.avgSatisfaction = Math.round(satSum / satN);
  res.minNeed = Math.round(res.minNeed);
  return res;
}
