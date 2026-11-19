import { BlurStyle, ClipOp, PaintStyle, Skia, TileMode, vec, type SkCanvas } from "@shopify/react-native-skia";
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

/** Halo behind the creature (Lustre radiant / legendary). */
function drawHalo(canvas: SkCanvas, res: CreatureResources, w: number[], at: Placement, t: number): void {
  "worklet";
  const level = res.look.halo;
  if (level === 0) return;
  const k = res.shadowBone * 6;
  const cx = at.x + (w[k + 4]! + w[k + 2]! * -45) * at.scale * at.dir;
  const cy = at.y + (w[k + 5]! + w[k + 3]! * -45) * at.scale;
  const r = 72 * at.scale * (1 + 0.04 * Math.sin(t * 1.6));
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setShader(
    Skia.Shader.MakeRadialGradient(vec(cx, cy), r, [Skia.Color(res.glowColor), Skia.Color(res.glowColor), Skia.Color("transparent")], [0, 0.35, 1], TileMode.Clamp),
  );
  p.setAlphaf(level === 2 ? 0.55 : 0.38);
  canvas.drawCircle(cx, cy, r, p);
  const ring = Skia.Paint();
  ring.setAntiAlias(true);
  ring.setStyle(PaintStyle.Stroke);
  ring.setStrokeWidth(2.2 * at.scale);
  ring.setColor(Skia.Color(res.glowColor));
  ring.setAlphaf(0.35 + 0.15 * Math.sin(t * 2.1));
  ring.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 2 * at.scale, true));
  canvas.drawCircle(cx, cy, r * 0.82, ring);
  if (level === 2) {
    // Legendary: orbiting light motes.
    const mote = Skia.Paint();
    mote.setAntiAlias(true);
    mote.setColor(Skia.Color("#FFFFFF"));
    for (let i = 0; i < 8; i++) {
      const a = t * 0.8 + (i * Math.PI) / 4;
      mote.setAlphaf(0.5 + 0.5 * Math.sin(t * 3 + i));
      canvas.drawCircle(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.5, (1.6 + (i % 3)) * at.scale, mote);
    }
  }
}

/** Twinkling four-point sparkles around a radiant/legendary Tamtam. */
function drawSparkles(canvas: SkCanvas, res: CreatureResources, at: Placement, t: number): void {
  "worklet";
  if (!res.look.sparkle) return;
  const star = res.shapes.spark;
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color("#FFFFFF"));
  for (let i = 0; i < 5; i++) {
    const phase = (t * 0.6 + i * 0.37) % 1;
    const tw = Math.sin(phase * Math.PI);
    if (tw <= 0.05) continue;
    const ang = i * 2.3 + Math.floor(t * 0.6 + i * 0.37) * 1.7;
    const x = at.x + Math.cos(ang) * 58 * at.scale;
    const y = at.y - (60 + Math.sin(ang) * 46) * at.scale;
    p.setAlphaf(tw);
    canvas.save();
    canvas.translate(x, y);
    canvas.scale(4.5 * at.scale * tw, 4.5 * at.scale * tw);
    canvas.drawPath(star, p);
    canvas.restore();
  }
}

/** Draws one creature frame. Runs on the UI thread inside a picture recorder. */
export function drawCreature(canvas: SkCanvas, res: CreatureResources, frame: Frame, at: Placement, t = 0): void {
  "worklet";
  const w = frame.world;
  drawHalo(canvas, res, w, at, t);

  // Contact shadow: shrinks as the body lifts off the ground.
  const lift = Math.max(0, -w[res.shadowBone * 6 + 5]!);
  const k = Math.max(0.55, 1 - lift / 40);
  canvas.save();
  canvas.translate(at.x, at.y);
  canvas.scale(at.scale * k, at.scale * k * 0.32);
  canvas.drawCircle(0, 0, 40, res.shadow);
  canvas.restore();

  if (res.layer) canvas.saveLayer(res.layer);
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
    const sb = op.sheenBounds;
    if (sb && res.look.sheen > 0) {
      // Sheen: a soft diagonal band of light sweeps across the part every 3.2 s.
      const cyc = (t % 3.2) / 1.3; // sweep during the first 1.3 s of the cycle
      if (cyc < 1) {
        const x0 = sb.x - sb.w * 0.6 + cyc * sb.w * 2.2;
        const sp = Skia.Paint();
        sp.setAntiAlias(true);
        sp.setShader(
          Skia.Shader.MakeLinearGradient(
            vec(x0, sb.y),
            vec(x0 + sb.w * 0.45, sb.y + sb.h * 0.35),
            [Skia.Color("transparent"), Skia.Color("#FFFFFF"), Skia.Color("transparent")],
            [0, 0.5, 1],
            TileMode.Clamp,
          ),
        );
        sp.setAlphaf(res.look.sheen);
        canvas.save();
        canvas.clipPath(op.path, ClipOp.Intersect, true);
        canvas.drawRect(Skia.XYWHRect(sb.x, sb.y, sb.w, sb.h), sp);
        canvas.restore();
      }
    }
    canvas.restore();
  }
  canvas.restore();
  if (res.layer) canvas.restore();
  drawSparkles(canvas, res, at, t);
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
