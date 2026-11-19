import { CHANNELS, type ClipDef, type Ease, type FaceKey, type PaintRef, type RigDef } from "./types";

/**
 * Compiled forms are flat, index-based structures that are cheap to evaluate every
 * frame (and safe to copy into Reanimated worklets: only plain arrays/objects).
 */

export const EASE_CODE: Record<Ease, number> = { linear: 0, in: 1, out: 2, inOut: 3, step: 4 };

export interface CompiledTrack {
  t: number[];
  v: number[];
  e: number[];
}

export interface CompiledPart {
  id: string;
  bone: number;
  d: string;
  fill: PaintRef | null;
  stroke: PaintRef | null;
  strokeWidth: number;
  faceSlot: "eyes" | "mouth" | null;
  faceStates: string[];
  blur: number;
}

export interface CompiledSecondary {
  bone: number;
  driver: number;
  lag: number;
  gain: number;
  velocityGain: number;
  swayAmp: number;
  swayFreq: number;
  flickerAmp: number;
  flickerFreq: number;
}

export interface CompiledRig {
  id: string;
  boneIds: string[];
  parent: number[];
  /** rest[b*5 + c] for channels x, y, rot, sx, sy */
  rest: number[];
  parts: CompiledPart[];
  secondary: CompiledSecondary[];
  breathBone: number;
  eyeBones: number[];
}

export interface CompiledClip {
  id: string;
  duration: number;
  loop: boolean;
  /** tracks[b*5 + c] — null when the channel is not animated */
  tracks: (CompiledTrack | null)[];
  eyes: FaceKey[];
  mouth: FaceKey[];
  breath: number;
  breathRate: number;
  blink: boolean;
  flicker: number;
}

export class RigError extends Error {}

export function compileRig(def: RigDef): CompiledRig {
  const index = new Map<string, number>();
  const parent: number[] = [];
  const rest: number[] = [];
  def.bones.forEach((b, i) => {
    if (index.has(b.id)) throw new RigError(`Duplicate bone "${b.id}" in rig "${def.id}"`);
    let p = -1;
    if (b.parent !== null) {
      const pi = index.get(b.parent);
      if (pi === undefined) {
        throw new RigError(`Bone "${b.id}" references parent "${b.parent}" before it is declared`);
      }
      p = pi;
    } else if (i !== 0) {
      throw new RigError(`Only the first bone may be a root ("${b.id}")`);
    }
    index.set(b.id, i);
    parent.push(p);
    rest.push(b.x, b.y, b.rot ?? 0, b.sx ?? 1, b.sy ?? 1);
  });

  const boneOf = (id: string, ctx: string): number => {
    const i = index.get(id);
    if (i === undefined) throw new RigError(`${ctx} references unknown bone "${id}"`);
    return i;
  };

  const parts: CompiledPart[] = [...def.parts]
    .map((p, order) => ({ p, order }))
    .sort((a, b) => a.p.z - b.p.z || a.order - b.order)
    .map(({ p }) => ({
      id: p.id,
      bone: boneOf(p.bone, `Part "${p.id}"`),
      d: p.d,
      fill: p.fill ?? null,
      stroke: p.stroke ?? null,
      strokeWidth: p.strokeWidth ?? 0,
      faceSlot: p.face?.slot ?? null,
      faceStates: p.face?.states ?? [],
      blur: p.blur ?? 0,
    }));

  const secondary = (def.secondary ?? []).map((s) => ({
    bone: boneOf(s.bone, "Secondary"),
    driver: boneOf(s.driver, "Secondary"),
    lag: s.lag,
    gain: s.gain,
    velocityGain: s.velocityGain ?? 0,
    swayAmp: s.sway?.amp ?? 0,
    swayFreq: s.sway?.freq ?? 0,
    flickerAmp: s.flicker?.amp ?? 0,
    flickerFreq: s.flicker?.freq ?? 0,
  }));

  return {
    id: def.id,
    boneIds: def.bones.map((b) => b.id),
    parent,
    rest,
    parts,
    secondary,
    breathBone: def.breathBone ? boneOf(def.breathBone, "breathBone") : -1,
    eyeBones: (def.eyeBones ?? []).map((b) => boneOf(b, "eyeBones")),
  };
}

export function compileClip(rig: CompiledRig, def: ClipDef): CompiledClip {
  if (!(def.duration > 0)) throw new RigError(`Clip "${def.id}" must have a positive duration`);
  const tracks: (CompiledTrack | null)[] = new Array(rig.boneIds.length * 5).fill(null);
  for (const [boneId, channels] of Object.entries(def.tracks)) {
    const b = rig.boneIds.indexOf(boneId);
    if (b < 0) throw new RigError(`Clip "${def.id}" animates unknown bone "${boneId}"`);
    CHANNELS.forEach((ch, c) => {
      const keys = channels[ch];
      if (!keys || keys.length === 0) return;
      for (let i = 1; i < keys.length; i++) {
        if (keys[i]!.t < keys[i - 1]!.t) {
          throw new RigError(`Clip "${def.id}" bone "${boneId}.${ch}" keys are not sorted`);
        }
      }
      tracks[b * 5 + c] = {
        t: keys.map((k) => k.t),
        v: keys.map((k) => k.v),
        e: keys.map((k) => EASE_CODE[k.e ?? "inOut"]),
      };
    });
  }
  return {
    id: def.id,
    duration: def.duration,
    loop: def.loop,
    tracks,
    eyes: def.face?.eyes ?? [],
    mouth: def.face?.mouth ?? [],
    breath: def.breath ?? 1,
    breathRate: def.breathRate ?? 0.45,
    blink: def.blink ?? true,
    flicker: def.flicker ?? 1,
  };
}
