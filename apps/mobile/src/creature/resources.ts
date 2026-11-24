import {
  BlurStyle,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
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
  faceSlot: "eyes" | "mouth" | "brows" | "prop" | null;
  faceStates: string[];
  /** Sheen sweep: local bounds of the path (null = no sheen). */
  sheenBounds: { x: number; y: number; w: number; h: number } | null;
}

/** Lustre-driven look (from @tamtam/core LOOK). */
export interface Look {
  saturation: number;
  emissive: number;
  sheen: number;
  halo: 0 | 1 | 2;
  particles: number;
  sparkle: boolean;
  /** Form-quality tier 0–4 that selects physical ornaments (default 2 = vivid). */
  tier?: number;
}
export const DEFAULT_LOOK: Look = { saturation: 1, emissive: 1, sheen: 0.22, halo: 0, particles: 1, sparkle: false, tier: 2 };

export interface CreatureResources {
  ops: DrawOp[];
  /** Bone whose height lifts the contact shadow (the body). */
  shadowBone: number;
  shadow: SkPaint;
  particlePaints: Record<string, SkPaint>;
  shapes: Record<ParticleShape, SkPath>;
  look: Look;
  /** saveLayer paint with a saturation colour filter (null when saturation = 1). */
  layer: SkPaint | null;
  glowColor: string;
  accentColor: string;
  /** Painted mesh (baby Chispín from the Unity painting); null for vector forms. */
  painted?: import("./painted").PaintedRes | null;
}

/** Luminance-preserving saturation matrix (4×5, row-major). */
function saturationMatrix(s: number): number[] {
  const r = 0.2126 * (1 - s), g = 0.7152 * (1 - s), b = 0.0722 * (1 - s);
  return [r + s, g, b, 0, 0, r, g + s, b, 0, 0, r, g, b + s, 0, 0, 0, 0, 0, 1, 0];
}

const colorOf = (c: string, palette: Palette) => (c in palette ? palette[c as keyof Palette] : c);

function paintFor(ref: PaintRef, palette: Palette, blur: number, stroke?: number): SkPaint {
  if ("gradient" in ref) {
    const p = makePaint("#000000", 1, blur, stroke);
    p.setShader(
      Skia.Shader.MakeLinearGradient(
        vec(ref.from[0], ref.from[1]),
        vec(ref.to[0], ref.to[1]),
        ref.gradient.map((c) => Skia.Color(colorOf(c, palette))),
        null,
        TileMode.Clamp,
      ),
    );
    p.setAlphaf(ref.alpha ?? 1);
    return p;
  }
  const color = "tint" in ref ? palette[ref.tint] : ref.color;
  return makePaint(color, ref.alpha ?? 1, blur, stroke);
}

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

export function buildResources(rig: CompiledRig, palette: Palette, emitters: EmitterDef[], look: Look = DEFAULT_LOOK): CreatureResources {
  const ops: DrawOp[] = [];
  const tier = look.tier ?? 2;
  for (const part of rig.parts) {
    if (tier < part.tierMin || tier > part.tierMax) continue;
    const e = part.emissive ? look.emissive : 1;
    // Glow parts (blurred) scale with the emissive level; solid emissive parts get a bloom pass when e > 1.
    if (part.emissive && part.blur === 0 && e > 1 && part.fill) {
      ops.push({
        path: svgPath(part.d), bone: part.bone, stroke: null, faceSlot: null, faceStates: [], sheenBounds: null,
        fill: makePaint(palette.glow, Math.min(0.9, 0.35 * (e - 0.6)), 5 * e),
      });
    }
    const blur = part.emissive && part.blur > 0 ? part.blur * (0.6 + 0.4 * e) : part.blur;
    const op: DrawOp = {
      path: svgPath(part.d),
      bone: part.bone,
      fill: part.fill ? paintFor(part.fill, palette, blur) : null,
      stroke: part.stroke ? paintFor(part.stroke, palette, blur, part.strokeWidth) : null,
      faceSlot: part.faceSlot,
      faceStates: part.faceStates,
      sheenBounds: null,
    };
    if (part.emissive && part.blur > 0 && op.fill && part.fill) {
      const baseAlpha = part.fill.alpha ?? 1;
      op.fill.setAlphaf(Math.min(1, baseAlpha * e));
    }
    if (part.sheen && look.sheen > 0) {
      const b = svgPath(part.d).computeTightBounds();
      op.sheenBounds = { x: b.x, y: b.y, w: b.width, h: b.height };
    }
    ops.push(op);
  }
  let layer: SkPaint | null = null;
  if (Math.abs(look.saturation - 1) > 0.01) {
    layer = Skia.Paint();
    layer.setColorFilter(Skia.ColorFilter.MakeMatrix(saturationMatrix(look.saturation)));
  }

  const particlePaints: Record<string, SkPaint> = {};
  for (const e of emitters) {
    particlePaints[`${e.id}`] = makePaint(e.color, 1, 0, e.shape === "z" ? 2.2 : undefined);
    particlePaints[`${e.id}:glow`] = makePaint(e.color, 0.5, 3);
  }

  return {
    ops,
    look,
    layer,
    glowColor: palette.glow,
    accentColor: palette.accent,
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
