import type { SkCanvas } from "@shopify/react-native-skia";
import { chispinClips, chispinEmitters, chispinRig, fireColorAlleles, genomeEmitters, genomePalette, genomeRig, type ChispinClipId, type GenomeLike } from "@tamtam/art";
import { compileClip, compileRig, derivePalette, evaluateFrame, switchClip, type CompiledClip, type CompiledRig, type EmitterDef, type Frame, type PlaybackState } from "@tamtam/rig";
import { useCallback, useMemo } from "react";
import { useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";
import { drawCreature, drawParticles, type ActiveEmitters, type Placement } from "./draw";
import { buildResources, DEFAULT_LOOK, type CreatureResources, type Look } from "./resources";

export const rig = compileRig(chispinRig);
export const clips = chispinClips.map((c) => compileClip(rig, c));
export const clipIndex = (id: ChispinClipId) => clips.findIndex((c) => c.id === id);
export const SEED = 7;
export const BONE = { body: rig.boneIds.indexOf("body"), head: rig.boneIds.indexOf("head"), jaw: rig.boneIds.indexOf("jaw") };

/** A drawable creature model: Chispín (baby) or an evolved form built from its genome. */
interface Model {
  rig: CompiledRig;
  clips: CompiledClip[];
  emitters: Record<ChispinClipId, EmitterDef[]>;
  float: boolean;
}
const models = new Map<string, Model>();
function modelFor(genome?: GenomeLike | null): Model {
  if (!genome) return { rig, clips, emitters: chispinEmitters, float: false };
  const key = JSON.stringify(genome);
  let m = models.get(key);
  if (!m) {
    const g = genomeRig(genome);
    const r = compileRig(g.rig);
    m = { rig: r, clips: chispinClips.map((c) => compileClip(r, c)), emitters: genomeEmitters(genome), float: g.float };
    models.set(key, m);
  }
  return m;
}

export type ModelResources = CreatureResources & { rig: CompiledRig; clips: CompiledClip[] };

export interface CreatureHandle {
  res: ModelResources;
  clock: SharedValue<number>;
  playback: SharedValue<PlaybackState>;
  emitters: SharedValue<ActiveEmitters[]>;
  play: (id: ChispinClipId) => void;
}

/** Shared animation clock + playback state for one Tamtam on screen. */
export function useCreature(alleleId: string, look: Look = DEFAULT_LOOK, genome?: GenomeLike | null): CreatureHandle {
  const gkey = genome ? JSON.stringify(genome) : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const model = useMemo(() => modelFor(genome), [gkey]);
  const palette = useMemo(
    () => derivePalette(genome ? genomePalette(genome) : (fireColorAlleles.find((a) => a.id === alleleId) ?? fireColorAlleles[0]!).genes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alleleId, gkey],
  );
  const res = useMemo<ModelResources>(
    () => ({ ...buildResources(model.rig, palette, Object.values(model.emitters).flat(), look), rig: model.rig, clips: model.clips }),
    [model, palette, look],
  );
  const particleMul = look.particles;
  const clock = useSharedValue(0);
  const playback = useSharedValue<PlaybackState>({ clip: clipIndex("idle"), start: 0, prevClip: -1, prevStart: 0 });
  const emitters = useSharedValue<ActiveEmitters[]>([{ defs: model.emitters.idle, from: 0, until: Infinity }]);

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
      const prevDefs = scaled(model.emitters[clips[playback.value.clip]!.id as ChispinClipId]);
      emitters.value = [
        { defs: prevDefs, from: playback.value.start, until: now },
        { defs: scaled(model.emitters[id]), from: now, until: Infinity },
      ];
      playback.value = next;
    },
    [clock, playback, emitters, particleMul, model],
  );

  return { res, clock, playback, emitters, play };
}

/** Draws the creature with its particles (call inside a picture recorder). */
export function drawTamtam(
  canvas: SkCanvas,
  res: ModelResources,
  playback: PlaybackState,
  emitters: ActiveEmitters[],
  t: number,
  at: Placement,
  vx: number,
): Frame {
  "worklet";
  const frame = evaluateFrame(res.rig, res.clips, playback, { time: t, vx, seed: SEED });
  drawParticles(canvas, res, emitters, t, at, SEED, true);
  drawCreature(canvas, res, frame, at, t);
  drawParticles(canvas, res, emitters, t, at, SEED, false);
  return frame;
}

/** Visual size of each stage (evolved forms grow). */
export const STAGE_SCALE: Record<string, number> = { baby: 1, child: 1.1, juvenile: 1.22, adult: 1.34 };
