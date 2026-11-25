import { BlendMode, FilterMode, MipmapMode, Skia, TileMode, VertexMode, type SkCanvas, type SkImage, type SkPaint, type SkPoint } from "@shopify/react-native-skia";
import { CHISPIN_PAINTED, type GenomeLike } from "@tamtam/art";
import { artStage, motionFor, STARTERS, type FamilyId, type Motion } from "@tamtam/core";
import type { Frame } from "@tamtam/rig";

/**
 * Painted Tamtams (user art: 11 starters + 10 families × 3 stages). Each sprite is a deformable mesh:
 * the body follows the shared skeleton (so the 14 clips still drive it), the head nods/tilts with the head bone,
 * the tail wags with the tail bone, and the family's gait (walk, heavy, dash, fly, float, slither, bounce)
 * plus the starter's personality add breathing, bobbing, jitters and waves. Starters also blink.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const FAMILY_SPRITES: Record<string, number> = {
  fire_initial: require("../../assets/creatures/families/fire_initial.webp"),
  fire_intermediate: require("../../assets/creatures/families/fire_intermediate.webp"),
  fire_final: require("../../assets/creatures/families/fire_final.webp"),
  water_initial: require("../../assets/creatures/families/water_initial.webp"),
  water_intermediate: require("../../assets/creatures/families/water_intermediate.webp"),
  water_final: require("../../assets/creatures/families/water_final.webp"),
  plant_initial: require("../../assets/creatures/families/plant_initial.webp"),
  plant_intermediate: require("../../assets/creatures/families/plant_intermediate.webp"),
  plant_final: require("../../assets/creatures/families/plant_final.webp"),
  electric_initial: require("../../assets/creatures/families/electric_initial.webp"),
  electric_intermediate: require("../../assets/creatures/families/electric_intermediate.webp"),
  electric_final: require("../../assets/creatures/families/electric_final.webp"),
  rock_initial: require("../../assets/creatures/families/rock_initial.webp"),
  rock_intermediate: require("../../assets/creatures/families/rock_intermediate.webp"),
  rock_final: require("../../assets/creatures/families/rock_final.webp"),
  shadow_initial: require("../../assets/creatures/families/shadow_initial.webp"),
  shadow_intermediate: require("../../assets/creatures/families/shadow_intermediate.webp"),
  shadow_final: require("../../assets/creatures/families/shadow_final.webp"),
  light_initial: require("../../assets/creatures/families/light_initial.webp"),
  light_intermediate: require("../../assets/creatures/families/light_intermediate.webp"),
  light_final: require("../../assets/creatures/families/light_final.webp"),
  crystal_initial: require("../../assets/creatures/families/crystal_initial.webp"),
  crystal_intermediate: require("../../assets/creatures/families/crystal_intermediate.webp"),
  crystal_final: require("../../assets/creatures/families/crystal_final.webp"),
  plasma_initial: require("../../assets/creatures/families/plasma_initial.webp"),
  plasma_intermediate: require("../../assets/creatures/families/plasma_intermediate.webp"),
  plasma_final: require("../../assets/creatures/families/plasma_final.webp"),
  mystic_initial: require("../../assets/creatures/families/mystic_initial.webp"),
  mystic_intermediate: require("../../assets/creatures/families/mystic_intermediate.webp"),
  mystic_final: require("../../assets/creatures/families/mystic_final.webp"),
  fire_baby: require("../../assets/creatures/families/fire_baby.webp"),
  water_baby: require("../../assets/creatures/families/water_baby.webp"),
  plant_baby: require("../../assets/creatures/families/plant_baby.webp"),
  electric_baby: require("../../assets/creatures/families/electric_baby.webp"),
  rock_baby: require("../../assets/creatures/families/rock_baby.webp"),
  shadow_baby: require("../../assets/creatures/families/shadow_baby.webp"),
  light_baby: require("../../assets/creatures/families/light_baby.webp"),
  crystal_baby: require("../../assets/creatures/families/crystal_baby.webp"),
  plasma_baby: require("../../assets/creatures/families/plasma_baby.webp"),
  mystic_baby: require("../../assets/creatures/families/mystic_baby.webp"),
  plasma_baby2: require("../../assets/creatures/families/plasma_baby2.webp"),
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Eyes of the starters (normalised position in the image, radius as a fraction of the width, eyelid colour). */
const EYES: Record<string, { x: number; y: number; r: number; lid: string }> = {"fire_baby": {"x": 0.787, "y": 0.345, "r": 0.035, "lid": "#F45131"}, "water_baby": {"x": 0.733, "y": 0.44, "r": 0.045, "lid": "#7CE5FB"}, "plant_baby": {"x": 0.75, "y": 0.49, "r": 0.04, "lid": "#F5F691"}, "electric_baby": {"x": 0.817, "y": 0.433, "r": 0.028, "lid": "#BB8B47"}, "rock_baby": {"x": 0.783, "y": 0.503, "r": 0.028, "lid": "#EABD99"}, "plasma_baby": {"x": 0.667, "y": 0.563, "r": 0.05, "lid": "#4E1DDB"}, "shadow_baby": {"x": 0.633, "y": 0.559, "r": 0.045, "lid": "#561880"}, "light_baby": {"x": 0.75, "y": 0.431, "r": 0.035, "lid": "#FCFBF6"}, "crystal_baby": {"x": 0.733, "y": 0.395, "r": 0.03, "lid": "#88B0E2"}, "mystic_baby": {"x": 0.683, "y": 0.443, "r": 0.035, "lid": "#6B80D0"}};

/** Family that "shows": most parts; ties go to the back part. */
export function dominantFamily(g: GenomeLike): string {
  const n: Record<string, number> = {};
  for (const s of ["body", "head", "legs", "tail", "back"] as const) n[g.parts[s]] = (n[g.parts[s]] ?? 0) + (s === "back" ? 1.1 : 1);
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]![0];
}
const isPure = (g: GenomeLike) => new Set(Object.values(g.parts)).size === 1;
export function spriteKey(g: GenomeLike, stage = "juvenile"): string {
  const fam = dominantFamily(g);
  const st = artStage(stage);
  if (st === "baby") return fam === "plasma" && g.variant.back === 1 ? "plasma_baby2" : `${fam}_baby`;
  return `${fam}_${st}`;
}
/** Starter whose look this genome has (pure genome of a starter family/variant). */
function starterFor(g: GenomeLike) {
  if (!isPure(g)) return undefined;
  return STARTERS.find((s) => s.family === g.parts.body && s.variant === g.variant.body) ?? STARTERS.find((s) => s.family === g.parts.body);
}

const N = 12; // mesh grid N×N
export interface SpriteRes {
  paint: SkPaint;
  uvs: SkPoint[];
  rx: number[];
  ry: number[];
  wh: number[];
  wt: number[];
  u: number[];
  idx: number[];
  body: number;
  head: number;
  tail: number;
  restInv: number[];
  headPivot: [number, number];
  tailPivot: [number, number];
  feetY: number;
  w: number;
  m: Motion;
  eye: { x: number; y: number; r: number; wh: number } | null;
  lid: SkPaint | null;
  lash: SkPaint | null;
  seed: number;
}

function mutationFilter(m: string): number[] | null {
  if (m === "melanic") return [0.45, 0, 0, 0, 0, 0, 0.42, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 1, 0];
  if (m === "albino") return [0.35, 0.35, 0.3, 0, 0.32, 0.33, 0.35, 0.3, 0, 0.32, 0.33, 0.33, 0.34, 0, 0.34, 0, 0, 0, 1, 0];
  if (m === "aurora") return [0.4, 0.3, 0.3, 0, 0, 0.2, 0.9, 0.2, 0, 0.06, 0.25, 0.3, 0.7, 0, 0.06, 0, 0, 0, 1, 0];
  if (m === "iridescent") return [0.9, 0.1, 0.2, 0, 0.04, 0.05, 0.85, 0.15, 0, 0.02, 0.2, 0.05, 0.95, 0, 0.06, 0, 0, 0, 1, 0];
  return null;
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildSprite(img: SkImage, genome: GenomeLike, bones: string[], stage = "juvenile"): SpriteRes {
  const key = spriteKey(genome, stage);
  const fam = dominantFamily(genome) as FamilyId;
  const st = artStage(stage);
  const H = st === "baby" ? 104 : st === "initial" ? 112 : st === "intermediate" ? 118 : 124;
  const w = (img.width() / img.height()) * H;
  const x0 = 12 - w / 2, y0 = 12 - H;
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setShader(img.makeShaderOptions(TileMode.Decal, TileMode.Decal, FilterMode.Linear, MipmapMode.Linear));
  const f = mutationFilter(genome.mutation);
  if (f) paint.setColorFilter(Skia.ColorFilter.MakeMatrix(f));
  const uvs: SkPoint[] = [], rx: number[] = [], ry: number[] = [], wh: number[] = [], wt: number[] = [], u: number[] = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const a = i / N, b = j / N;
    uvs.push(Skia.Point(a * img.width(), b * img.height()));
    rx.push(x0 + a * w);
    ry.push(y0 + b * H);
    u.push(a);
    wh.push(smooth(0.52, 0.78, a) * (1 - 0.6 * smooth(0.7, 1, b))); // head = front (right), not the front feet
    wt.push(smooth(0.42, 0.12, a) * (1 - 0.5 * smooth(0.75, 1, b))); // tail = back (left)
  }
  const idx: number[] = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const p = j * (N + 1) + i;
    idx.push(p, p + 1, p + N + 1, p + 1, p + N + 2, p + N + 1);
  }
  // Rest world of the body bone (bones have no rest rotation).
  let bx = 0, by = 0;
  let bb: { id: string; parent: string | null; x: number; y: number } | undefined = CHISPIN_PAINTED.bones.find((q) => q.id === "body");
  while (bb) {
    bx += bb.x;
    by += bb.y;
    bb = bb.parent ? CHISPIN_PAINTED.bones.find((q) => q.id === bb!.parent) : undefined;
  }
  const e = EYES[key];
  const starter = st === "baby" ? starterFor(genome) : undefined;
  const lid = e ? Skia.Paint() : null;
  if (lid && e) {
    lid.setAntiAlias(true);
    lid.setColor(Skia.Color(e.lid));
  }
  const lash = e ? Skia.Paint() : null;
  if (lash) {
    lash.setAntiAlias(true);
    lash.setStyle(1);
    lash.setStrokeWidth(1.4);
    lash.setStrokeCap(1);
    lash.setColor(Skia.Color("#2A1A22"));
  }
  return {
    paint, uvs, rx, ry, wh, wt, u, idx,
    body: bones.indexOf("body"), head: bones.indexOf("head"), tail: bones.indexOf("tail1"),
    restInv: [1, 0, 0, 1, -bx, -by],
    headPivot: [x0 + w * 0.6, y0 + H * 0.55], tailPivot: [x0 + w * 0.34, y0 + H * 0.62], feetY: 12, w,
    m: motionFor(fam, st, starter?.motion),
    eye: e ? { x: x0 + e.x * w, y: y0 + e.y * H, r: e.r * w, wh: smooth(0.52, 0.78, e.x) } : null,
    lid, lash, seed: (key.length * 7.3) % 5,
  };
}

/** Draws the deformed mesh: personality + gait + clips (call inside drawCreature, creature units). */
export function drawSprite(canvas: SkCanvas, s: SpriteRes, frame: Frame, t: number) {
  "worklet";
  const W = frame.world;
  const m = s.m;
  const T = t * m.tempo + s.seed;
  const ang = (b: number) => (b < 0 ? 0 : Math.atan2(W[b * 6 + 1]!, W[b * 6]!));
  const bodyA = ang(s.body);
  // Head: clip-driven nod + curious tilts + nervous jitters.
  const head = (ang(s.head) - bodyA) * 0.8 + m.tilt * 0.1 * Math.sin(T * 0.7) * Math.max(0, Math.sin(T * 0.23)) + m.jitter * 0.035 * Math.sin(T * 23) * (Math.sin(T * 1.7) > 0.6 ? 1 : 0);
  // Tail: clip + wag.
  const tail = (ang(s.tail) - bodyA) * 0.5 + m.tail * 0.16 * Math.sin(T * 3.1);
  // Body: breathing (from the feet), idle hops, lift for flyers/floaters, wing-beat bob, heavy shake.
  const breath = 1 + m.breath * 0.035 * Math.sin(T * 1.9);
  const hop = m.gait === "bounce" ? Math.abs(Math.sin(T * 2.4)) : Math.max(0, Math.sin(T * 2.6)) * 0.35;
  const squash = m.gait === "bounce" ? 1 - 0.12 * Math.cos(T * 4.8) * m.bounce : 1;
  const lift = (m.float ? m.lift : 0) + (m.flap ? Math.sin(T * 5.5) * 3 * m.flap : 0) + (m.float ? Math.sin(T * 1.5) * 2.5 * m.sway : 0) + hop * m.bounce * 5;
  const swayX = m.float ? Math.sin(T * 0.9) * 3 * m.sway : 0;
  const shake = m.shake ? Math.sin(T * 30) * 0.5 * m.shake * (Math.sin(T * 1.3) > 0.85 ? 1 : 0) : 0;
  const ch = Math.cos(head), sh = Math.sin(head), ct = Math.cos(tail), stl = Math.sin(tail);
  const [hx, hy] = s.headPivot, [tx, ty] = s.tailPivot;
  const n = s.rx.length;
  const pos: SkPoint[] = new Array(n);
  // Body transform from the body bone: current × inverse(rest).
  const o = s.body * 6, r = s.restInv;
  const a = W[o]!, b = W[o + 1]!, c = W[o + 2]!, d = W[o + 3]!, ex = W[o + 4]!, ey = W[o + 5]!;
  const A = a * r[0]! + c * r[1]!, B = b * r[0]! + d * r[1]!, C = a * r[2]! + c * r[3]!, D = b * r[2]! + d * r[3]!;
  const TX = a * r[4]! + c * r[5]! + ex + swayX + shake, TY = b * r[4]! + d * r[5]! + ey - lift;
  const def = (x0: number, y0: number, whv: number, wtv: number, uu: number): [number, number] => {
    "worklet";
    let x = x0, y = y0;
    if (whv > 0) {
      const dx = x - hx, dy = y - hy;
      x += whv * (hx + dx * ch - dy * sh - x);
      y += whv * (hy + dx * sh + dy * ch - y);
    }
    if (wtv > 0) {
      const dx = x - tx, dy = y - ty;
      x += wtv * (tx + dx * ct - dy * stl - x);
      y += wtv * (ty + dx * stl + dy * ct - y);
    }
    if (m.wave) y += Math.sin(T * 3 - uu * 7) * 3.2 * m.wave * (1 - uu * 0.6);
    // Breathing / squash keep the feet on the ground.
    y = s.feetY + (y - s.feetY) * breath * squash;
    x = 12 + (x - 12) * (2 - squash);
    return [A * x + C * y + TX, B * x + D * y + TY];
  };
  for (let i = 0; i < n; i++) {
    const p = def(s.rx[i]!, s.ry[i]!, s.wh[i]!, s.wt[i]!, s.u[i]!);
    pos[i] = Skia.Point(p[0], p[1]);
  }
  const verts = Skia.MakeVertices(VertexMode.Triangles, pos, s.uvs, undefined, s.idx, true);
  canvas.drawVertices(verts, BlendMode.Dst, s.paint);
  // Eyelids: blink every few seconds, closed while sleeping, happy squint.
  if (s.eye && s.lid && s.lash) {
    const cyc = (t + s.seed * 1.7) % 4.3;
    let close = cyc < 0.16 ? Math.sin((cyc / 0.16) * Math.PI) : 0;
    if (frame.eyes === "closed") close = 1;
    else if (frame.eyes === "happy") close = Math.max(close, 0.6);
    if (close > 0.02) {
      const e = s.eye;
      const p = def(e.x, e.y, e.wh, 0, 0.7);
      const rr = e.r * 1.25;
      canvas.save();
      canvas.translate(p[0], p[1]);
      canvas.rotate((head * 180) / Math.PI + (bodyA * 180) / Math.PI, 0, 0);
      canvas.drawOval(Skia.XYWHRect(-rr, -rr, rr * 2, rr * 2 * close), s.lid);
      const ly = rr * 2 * close - rr * 0.95;
      const path = Skia.Path.MakeFromSVGString(`M ${-rr} ${ly} Q 0 ${ly + rr * 0.35} ${rr} ${ly}`);
      if (path) canvas.drawPath(path, s.lash);
      canvas.restore();
    }
  }
}
