import type { SkCanvas } from "@shopify/react-native-skia";
import { chispinClips, chispinEmitters, chispinRig, fireColorAlleles, type ChispinClipId } from "@tamtam/art";
import { compileClip, compileRig, derivePalette, evaluateFrame, switchClip, type EmitterDef, type Frame, type PlaybackState } from "@tamtam/rig";
import { useCallback, useMemo } from "react";
import { useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";
import { drawCreature, drawParticles, type ActiveEmitters, type Placement } from "./draw";
import { buildResources, DEFAULT_LOOK, type CreatureResources, type Look } from "./resources";

export const rig = compileRig(chispinRig);
export const clips = chispinClips.map((c) => compileClip(rig, c));
export const clipIndex = (id: ChispinClipId) => clips.findIndex((c) => c.id === id);
const allEmitters: EmitterDef[] = Object.values(chispinEmitters).flat();
export const SEED = 7;
export const BONE = { body: rig.boneIds.indexOf("body"), head: rig.boneIds.indexOf("head"), jaw: rig.boneIds.indexOf("jaw") };

export interface CreatureHandle {
  res: CreatureResources;
  clock: SharedValue<number>;
  playback: SharedValue<PlaybackState>;
  emitters: SharedValue<ActiveEmitters[]>;
  play: (id: ChispinClipId) => void;
}

/** Shared animation clock + playback state for one Tamtam on screen. */
export function useCreature(alleleId: string, look: Look = DEFAULT_LOOK): CreatureHandle {
  const palette = useMemo(() => derivePalette((fireColorAlleles.find((a) => a.id === alleleId) ?? fireColorAlleles[0]!).genes), [alleleId]);
  const res = useMemo(() => buildResources(rig, palette, allEmitters, look), [palette, look]);
  const particleMul = look.particles;
  const clock = useSharedValue(0);
  const playback = useSharedValue<PlaybackState>({ clip: clipIndex("idle"), start: 0, prevClip: -1, prevStart: 0 });
  const emitters = useSharedValue<ActiveEmitters[]>([{ defs: chispinEmitters.idle, from: 0, until: Infinity }]);

  useFrameCallback((info) => {
    clock.value = info.timestamp / 1000;
  });

  const play = useCallback(
    (id: ChispinClipId) => {
      const now = clock.value;
      const next = switchClip(playback.value, clipIndex(id), now);
      if (next === playback.value) return;
      // Particle density follows the Lustre tier (dull Tamtams barely sparkle).
      const scaled = (defs: EmitterDef[]) => defs.map((d) => ({ ...d, rate: d.rate * particleMul }));
      const prevDefs = scaled(chispinEmitters[clips[playback.value.clip]!.id as ChispinClipId]);
      emitters.value = [
        { defs: prevDefs, from: playback.value.start, until: now },
        { defs: scaled(chispinEmitters[id]), from: now, until: Infinity },
      ];
      playback.value = next;
    },
    [clock, playback, emitters, particleMul],
  );

  return { res, clock, playback, emitters, play };
}

/** Draws the creature with its particles (call inside a picture recorder). */
export function drawTamtam(
  canvas: SkCanvas,
  res: CreatureResources,
  playback: PlaybackState,
  emitters: ActiveEmitters[],
  t: number,
  at: Placement,
  vx: number,
): Frame {
  "worklet";
  const frame = evaluateFrame(rig, clips, playback, { time: t, vx, seed: SEED });
  drawParticles(canvas, res, emitters, t, at, SEED, true);
  drawCreature(canvas, res, frame, at, t);
  drawParticles(canvas, res, emitters, t, at, SEED, false);
  return frame;
}
