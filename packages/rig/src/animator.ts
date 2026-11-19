import type { CompiledClip, CompiledRig } from "./compile";
import { applyProcedural, blendPoses, clipTime, sampleFace, samplePose, worldMatrices } from "./pose";

/** Playback state that lives in a shared value on the UI thread. */
export interface PlaybackState {
  clip: number;
  /** Absolute time (s) at which `clip` started. */
  start: number;
  /** Clip that was playing before (cross-fade source), or -1. */
  prevClip: number;
  prevStart: number;
}

export interface FrameInput {
  time: number;
  vx: number;
  seed: number;
  /** Cross-fade duration in seconds. */
  fade?: number;
}

export interface Frame {
  world: number[];
  eyes: string;
  mouth: string;
  brows: string;
  prop: string;
  clipT: number;
}

function smooth(u: number): number {
  "worklet";
  const x = Math.min(Math.max(u, 0), 1);
  return x * x * (3 - 2 * x);
}

/**
 * Evaluates one frame: samples the active clip, cross-fades from the previous one,
 * applies the procedural layers and resolves world matrices.
 */
export function evaluateFrame(
  rig: CompiledRig,
  clips: CompiledClip[],
  state: PlaybackState,
  input: FrameInput,
): Frame {
  "worklet";
  const clip = clips[state.clip]!;
  const ct = clipTime(clip, input.time - state.start);
  let pose = samplePose(rig, clip, ct);

  const fade = input.fade ?? 0.25;
  const w = fade > 0 ? smooth((input.time - state.start) / fade) : 1;
  if (state.prevClip >= 0 && w < 1) {
    const prev = clips[state.prevClip]!;
    const pt = clipTime(prev, input.time - state.prevStart);
    pose = blendPoses(samplePose(rig, prev, pt), pose, w);
  }

  pose = applyProcedural(rig, clip, pose, {
    time: input.time,
    clipT: ct,
    vx: input.vx,
    seed: input.seed,
    flicker: clip.flicker,
    breath: clip.breath,
    breathRate: clip.breathRate,
    blink: clip.blink && sampleFace(clip.eyes, ct, "open") === "open",
  });

  return {
    world: worldMatrices(rig, pose),
    eyes: sampleFace(clip.eyes, ct, "open"),
    mouth: sampleFace(clip.mouth, ct, "smile"),
    brows: sampleFace(clip.brows, ct, "neutral"),
    prop: sampleFace(clip.prop, ct, "none"),
    clipT: ct,
  };
}

/** Returns the next playback state when switching clips (no-op if already playing). */
export function switchClip(state: PlaybackState, clip: number, now: number): PlaybackState {
  "worklet";
  if (state.clip === clip) return state;
  return { clip, start: now, prevClip: state.clip, prevStart: state.start };
}
