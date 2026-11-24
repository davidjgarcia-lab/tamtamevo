import { BlendMode, BlurStyle, FilterMode, MipmapMode, Skia, TileMode, VertexMode, type SkCanvas, type SkImage, type SkPaint, type SkPoint } from "@shopify/react-native-skia";
import { CHISPIN_PAINTED } from "@tamtam/art";
import type { Frame } from "@tamtam/rig";

/**
 * Painted Chispín: the AI painting from the Unity project drawn as a textured mesh and skinned on the CPU
 * with the same bones/clips as the vector rig (linear blend skinning, up to 3 bones per vertex).
 * Coordinates are creature units; drawCreature has already applied position, scale and facing.
 */
const D = CHISPIN_PAINTED;
const NB = D.bones.length;
const RX: number[] = [];
const RY: number[] = [];
{
  const idx = new Map<string, number>();
  D.bones.forEach((b, i) => {
    idx.set(b.id, i);
    const p = b.parent === null ? -1 : idx.get(b.parent)!;
    RX[i] = b.x + (p >= 0 ? RX[p]! : 0);
    RY[i] = b.y + (p >= 0 ? RY[p]! : 0);
  });
}
const NV = D.vertices.length;
const VX = D.vertices.map((v) => v[0]);
const VY = D.vertices.map((v) => v[1]);
const WB: number[] = [];
const WW: number[] = [];
for (const w of D.weights) for (let j = 0; j < 3; j++) {
  WB.push(w[j]?.[0] ?? 0);
  WW.push(w[j]?.[1] ?? 0);
}
const IDX = [...D.triangles];
const HEAD = D.bones.findIndex((b) => b.id === "head");
const EYE = D.bones.findIndex((b) => b.id === "eye");
const E = D.eyesClosed;
const EYE_IDX = [0, 1, 2, 0, 2, 3];

export interface PaintedRes {
  paint: SkPaint;
  glow: SkPaint | null;
  eyePaint: SkPaint;
  uvs: SkPoint[];
  eyeUvs: SkPoint[];
}

/** Hue rotation (degrees) × saturation as a 4×5 colour matrix. */
function colorMatrix(hueDeg: number, sat: number): number[] {
  const a = (hueDeg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const lr = 0.213, lg = 0.715, lb = 0.072;
  const h = [
    lr + c * (1 - lr) + s * -lr, lg + c * -lg + s * -lg, lb + c * -lb + s * (1 - lb),
    lr + c * -lr + s * 0.143, lg + c * (1 - lg) + s * 0.14, lb + c * -lb + s * -0.283,
    lr + c * -lr + s * -(1 - lr), lg + c * -lg + s * lg, lb + c * (1 - lb) + s * lb,
  ];
  const r = 0.2126 * (1 - sat), g = 0.7152 * (1 - sat), b = 0.0722 * (1 - sat);
  const S = [r + sat, g, b, r, g + sat, b, r, g, b + sat];
  const m = (i: number, j: number) => S[i * 3]! * h[j]! + S[i * 3 + 1]! * h[3 + j]! + S[i * 3 + 2]! * h[6 + j]!;
  return [m(0, 0), m(0, 1), m(0, 2), 0, 0, m(1, 0), m(1, 1), m(1, 2), 0, 0, m(2, 0), m(2, 1), m(2, 2), 0, 0, 0, 0, 0, 1, 0];
}

/** Colour alleles on the painting: hue shift + saturation (the painting itself is "Brasa"). */
export const ALLELE_TINT: Record<string, { hue: number; sat: number }> = {
  brasa: { hue: 0, sat: 1 }, ceniza: { hue: 0, sat: 0.35 }, oro: { hue: 28, sat: 1.05 }, rubi: { hue: -12, sat: 1.25 }, azul: { hue: 195, sat: 1 },
};

export function buildPainted(img: SkImage, eyeImg: SkImage, alleleId: string, emissive: number): PaintedRes {
  const tint = ALLELE_TINT[alleleId] ?? ALLELE_TINT.brasa!;
  const cf = tint.hue === 0 && tint.sat === 1 ? null : Skia.ColorFilter.MakeMatrix(colorMatrix(tint.hue, tint.sat));
  const mk = (im: SkImage) => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setShader(im.makeShaderOptions(TileMode.Decal, TileMode.Decal, FilterMode.Linear, MipmapMode.None));
    if (cf) p.setColorFilter(cf);
    return p;
  };
  const paint = mk(img);
  // Radiant / legendary Lustre: a soft additive bloom of the painting itself.
  let glow: SkPaint | null = null;
  if (emissive > 1.05) {
    glow = mk(img);
    glow.setBlendMode(BlendMode.Plus);
    glow.setAlphaf(Math.min(0.45, 0.25 * (emissive - 0.9)));
    glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 6, true));
  }
  const [tw, th] = E.texture;
  return {
    paint, glow, eyePaint: mk(eyeImg),
    uvs: D.uvs.map(([u, v]) => Skia.Point(u, v)),
    eyeUvs: [Skia.Point(0, 0), Skia.Point(tw, 0), Skia.Point(tw, th), Skia.Point(0, th)],
  };
}

export function drawPainted(c: SkCanvas, pr: PaintedRes, frame: Frame): void {
  "worklet";
  const w = frame.world;
  const pos: SkPoint[] = new Array(NV);
  for (let i = 0; i < NV; i++) {
    const x = VX[i]!, y = VY[i]!;
    let sx = 0, sy = 0;
    for (let j = 0; j < 3; j++) {
      const wt = WW[i * 3 + j]!;
      if (wt === 0) continue;
      const b = WB[i * 3 + j]!;
      const k = b * 6;
      const a = w[k]!, bb = w[k + 1]!, cc = w[k + 2]!, d = w[k + 3]!;
      const tx = w[k + 4]! - (a * RX[b]! + cc * RY[b]!);
      const ty = w[k + 5]! - (bb * RX[b]! + d * RY[b]!);
      sx += wt * (a * x + cc * y + tx);
      sy += wt * (bb * x + d * y + ty);
    }
    pos[i] = Skia.Point(sx, sy);
  }
  const verts = Skia.MakeVertices(VertexMode.Triangles, pos, pr.uvs, undefined, IDX, true);
  if (pr.glow) c.drawVertices(verts, BlendMode.Dst, pr.glow);
  c.drawVertices(verts, BlendMode.Dst, pr.paint);

  // Closed eyes (clip states "closed"/"happy" and the procedural blink, which squashes the eye bone).
  const ke = EYE * 6, kh = HEAD * 6;
  const eyeScale = Math.hypot(w[ke + 2]!, w[ke + 3]!) / Math.max(1e-6, Math.hypot(w[kh + 2]!, w[kh + 3]!));
  if (frame.eyes === "closed" || frame.eyes === "happy" || eyeScale < 0.5) {
    const a = w[kh]!, bb = w[kh + 1]!, cc = w[kh + 2]!, d = w[kh + 3]!;
    const tx = w[kh + 4]! - (a * RX[HEAD]! + cc * RY[HEAD]!);
    const ty = w[kh + 5]! - (bb * RX[HEAD]! + d * RY[HEAD]!);
    const hx = E.size[0] / 2, hy = E.size[1] / 2;
    const P = (x: number, y: number) => Skia.Point(a * x + cc * y + tx, bb * x + d * y + ty);
    const cx = E.center[0], cy = E.center[1];
    const ev = Skia.MakeVertices(VertexMode.Triangles, [P(cx - hx, cy - hy), P(cx + hx, cy - hy), P(cx + hx, cy + hy), P(cx - hx, cy + hy)], pr.eyeUvs, undefined, EYE_IDX, true);
    c.drawVertices(ev, BlendMode.Dst, pr.eyePaint);
  }
}

export const PAINTED_BONES = NB;
