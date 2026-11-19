import { hash01 } from "./pose";

/**
 * Stateless particle emitters: every particle is a pure function of (emitter, time),
 * so there is no per-frame simulation state, results are reproducible and the
 * system costs nothing while off-screen.
 */

export type ParticleShape = "ember" | "heart" | "z" | "crumb" | "bubble" | "spark";

export interface EmitterDef {
  id: string;
  shape: ParticleShape;
  /** Particles per second. */
  rate: number;
  /** Lifetime in seconds. */
  life: number;
  /** Spawn origin and horizontal jitter (creature-local units). */
  x: number;
  y: number;
  spread: number;
  vx: [number, number];
  vy: [number, number];
  gravity: number;
  size: [number, number];
  /** Sideways wobble amplitude (units) — gives embers and bubbles an organic path. */
  wobble?: number;
  /** Spin in degrees per second. */
  spin?: number;
  color: string;
  /** Draw behind the creature (dust, ground effects). */
  behind?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  rot: number;
  shape: ParticleShape;
  color: string;
}

/**
 * @param from time the emitter was switched on
 * @param until time it was switched off (Infinity while active) — live particles finish their life
 */
export function evalEmitter(e: EmitterDef, t: number, from: number, until: number, seed: number): Particle[] {
  "worklet";
  const out: Particle[] = [];
  if (e.rate <= 0) return out;
  const first = Math.ceil(Math.max(t - e.life, from) * e.rate);
  const last = Math.floor(Math.min(t, until) * e.rate);
  for (let k = first; k <= last; k++) {
    const spawn = k / e.rate;
    const age = t - spawn;
    if (age < 0 || age >= e.life) continue;
    const r1 = hash01(k * 1.37 + seed);
    const r2 = hash01(k * 2.11 + seed + 7);
    const r3 = hash01(k * 3.73 + seed + 13);
    const r4 = hash01(k * 5.17 + seed + 29);
    const vx = e.vx[0] + (e.vx[1] - e.vx[0]) * r2;
    const vy = e.vy[0] + (e.vy[1] - e.vy[0]) * r3;
    const u = age / e.life;
    const wob = (e.wobble ?? 0) * Math.sin(age * 5 + r1 * 6.28);
    const fadeIn = Math.min(1, u * 8);
    const fadeOut = 1 - u * u;
    out.push({
      x: e.x + (r1 - 0.5) * 2 * e.spread + vx * age + wob,
      y: e.y + vy * age + 0.5 * e.gravity * age * age,
      size: (e.size[0] + (e.size[1] - e.size[0]) * r4) * (1 - 0.4 * u),
      alpha: fadeIn * fadeOut,
      rot: (e.spin ?? 0) * age * (r2 > 0.5 ? 1 : -1),
      shape: e.shape,
      color: e.color,
    });
  }
  return out;
}
