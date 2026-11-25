import type { FamilyId } from "./families";
import type { StarterMotion } from "./starters";

/**
 * Evolution physics: how each family moves at each stage (art sheet "Criaturas principales", 2026-11-25:
 * voladora, gelatinosa, reptante, flotante, acuática). Read by the web renderer and exported to Unity.
 *  walk     – four legs on the ground          heavy  – slow, deep breath, ground shakes a little
 *  dash     – quick, nervous, sudden stops      fly    – wings: hovers high with wing-beat bob
 *  float    – hovers low, drifts side to side   slither – serpent body: travelling wave along the body
 *  bounce   – jelly: squash & stretch hops
 */
export type Gait = "walk" | "heavy" | "dash" | "fly" | "float" | "slither" | "bounce";
export type ArtStage = "baby" | "initial" | "intermediate" | "final";

export const GAITS: Record<FamilyId, Record<ArtStage, Gait>> = {
  fire: { baby: "walk", initial: "walk", intermediate: "walk", final: "fly" },
  water: { baby: "walk", initial: "walk", intermediate: "slither", final: "slither" },
  plant: { baby: "walk", initial: "walk", intermediate: "walk", final: "walk" },
  electric: { baby: "dash", initial: "dash", intermediate: "dash", final: "dash" },
  rock: { baby: "heavy", initial: "heavy", intermediate: "heavy", final: "heavy" },
  shadow: { baby: "float", initial: "float", intermediate: "walk", final: "fly" },
  light: { baby: "fly", initial: "fly", intermediate: "fly", final: "fly" },
  crystal: { baby: "walk", initial: "walk", intermediate: "walk", final: "heavy" },
  plasma: { baby: "bounce", initial: "bounce", intermediate: "float", final: "float" },
  mystic: { baby: "walk", initial: "walk", intermediate: "slither", final: "slither" },
};

/** Base motion of each gait (personality of a starter is layered on top). */
const GAIT_MOTION: Record<Gait, Partial<StarterMotion> & { lift: number; wave: number; flap: number; shake: number; speed: number }> = {
  walk: { bounce: 0.35, sway: 0.1, tail: 0.5, tilt: 0.4, breath: 0.5, tempo: 1, float: false, lift: 0, wave: 0, flap: 0, shake: 0, speed: 1 },
  heavy: { bounce: 0.08, sway: 0.03, tail: 0.2, tilt: 0.2, breath: 0.9, tempo: 0.65, float: false, lift: 0, wave: 0, flap: 0, shake: 0.6, speed: 0.6 },
  dash: { bounce: 0.6, sway: 0.05, jitter: 0.8, tail: 0.9, tilt: 0.5, tempo: 1.4, float: false, lift: 0, wave: 0, flap: 0, shake: 0, speed: 1.6 },
  fly: { bounce: 0.15, sway: 0.4, tail: 0.5, tilt: 0.4, breath: 0.3, tempo: 1.05, float: true, lift: 16, wave: 0, flap: 0.8, shake: 0, speed: 1.2 },
  float: { bounce: 0.1, sway: 0.7, tail: 0.6, tilt: 0.3, breath: 0.4, tempo: 0.85, float: true, lift: 9, wave: 0, flap: 0, shake: 0, speed: 0.8 },
  slither: { bounce: 0.05, sway: 0.4, tail: 0.3, tilt: 0.5, breath: 0.4, tempo: 0.9, float: true, lift: 5, wave: 0.8, flap: 0, shake: 0, speed: 0.9 },
  bounce: { bounce: 0.9, sway: 0.2, tail: 0.3, tilt: 0.2, breath: 0.9, tempo: 0.95, float: false, lift: 0, wave: 0, flap: 0, shake: 0, speed: 0.85 },
};

export type Motion = StarterMotion & { gait: Gait; lift: number; wave: number; flap: number; shake: number; speed: number };

/** Motion of a creature: the gait of its family/stage, with the starter's personality on top (babies). */
export function motionFor(family: FamilyId, stage: ArtStage, starter?: StarterMotion): Motion {
  const gait = starter?.gait ?? GAITS[family][stage];
  const g = GAIT_MOTION[gait];
  const base: Motion = { bounce: 0.4, sway: 0.1, jitter: 0, tail: 0.5, tilt: 0.4, breath: 0.5, tempo: 1, float: false, ...g, gait } as Motion;
  if (!starter) return base;
  // Personality blends 60 % with the gait (the starter's own manner shows through).
  const mix = (a: number, b: number) => a * 0.4 + b * 0.6;
  return {
    ...base,
    bounce: mix(base.bounce, starter.bounce), sway: mix(base.sway, starter.sway), jitter: mix(base.jitter, starter.jitter),
    tail: mix(base.tail, starter.tail), tilt: mix(base.tilt, starter.tilt), breath: mix(base.breath, starter.breath),
    tempo: mix(base.tempo, starter.tempo), float: starter.float || base.float, lift: starter.float ? Math.max(base.lift, 9) : base.lift,
  };
}

/** Tamtam stage → art stage. */
export const artStage = (stage: string): ArtStage => (stage === "baby" ? "baby" : stage === "child" ? "initial" : stage === "juvenile" ? "intermediate" : "final");
