import { Skia, type SkCanvas } from "@shopify/react-native-skia";
import { evalEmitter, type EmitterDef, type Frame } from "@tamtam/rig";
import type { CreatureResources } from "./resources";

export interface Placement {
  x: number;
  y: number;
  scale: number;
  /** 1 = facing right, -1 = facing left. */
  dir: number;
}

export interface ActiveEmitters {
  defs: EmitterDef[];
  from: number;
  until: number;
}

/** Draws one creature frame. Runs on the UI thread inside a picture recorder. */
export function drawCreature(canvas: SkCanvas, res: CreatureResources, frame: Frame, at: Placement): void {
  "worklet";
  const w = frame.world;

  // Contact shadow: shrinks as the body lifts off the ground.
  const lift = Math.max(0, -w[res.shadowBone * 6 + 5]!);
  const k = Math.max(0.55, 1 - lift / 40);
  canvas.save();
  canvas.translate(at.x, at.y);
  canvas.scale(at.scale * k, at.scale * k * 0.32);
  canvas.drawCircle(0, 0, 40, res.shadow);
  canvas.restore();

  canvas.save();
  canvas.translate(at.x, at.y);
  canvas.scale(at.scale * at.dir, at.scale);
  for (let i = 0; i < res.ops.length; i++) {
    const op = res.ops[i]!;
    if (op.faceSlot !== null) {
      const state =
        op.faceSlot === "eyes" ? frame.eyes : op.faceSlot === "mouth" ? frame.mouth : op.faceSlot === "brows" ? frame.brows : frame.prop;
      if (op.faceStates.indexOf(state) < 0) continue;
    }
    const o = op.bone * 6;
    canvas.save();
    canvas.concat(Skia.Matrix([w[o]!, w[o + 2]!, w[o + 4]!, w[o + 1]!, w[o + 3]!, w[o + 5]!, 0, 0, 1]));
    if (op.fill) canvas.drawPath(op.path, op.fill);
    if (op.stroke) canvas.drawPath(op.path, op.stroke);
    canvas.restore();
  }
  canvas.restore();
}

/** Particles are drawn un-mirrored (text-like shapes such as "Z" must not flip). */
export function drawParticles(
  canvas: SkCanvas,
  res: CreatureResources,
  sets: ActiveEmitters[],
  time: number,
  at: Placement,
  seed: number,
  /** true → only emitters marked `behind`; false → only the rest. */
  behind: boolean,
): void {
  "worklet";
  for (let s = 0; s < sets.length; s++) {
    const set = sets[s]!;
    for (let e = 0; e < set.defs.length; e++) {
      const def = set.defs[e]!;
      if ((def.behind ?? false) !== behind) continue;
      const ps = evalEmitter(def, time, set.from, set.until, seed + e * 17);
      const base = res.particlePaints[def.id];
      const glow = res.particlePaints[`${def.id}:glow`];
      if (!base) continue;
      const shape = res.shapes[def.shape];
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]!;
        const x = at.x + p.x * at.scale * at.dir;
        const y = at.y + p.y * at.scale;
        const size = p.size * at.scale;
        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(p.rot, 0, 0);
        canvas.scale(size, size);
        if (def.shape === "ember" && glow) {
          const g = glow.copy();
          g.setAlphaf(0.45 * p.alpha);
          canvas.drawCircle(0, 0, 2.4, g);
        }
        const paint = base.copy();
        paint.setAlphaf(p.alpha * (def.shape === "bubble" ? 0.45 : 1));
        if (def.shape === "z") paint.setStrokeWidth(2.2 / Math.max(size, 0.001) * at.scale);
        canvas.drawPath(shape, paint);
        canvas.restore();
      }
    }
  }
}
