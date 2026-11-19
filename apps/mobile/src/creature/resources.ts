import {
  BlurStyle,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkPaint,
  type SkPath,
} from "@shopify/react-native-skia";
import type { CompiledRig, EmitterDef, Palette, PaintRef, ParticleShape } from "@tamtam/rig";

/**
 * GPU-side resources for one creature, built on the JS thread whenever the rig or
 * the genetic palette changes, then captured by the UI-thread render worklet.
 */
export interface DrawOp {
  path: SkPath;
  bone: number;
  fill: SkPaint | null;
  stroke: SkPaint | null;
  faceSlot: "eyes" | "mouth" | null;
  faceStates: string[];
}

export interface CreatureResources {
  ops: DrawOp[];
  /** Bone whose height lifts the contact shadow (the body). */
  shadowBone: number;
  shadow: SkPaint;
  particlePaints: Record<string, SkPaint>;
  shapes: Record<ParticleShape, SkPath>;
}

const resolve = (ref: PaintRef, palette: Palette): { color: string; alpha: number } =>
  "tint" in ref ? { color: palette[ref.tint], alpha: ref.alpha ?? 1 } : { color: ref.color, alpha: ref.alpha ?? 1 };

function makePaint(color: string, alpha: number, blur: number, stroke?: number): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  p.setAlphaf(alpha);
  if (blur > 0) p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  if (stroke !== undefined) {
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(stroke);
    p.setStrokeCap(StrokeCap.Round);
    p.setStrokeJoin(StrokeJoin.Round);
  }
  return p;
}

const pathCache = new Map<string, SkPath>();
export function svgPath(d: string): SkPath {
  let p = pathCache.get(d);
  if (!p) {
    const made = Skia.Path.MakeFromSVGString(d);
    if (!made) throw new Error(`Invalid SVG path: ${d.slice(0, 40)}…`);
    p = made;
    pathCache.set(d, p);
  }
  return p;
}

export function buildResources(rig: CompiledRig, palette: Palette, emitters: EmitterDef[]): CreatureResources {
  const ops: DrawOp[] = rig.parts.map((part) => {
    const fill = part.fill ? resolve(part.fill, palette) : null;
    const stroke = part.stroke ? resolve(part.stroke, palette) : null;
    return {
      path: svgPath(part.d),
      bone: part.bone,
      fill: fill ? makePaint(fill.color, fill.alpha, part.blur) : null,
      stroke: stroke ? makePaint(stroke.color, stroke.alpha, part.blur, part.strokeWidth) : null,
      faceSlot: part.faceSlot,
      faceStates: part.faceStates,
    };
  });

  const particlePaints: Record<string, SkPaint> = {};
  for (const e of emitters) {
    particlePaints[`${e.id}`] = makePaint(e.color, 1, 0, e.shape === "z" ? 2.2 : undefined);
    particlePaints[`${e.id}:glow`] = makePaint(e.color, 0.5, 3);
  }

  return {
    ops,
    shadowBone: Math.max(0, rig.breathBone),
    shadow: makePaint("#1A0A0A", 0.32, 4),
    particlePaints,
    shapes: {
      // All particle shapes are authored at unit radius; emitters set the size.
      heart: svgPath("M 0 0.7 C -0.2 0.3 -1 -0.1 -1 -0.6 C -1 -1 -0.6 -1.2 -0.32 -1.12 C -0.16 -1.08 -0.06 -0.96 0 -0.84 C 0.06 -0.96 0.16 -1.08 0.32 -1.12 C 0.6 -1.2 1 -1 1 -0.6 C 1 -0.1 0.2 0.3 0 0.7 Z"),
      z: svgPath("M -1 -1 L 1 -1 L -1 1 L 1 1"),
      ember: svgPath("M 0 -1 A 1 1 0 1 0 0 1 A 1 1 0 1 0 0 -1 Z"),
      bubble: svgPath("M 0 -1 A 1 1 0 1 0 0 1 A 1 1 0 1 0 0 -1 Z"),
      crumb: svgPath("M -1 -0.8 L 1 -1 L 0.9 0.9 L -0.9 0.8 Z"),
      spark: svgPath("M 0 -1.4 L 0.35 -0.35 L 1.4 0 L 0.35 0.35 L 0 1.4 L -0.35 0.35 L -1.4 0 L -0.35 -0.35 Z"),
    },
  };
}
