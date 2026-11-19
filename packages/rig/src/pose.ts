import type { CompiledClip, CompiledRig, CompiledTrack } from "./compile";

/**
 * Per-frame evaluation. Every function here is a Reanimated worklet (the directive
 * is a plain string outside Reanimated, so the same code runs in tests and on servers).
 *
 * Pose layout: pose[b*5 + c] with channels x, y, rot(deg), sx, sy — absolute local values.
 * World layout: world[b*6 + k] = [a, b, c, d, tx, ty] where p' = (a·x + c·y + tx, b·x + d·y + ty).
 */

export function ease(code: number, u: number): number {
  "worklet";
  switch (code) {
    case 0:
      return u;
    case 1:
      return u * u * u;
    case 2: {
      const v = 1 - u;
      return 1 - v * v * v;
    }
    case 4:
      return 0;
    default:
      return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  }
}

export function sampleTrack(tr: CompiledTrack, t: number): number {
  "worklet";
  const n = tr.t.length;
  if (t <= tr.t[0]!) return tr.v[0]!;
  if (t >= tr.t[n - 1]!) return tr.v[n - 1]!;
  let i = 0;
  while (i < n - 2 && t >= tr.t[i + 1]!) i++;
  const t0 = tr.t[i]!;
  const t1 = tr.t[i + 1]!;
  const u = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
  const v0 = tr.v[i]!;
  return v0 + (tr.v[i + 1]! - v0) * ease(tr.e[i]!, u);
}

/** Maps an absolute playback time to clip-local time (wrapping or clamping). */
export function clipTime(clip: CompiledClip, t: number): number {
  "worklet";
  if (clip.loop) {
    const m = t % clip.duration;
    return m < 0 ? m + clip.duration : m;
  }
  return Math.min(Math.max(t, 0), clip.duration);
}

function channelOffset(clip: CompiledClip, idx: number, ct: number, neutral: number): number {
  "worklet";
  const tr = clip.tracks[idx];
  return tr ? sampleTrack(tr, ct) : neutral;
}

export function samplePose(rig: CompiledRig, clip: CompiledClip, ct: number): number[] {
  "worklet";
  const n = rig.parent.length;
  const out = new Array<number>(n * 5);
  for (let b = 0; b < n; b++) {
    const o = b * 5;
    out[o] = rig.rest[o]! + channelOffset(clip, o, ct, 0);
    out[o + 1] = rig.rest[o + 1]! + channelOffset(clip, o + 1, ct, 0);
    out[o + 2] = rig.rest[o + 2]! + channelOffset(clip, o + 2, ct, 0);
    out[o + 3] = rig.rest[o + 3]! * channelOffset(clip, o + 3, ct, 1);
    out[o + 4] = rig.rest[o + 4]! * channelOffset(clip, o + 4, ct, 1);
  }
  return out;
}

/** Linear blend of two poses (w = 0 → a, w = 1 → b). Used for clip cross-fades. */
export function blendPoses(a: number[], b: number[], w: number): number[] {
  "worklet";
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i]! + (b[i]! - a[i]!) * w;
  return out;
}

export function hash01(n: number): number {
  "worklet";
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Deterministic blink: returns eye openness in [0, 1]. Blinks every 2.6–5 s,
 * with an occasional double blink. Pure function of time and a per-creature seed.
 */
export function blinkOpenness(time: number, seed: number): number {
  "worklet";
  const period = 3.8;
  const cycle = Math.floor(time / period);
  const offset = hash01(cycle + seed) * 1.2;
  const local = time - cycle * period - offset;
  const dur = 0.16;
  const closeAt = (x: number) => (x >= 0 && x < dur ? Math.abs(Math.cos((x / dur) * Math.PI)) : 1);
  let open = closeAt(local);
  if (hash01(cycle * 3.1 + seed) > 0.75) open = Math.min(open, closeAt(local - 0.28));
  return open;
}

export interface ProceduralInput {
  /** Absolute time in seconds (drives breathing, blinking, sway). */
  time: number;
  /** Clip-local time of the active clip (drives follow-through lag). */
  clipT: number;
  /** Horizontal velocity of the creature in units/s (drives drag on tails/flames). */
  vx: number;
  seed: number;
  /** Extra scaling of flicker/flames (e.g. weaker when asleep). */
  flicker: number;
  breath: number;
  breathRate: number;
  blink: boolean;
}

/** Adds the living layers on top of the keyed pose: breathing, blinking, follow-through. */
export function applyProcedural(
  rig: CompiledRig,
  clip: CompiledClip,
  pose: number[],
  p: ProceduralInput,
): number[] {
  "worklet";
  const out = pose.slice();
  if (rig.breathBone >= 0 && p.breath > 0) {
    const w = Math.sin(p.time * Math.PI * 2 * p.breathRate);
    const o = rig.breathBone * 5;
    out[o + 4] = out[o + 4]! * (1 + 0.028 * p.breath * w);
    out[o + 3] = out[o + 3]! * (1 - 0.012 * p.breath * w);
  }
  if (p.blink) {
    const open = blinkOpenness(p.time, p.seed);
    for (let i = 0; i < rig.eyeBones.length; i++) {
      const o = rig.eyeBones[i]! * 5;
      out[o + 4] = out[o + 4]! * Math.max(0.08, open);
    }
  }
  for (let i = 0; i < rig.secondary.length; i++) {
    const s = rig.secondary[i]!;
    const dIdx = s.driver * 5 + 2;
    const tr = clip.tracks[dIdx];
    let lagDelta = 0;
    if (tr) {
      const prevT = clip.loop ? clipTime(clip, p.clipT - s.lag) : Math.max(0, p.clipT - s.lag);
      lagDelta = sampleTrack(tr, p.clipT) - sampleTrack(tr, prevT);
    }
    const o = s.bone * 5;
    const sway = s.swayAmp * Math.sin(p.time * Math.PI * 2 * s.swayFreq + s.bone);
    out[o + 2] = out[o + 2]! - s.gain * lagDelta - s.velocityGain * p.vx + sway;
    if (s.flickerAmp > 0) {
      const f = p.time * Math.PI * 2 * s.flickerFreq;
      const n = Math.sin(f) * 0.6 + Math.sin(f * 2.37 + 1.3) * 0.3 + Math.sin(f * 5.1 + 0.7) * 0.1;
      out[o + 4] = out[o + 4]! * (1 + s.flickerAmp * n) * (0.55 + 0.45 * p.flicker);
      out[o + 3] = out[o + 3]! * (1 - s.flickerAmp * 0.4 * n) * (0.7 + 0.3 * p.flicker);
    }
  }
  return out;
}

/** Forward kinematics: local pose → world affine matrices. Bones are parent-ordered. */
export function worldMatrices(rig: CompiledRig, pose: number[]): number[] {
  "worklet";
  const n = rig.parent.length;
  const w = new Array<number>(n * 6);
  for (let b = 0; b < n; b++) {
    const o = b * 5;
    const r = (pose[o + 2]! * Math.PI) / 180;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    const sx = pose[o + 3]!;
    const sy = pose[o + 4]!;
    // local = T · R · S
    const la = cos * sx;
    const lb = sin * sx;
    const lc = -sin * sy;
    const ld = cos * sy;
    const ltx = pose[o]!;
    const lty = pose[o + 1]!;
    const p = rig.parent[b]!;
    const k = b * 6;
    if (p < 0) {
      w[k] = la;
      w[k + 1] = lb;
      w[k + 2] = lc;
      w[k + 3] = ld;
      w[k + 4] = ltx;
      w[k + 5] = lty;
    } else {
      const q = p * 6;
      const pa = w[q]!;
      const pb = w[q + 1]!;
      const pc = w[q + 2]!;
      const pd = w[q + 3]!;
      w[k] = pa * la + pc * lb;
      w[k + 1] = pb * la + pd * lb;
      w[k + 2] = pa * lc + pc * ld;
      w[k + 3] = pb * lc + pd * ld;
      w[k + 4] = pa * ltx + pc * lty + w[q + 4]!;
      w[k + 5] = pb * ltx + pd * lty + w[q + 5]!;
    }
  }
  return w;
}

/** Discrete face state of a clip at clip-local time. */
export function sampleFace(keys: { t: number; v: string }[], ct: number, fallback: string): string {
  "worklet";
  let v = fallback;
  for (let i = 0; i < keys.length; i++) {
    if (ct >= keys[i]!.t) v = keys[i]!.v;
    else break;
  }
  return v;
}

/** Applies a world matrix to a point (used by tests and by particle anchors). */
export function transformPoint(world: number[], bone: number, x: number, y: number): [number, number] {
  "worklet";
  const k = bone * 6;
  return [
    world[k]! * x + world[k + 2]! * y + world[k + 4]!,
    world[k + 1]! * x + world[k + 3]! * y + world[k + 5]!,
  ];
}
