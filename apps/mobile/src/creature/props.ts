import { BlurStyle, ClipOp, createPicture, PaintStyle, Skia, StrokeCap, type SkCanvas, type SkPicture } from "@shopify/react-native-skia";
import { transformPoint, type Frame } from "@tamtam/rig";

/** Shared props drawn around the Tamtam: egg, foods, shower, dirt & flies, mop. Vector art, brand style. */

const P = (d: string) => Skia.Path.MakeFromSVGString(d)!;
const paint = (c: string, a = 1, stroke?: number, blur?: number) => {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(c));
  p.setAlphaf(a);
  if (stroke !== undefined) {
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(stroke);
    p.setStrokeCap(StrokeCap.Round);
  }
  if (blur) p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  return p;
};
const INK = "#2A1A3E";

// ── Foods (drawn in a 40×40 box centred on 0,0) ──────────────────────────────
function drawFood(c: SkCanvas, id: string) {
  const line = paint(INK, 1, 2.2);
  switch (id) {
    case "food_berry_bun": {
      const bun = P("M -16 6 C -16 -12 16 -12 16 6 Z");
      c.drawPath(bun, paint("#D99A5B"));
      c.drawPath(P("M -16 6 C -10 -2 10 -2 16 6 Z"), paint("#B9763D", 0.8));
      c.drawPath(bun, line);
      for (const [x, y] of [[-6, -6], [3, -8], [9, -3], [-1, -2]]) {
        c.drawCircle(x!, y!, 3.2, paint("#7A3FB8"));
        c.drawCircle(x! - 1, y! - 1, 1, paint("#FFFFFF", 0.8));
      }
      c.drawRect(Skia.XYWHRect(-17, 6, 34, 4), paint("#8E5A2E"));
      break;
    }
    case "food_ember_pepper": {
      const pep = P("M -4 -8 C 10 -10 16 0 12 8 C 8 15 -6 16 -12 12 C -16 8 -14 -4 -4 -8 Z");
      c.drawPath(pep, paint("#F04432"));
      c.drawPath(P("M 8 -4 C 12 0 12 6 8 10"), paint("#FF9A7A", 0.8, 2.5));
      c.drawPath(pep, line);
      c.drawPath(P("M -4 -8 C -4 -14 0 -16 4 -17"), paint("#3E8E4A", 1, 3));
      c.drawPath(P("M 2 -12 C 0 -18 6 -22 6 -26 C 10 -20 8 -16 4 -12 Z"), paint("#FFC247", 1, undefined, 1));
      break;
    }
    case "food_roast_skewer": {
      c.drawLine(-18, 10, 18, -10, paint("#C9A27A", 1, 2.5));
      for (const [x, y, col] of [[-9, 5, "#B5552E"], [0, 0, "#9E4524"], [9, -5, "#C2643A"]] as const) {
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - 6, y - 6, 12, 12), 4, 4), paint(col));
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - 6, y - 6, 12, 12), 4, 4), line);
        c.drawLine(x - 3, y - 2, x + 2, y - 4, paint("#5A2416", 0.7, 1.4));
      }
      break;
    }
    case "food_cool_jelly": {
      const j = P("M -14 8 C -15 -6 -10 -14 0 -14 C 10 -14 15 -6 14 8 Z");
      c.drawPath(j, paint("#3FD4F0", 0.85));
      c.drawPath(P("M -8 -8 C -6 -11 -2 -12 2 -11"), paint("#FFFFFF", 0.8, 2.4));
      c.drawPath(j, line);
      c.drawOval(Skia.XYWHRect(-18, 6, 36, 6), paint("#E8F2FF"));
      c.drawOval(Skia.XYWHRect(-18, 6, 36, 6), line);
      break;
    }
    case "food_power_stew": {
      c.drawPath(P("M -16 -2 L 16 -2 C 15 10 8 14 0 14 C -8 14 -15 10 -16 -2 Z"), paint("#5B4AA0"));
      c.drawOval(Skia.XYWHRect(-16, -6, 32, 8), paint("#FF8A00"));
      c.drawCircle(-5, -3, 2, paint("#FFD166"));
      c.drawCircle(6, -2, 2.2, paint("#C64A20"));
      c.drawPath(P("M -16 -2 L 16 -2 C 15 10 8 14 0 14 C -8 14 -15 10 -16 -2 Z"), line);
      for (const x of [-6, 2, 9]) c.drawPath(P(`M ${x} -8 C ${x - 3} -12 ${x + 3} -15 ${x} -19`), paint("#FFFFFF", 0.6, 1.8));
      break;
    }
    default:
      c.drawCircle(0, 0, 12, paint("#CCCCCC"));
  }
}

const foodCache = new Map<string, SkPicture>();
export function foodPicture(id: string): SkPicture {
  let p = foodCache.get(id);
  if (!p) {
    p = createPicture((c) => drawFood(c, id), Skia.XYWHRect(-30, -30, 60, 60));
    foodCache.set(id, p);
  }
  return p;
}

// ── Egg (brand egg: cream shell, violet spots, cyan swirl) ───────────────────
const EGG = P("M 0 -60 C 30 -60 46 -18 46 10 C 46 40 26 58 0 58 C -26 58 -46 40 -46 10 C -46 -18 -30 -60 0 -60 Z");
const SPOTS = ["M -20 -20 a 9 7 0 1 0 0.1 0 Z", "M 18 0 a 11 9 0 1 0 0.1 0 Z", "M -8 26 a 8 6 0 1 0 0.1 0 Z", "M 14 -34 a 6 5 0 1 0 0.1 0 Z"].map(P);
const SWIRL = P("M 2 22 C 14 22 16 8 6 4 C -6 0 -14 12 -8 22 C -2 32 16 32 22 20 C 28 6 18 -8 4 -10");
const CRACKS = ["M -30 -6 L -18 -14 L -8 -2 L 4 -16 L 14 -4 L 28 -12", "M -4 -16 L -10 -30 L 0 -40", "M 14 -4 L 22 10 L 34 4"].map(P);
export const eggPaths = { EGG, SPOTS, SWIRL, CRACKS };

/** Egg in the room. progress 0–1; crackT ≥ 0 while hatching (seconds). */
export function drawEgg(c: SkCanvas, x: number, y: number, s: number, t: number, progress: number, crackT: number) {
  "worklet";
  c.save();
  c.translate(x, y - 58 * s);
  c.scale(s, s);
  const glow = Skia.Paint();
  glow.setColor(Skia.Color("#B983FF"));
  glow.setAlphaf(0.25 + 0.4 * progress + (progress >= 1 ? 0.2 * Math.sin(t * 6) : 0));
  glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 30, true));
  c.drawCircle(0, 0, 66, glow);
  const shadow = Skia.Paint();
  shadow.setColor(Skia.Color("#05030D"));
  shadow.setAlphaf(0.3);
  c.drawOval(Skia.XYWHRect(-38, 52, 76, 12), shadow);
  const burst = Math.max(0, Math.sin(t * 1.3));
  const amp = (3 + 12 * progress) * burst * burst + (crackT >= 0 ? 12 : 0);
  c.rotate(Math.sin(t * (8 + progress * 6)) * amp, 0, 50);
  const shell = Skia.Paint();
  shell.setAntiAlias(true);
  shell.setColor(Skia.Color("#FFE9D6"));
  c.drawPath(eggPaths.EGG, shell);
  const spot = Skia.Paint();
  spot.setAntiAlias(true);
  spot.setColor(Skia.Color("#7B5BD0"));
  spot.setAlphaf(0.6);
  for (let i = 0; i < eggPaths.SPOTS.length; i++) c.drawPath(eggPaths.SPOTS[i]!, spot);
  const shade = Skia.Paint();
  shade.setColor(Skia.Color("#C9A7E8"));
  shade.setAlphaf(0.4);
  c.save();
  c.clipPath(eggPaths.EGG, 1, true);
  c.drawCircle(26, 30, 50, shade);
  c.restore();
  const sw = Skia.Paint();
  sw.setAntiAlias(true);
  sw.setStyle(1);
  sw.setStrokeCap(1);
  sw.setStrokeWidth(6);
  sw.setColor(Skia.Color("#00D4FF"));
  sw.setAlphaf(0.5 + 0.35 * progress);
  sw.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 3, true));
  c.drawPath(eggPaths.SWIRL, sw);
  const sw2 = Skia.Paint();
  sw2.setAntiAlias(true);
  sw2.setStyle(1);
  sw2.setStrokeCap(1);
  sw2.setStrokeWidth(3.5);
  sw2.setColor(Skia.Color("#8FF0FF"));
  c.drawPath(eggPaths.SWIRL, sw2);
  const line = Skia.Paint();
  line.setAntiAlias(true);
  line.setStyle(1);
  line.setStrokeWidth(4);
  line.setColor(Skia.Color("#2A1A3E"));
  c.drawPath(eggPaths.EGG, line);
  const hl = Skia.Paint();
  hl.setColor(Skia.Color("#FFFFFF"));
  hl.setAlphaf(0.8);
  c.drawOval(Skia.XYWHRect(-28, -40, 12, 18), hl);
  if (crackT >= 0) {
    const crack = Skia.Paint();
    crack.setAntiAlias(true);
    crack.setStyle(1);
    crack.setStrokeWidth(3.2);
    crack.setColor(Skia.Color("#2A1A3E"));
    const n = Math.min(eggPaths.CRACKS.length, Math.floor(crackT / 0.25) + 1);
    for (let k = 0; k < n; k++) c.drawPath(eggPaths.CRACKS[k]!, crack);
    const light = Skia.Paint();
    light.setColor(Skia.Color("#8FF0FF"));
    light.setAlphaf(Math.min(1, crackT / 0.9));
    light.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 10, true));
    c.drawCircle(0, -8, 20 + crackT * 70, light);
  }
  c.restore();
}

/** Food in front of the mouth, shrinking in three bites. */
export function drawMeal(c: SkCanvas, pic: SkPicture, x: number, y: number, s: number, progress: number) {
  "worklet";
  const bites = Math.min(3, Math.floor(progress * 4));
  if (bites >= 3) return;
  const k = 1 - bites * 0.28;
  c.save();
  c.translate(x, y);
  c.scale(s * k, s * k);
  c.drawPicture(pic);
  c.restore();
}

/** Shower over the Tamtam: bent pipe, dome head, a cone of falling water, splashes and foam. */
export function drawShower(c: SkCanvas, x: number, top: number, ground: number, s: number, t: number) {
  "worklet";
  const ink = Skia.Paint();
  ink.setAntiAlias(true);
  ink.setStyle(1);
  ink.setStrokeWidth(2 * s);
  ink.setColor(Skia.Color("#2A1A3E"));
  // Pipe: down from the ceiling, then bends towards the head.
  const pipe = Skia.Paint();
  pipe.setAntiAlias(true);
  pipe.setStyle(1);
  pipe.setStrokeCap(1);
  pipe.setStrokeWidth(7 * s);
  pipe.setColor(Skia.Color("#C9C4E6"));
  const px = x - 40 * s;
  const path = Skia.Path.MakeFromSVGString(`M ${px} 0 L ${px} ${top - 22 * s} Q ${px} ${top - 6 * s} ${x - 18 * s} ${top - 6 * s} L ${x} ${top - 6 * s}`)!;
  c.drawPath(path, pipe);
  // Dome head with a perforated plate.
  const head = Skia.Paint();
  head.setAntiAlias(true);
  head.setColor(Skia.Color("#E6E2F8"));
  const dome = Skia.Path.MakeFromSVGString(`M ${x - 24 * s} ${top + 8 * s} C ${x - 22 * s} ${top - 10 * s} ${x + 22 * s} ${top - 10 * s} ${x + 24 * s} ${top + 8 * s} Z`)!;
  c.drawPath(dome, head);
  c.drawPath(dome, ink);
  const holes = Skia.Paint();
  holes.setColor(Skia.Color("#7B74A8"));
  for (let i = -3; i <= 3; i++) c.drawCircle(x + i * 6 * s, top + 5 * s, 1.3 * s, holes);
  // Water: a widening cone of streaks.
  const water = Skia.Paint();
  water.setAntiAlias(true);
  water.setStyle(1);
  water.setStrokeCap(1);
  water.setStrokeWidth(2.4 * s);
  water.setColor(Skia.Color("#8FE6FF"));
  const h = ground - top - 10 * s;
  for (let i = 0; i < 22; i++) {
    const u = (i % 11) / 10 - 0.5;
    const ph = (t * 2.6 + i * 0.29 + (i > 10 ? 0.5 : 0)) % 1;
    const y0 = top + 10 * s + ph * h;
    const spread = 1 + ph * 1.3;
    const lx = x + u * 40 * s * spread;
    water.setAlphaf(0.25 + 0.55 * (1 - ph));
    c.drawLine(lx, y0, lx + u * 6 * s, y0 + 16 * s, water);
  }
  // Splashes on the floor.
  const drop = Skia.Paint();
  drop.setAntiAlias(true);
  drop.setColor(Skia.Color("#BFF2FF"));
  for (let i = 0; i < 8; i++) {
    const ph = (t * 3 + i * 0.37) % 1;
    const dx = (i % 2 ? 1 : -1) * (20 + i * 7) * s * ph;
    drop.setAlphaf(0.8 * (1 - ph));
    c.drawCircle(x + dx, ground - 4 * s - Math.sin(ph * Math.PI) * 14 * s, 2.2 * s, drop);
  }
  const mist = Skia.Paint();
  mist.setColor(Skia.Color("#CFF4FF"));
  mist.setAlphaf(0.3);
  mist.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 14 * s, true));
  c.drawOval(Skia.XYWHRect(x - 70 * s, ground - 24 * s, 140 * s, 28 * s), mist);
}

/** Towel rubbed over the head after the shower. */
export function drawTowel(c: SkCanvas, frame: Frame, headBone: number, at: { x: number; y: number; scale: number; dir: number }, t: number) {
  "worklet";
  const [hx, hy] = transformPoint(frame.world, headBone, 10, -12);
  const cx = at.x + hx * at.scale * at.dir + Math.sin(t * 14) * 5 * at.scale;
  const cy = at.y + hy * at.scale;
  const s = at.scale;
  const towel = Skia.Path.MakeFromSVGString(
    `M ${cx - 26 * s} ${cy + 10 * s} C ${cx - 24 * s} ${cy - 16 * s} ${cx + 24 * s} ${cy - 18 * s} ${cx + 28 * s} ${cy + 8 * s} L ${cx + 22 * s} ${cy + 24 * s} C ${cx + 8 * s} ${cy + 12 * s} ${cx - 10 * s} ${cy + 14 * s} ${cx - 22 * s} ${cy + 26 * s} Z`,
  )!;
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color("#FF7FB6"));
  c.drawPath(towel, fill);
  const stripe = Skia.Paint();
  stripe.setAntiAlias(true);
  stripe.setStyle(1);
  stripe.setStrokeWidth(3 * s);
  stripe.setColor(Skia.Color("#FFFFFF"));
  stripe.setAlphaf(0.8);
  c.drawLine(cx - 20 * s, cy + 18 * s, cx - 14 * s, cy - 4 * s, stripe);
  c.drawLine(cx + 18 * s, cy + 16 * s, cx + 14 * s, cy - 6 * s, stripe);
  const ink = Skia.Paint();
  ink.setAntiAlias(true);
  ink.setStyle(1);
  ink.setStrokeWidth(2 * s);
  ink.setColor(Skia.Color("#2A1A3E"));
  c.drawPath(towel, ink);
}

/** Soap foam on the body while showering. */
export function drawFoam(c: SkCanvas, frame: Frame, bodyBone: number, headBone: number, at: { x: number; y: number; scale: number; dir: number }, t: number, amount = 1) {
  "worklet";
  if (amount <= 0.02) return;
  const foam = Skia.Paint();
  foam.setAntiAlias(true);
  foam.setColor(Skia.Color("#FFFFFF"));
  const rim = Skia.Paint();
  rim.setAntiAlias(true);
  rim.setStyle(1);
  rim.setStrokeWidth(1.2 * at.scale);
  rim.setColor(Skia.Color("#9FDDF0"));
  const spots: [number, number, number, number][] = [[-18, -14, 6, 0], [-6, -18, 7, 1], [8, -16, 6, 0], [20, -12, 5, 0], [-28, -8, 5, 0], [2, -20, 5, 1], [-10, -4, 6, 0], [14, -4, 5, 0], [-34, -14, 4, 0], [10, -24, 5, 1], [26, -20, 4, 0], [-2, -10, 7, 0]];
  const n = Math.max(1, Math.round(spots.length * Math.min(1, amount)));
  for (let i = 0; i < n; i++) {
    const [bx, by, r, onHead] = spots[i]!;
    const [wx, wy] = transformPoint(frame.world, onHead ? headBone : bodyBone, onHead ? bx * 0.5 : bx, onHead ? by + 6 : by);
    const rr = r * at.scale * (0.9 + 0.12 * Math.sin(t * 5 + i));
    const cx = at.x + wx * at.scale * at.dir, cy = at.y + wy * at.scale;
    foam.setAlphaf(0.92);
    c.drawCircle(cx, cy, rr, foam);
    c.drawCircle(cx, cy, rr, rim);
  }
}

/** Dirt smudges on the body and buzzing flies when the Tamtam has not been bathed. */
export function drawDirt(c: SkCanvas, frame: Frame, bodyBone: number, headBone: number, at: { x: number; y: number; scale: number; dir: number }, hygiene: number, t: number) {
  "worklet";
  if (hygiene >= 50) return;
  const k = (50 - hygiene) / 50;
  const mud = Skia.Paint();
  mud.setAntiAlias(true);
  mud.setColor(Skia.Color("#5A4030"));
  mud.setAlphaf(0.45 + 0.45 * k);
  mud.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 1.2 * at.scale, true));
  const speck = Skia.Paint();
  speck.setAntiAlias(true);
  speck.setColor(Skia.Color("#3A281C"));
  speck.setAlphaf(0.7 * k + 0.2);
  const pts: [number, number, number, number, number][] = [[-14, -10, 9, 5, 0], [6, 2, 8, 4, 0], [22, -12, 6, 4, 0], [-28, 0, 7, 4, 0], [10, -2, 5, 3, 1], [-2, -16, 6, 3, 0]];
  for (let i = 0; i < pts.length; i++) {
    const [bx, by, rx, ry, onHead] = pts[i]!;
    const [wx, wy] = transformPoint(frame.world, onHead ? headBone : bodyBone, bx, by);
    const cx = at.x + wx * at.scale * at.dir, cy = at.y + wy * at.scale;
    c.drawOval(Skia.XYWHRect(cx - rx * at.scale, cy - ry * at.scale, rx * 2 * at.scale, ry * 2 * at.scale), mud);
    c.drawCircle(cx + rx * 0.6 * at.scale, cy - ry * 0.8 * at.scale, 1.3 * at.scale, speck);
    c.drawCircle(cx - rx * 0.9 * at.scale, cy + ry * 0.5 * at.scale, 1 * at.scale, speck);
  }
  if (hygiene >= 30) return;
  // Flies buzzing around the Tamtam.
  const [hx, hy] = transformPoint(frame.world, headBone, 0, -10);
  const [bx0, by0] = transformPoint(frame.world, bodyBone, 0, -10);
  const fly = Skia.Paint();
  fly.setAntiAlias(true);
  fly.setColor(Skia.Color("#120A18"));
  const wing = Skia.Paint();
  wing.setAntiAlias(true);
  wing.setColor(Skia.Color("#E8F2FF"));
  wing.setAlphaf(0.85);
  const eye = Skia.Paint();
  eye.setColor(Skia.Color("#D0302A"));
  const s = at.scale;
  for (let i = 0; i < 4; i++) {
    const a = t * (2.6 + i * 0.7) + i * 1.7;
    const ax = i % 2 ? hx : bx0, ay = i % 2 ? hy : by0;
    const fx = at.x + ax * s * at.dir + Math.cos(a) * (30 + i * 9) * s + Math.sin(t * 13 + i) * 2 * s;
    const fy = at.y + ay * s - 22 * s + Math.sin(a * 1.4) * 16 * s;
    const flap = Math.abs(Math.sin(t * 38 + i)) * 3.5 * s + 1.5 * s;
    c.drawOval(Skia.XYWHRect(fx - 5 * s, fy - flap - 2 * s, 5 * s, flap * 1.5), wing);
    c.drawOval(Skia.XYWHRect(fx, fy - flap - 2 * s, 5 * s, flap * 1.5), wing);
    c.drawOval(Skia.XYWHRect(fx - 3.5 * s, fy - 2.4 * s, 7 * s, 4.8 * s), fly);
    c.drawCircle(fx + 2.6 * s, fy - 0.8 * s, 1.2 * s, eye);
  }
}

/** Mop following the finger. */
export function drawMop(c: SkCanvas, x: number, y: number, s: number, t: number) {
  "worklet";
  c.save();
  c.translate(x, y);
  c.rotate(-25 + Math.sin(t * 10) * 6, 0, 0);
  const stick = Skia.Paint();
  stick.setAntiAlias(true);
  stick.setColor(Skia.Color("#C9A27A"));
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-2.5 * s, -70 * s, 5 * s, 64 * s), 2 * s, 2 * s), stick);
  const head = Skia.Paint();
  head.setAntiAlias(true);
  head.setColor(Skia.Color("#8FE3F5"));
  for (let i = -3; i <= 3; i++) c.drawRRect(Skia.RRectXY(Skia.XYWHRect(i * 4.5 * s - 2.5 * s, -8 * s, 5 * s, 14 * s), 2.5 * s, 2.5 * s), head);
  const band = Skia.Paint();
  band.setColor(Skia.Color("#FF4F9A"));
  c.drawRect(Skia.XYWHRect(-16 * s, -10 * s, 32 * s, 5 * s), band);
  c.restore();
}

export const PROPS_CLIP = ClipOp.Intersect;

/** Soap bar following the finger during the bath. */
export function drawSoap(c: SkCanvas, x: number, y: number, s: number, t: number) {
  "worklet";
  c.save();
  c.translate(x, y);
  c.rotate(-15 + Math.sin(t * 9) * 8, 0, 0);
  const body = Skia.Paint();
  body.setAntiAlias(true);
  body.setColor(Skia.Color("#FF9CC8"));
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-18 * s, -11 * s, 36 * s, 22 * s), 9 * s, 9 * s), body);
  const hl = Skia.Paint();
  hl.setAntiAlias(true);
  hl.setColor(Skia.Color("#FFFFFF"));
  hl.setAlphaf(0.6);
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-12 * s, -8 * s, 18 * s, 6 * s), 3 * s, 3 * s), hl);
  const ink = Skia.Paint();
  ink.setAntiAlias(true);
  ink.setStyle(1);
  ink.setStrokeWidth(2 * s);
  ink.setColor(Skia.Color("#2A1A3E"));
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-18 * s, -11 * s, 36 * s, 22 * s), 9 * s, 9 * s), ink);
  const b = Skia.Paint();
  b.setAntiAlias(true);
  b.setColor(Skia.Color("#E8F8FF"));
  for (let i = 0; i < 4; i++) {
    const ph = (t * 1.5 + i * 0.25) % 1;
    b.setAlphaf(0.8 * (1 - ph));
    c.drawCircle((i - 1.5) * 9 * s, -14 * s - ph * 26 * s, (3 + i % 2) * s, b);
  }
  c.restore();
}

/** Towel held at the finger (drying step). */
export function drawTowelAt(c: SkCanvas, x: number, y: number, s: number, t: number) {
  "worklet";
  const cx = x + Math.sin(t * 12) * 3 * s;
  const path = Skia.Path.MakeFromSVGString(
    `M ${cx - 30 * s} ${y - 16 * s} C ${cx - 10 * s} ${y - 24 * s} ${cx + 12 * s} ${y - 8 * s} ${cx + 30 * s} ${y - 16 * s} L ${cx + 26 * s} ${y + 20 * s} C ${cx + 8 * s} ${y + 12 * s} ${cx - 12 * s} ${y + 28 * s} ${cx - 28 * s} ${y + 20 * s} Z`,
  )!;
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color("#7FD6FF"));
  c.drawPath(path, fill);
  const st = Skia.Paint();
  st.setAntiAlias(true);
  st.setStyle(1);
  st.setStrokeWidth(3 * s);
  st.setColor(Skia.Color("#FFFFFF"));
  st.setAlphaf(0.85);
  c.drawLine(cx - 22 * s, y + 8 * s, cx + 22 * s, y - 2 * s, st);
  const ink = Skia.Paint();
  ink.setAntiAlias(true);
  ink.setStyle(1);
  ink.setStrokeWidth(2 * s);
  ink.setColor(Skia.Color("#2A1A3E"));
  c.drawPath(path, ink);
}

/** Food carried by the finger while feeding. */
export function drawCarried(c: SkCanvas, pic: SkPicture, x: number, y: number, s: number, t: number) {
  "worklet";
  c.save();
  c.translate(x, y - 10 * s + Math.sin(t * 6) * 2 * s);
  c.scale(s * 1.4, s * 1.4);
  c.drawPicture(pic);
  c.restore();
}

/** Wardrobe accessory worn on the head (follows the head bone). */
export function drawAccessory(c: SkCanvas, frame: Frame, headBone: number, at: { x: number; y: number; scale: number; dir: number }, id: string) {
  "worklet";
  const s = at.scale;
  const [hx, hy] = transformPoint(frame.world, headBone, 6, -30);
  const cx = at.x + hx * s * at.dir;
  const cy = at.y + hy * s;
  const p = (col: string, stroke = 0) => {
    const q = Skia.Paint();
    q.setAntiAlias(true);
    q.setColor(Skia.Color(col));
    if (stroke) {
      q.setStyle(1);
      q.setStrokeWidth(stroke);
      q.setStrokeCap(1);
    }
    return q;
  };
  const path = (d: string) => Skia.Path.MakeFromSVGString(d)!;
  if (id === "acc_leaf_hat") {
    c.drawPath(path(`M ${cx - 30 * s} ${cy + 4 * s} C ${cx - 26 * s} ${cy - 26 * s} ${cx + 26 * s} ${cy - 26 * s} ${cx + 30 * s} ${cy + 4 * s} Q ${cx} ${cy + 12 * s} ${cx - 30 * s} ${cy + 4 * s} Z`), p("#5E9A3A"));
    c.drawPath(path(`M ${cx} ${cy + 6 * s} L ${cx} ${cy - 18 * s} M ${cx} ${cy - 4 * s} L ${cx - 16 * s} ${cy - 12 * s} M ${cx} ${cy - 4 * s} L ${cx + 16 * s} ${cy - 12 * s}`), p("#2E5A1E", 2 * s));
    c.drawLine(cx, cy - 18 * s, cx + 6 * at.dir * s, cy - 28 * s, p("#6B4220", 3 * s));
  } else if (id === "acc_flower") {
    const fx = cx + 18 * s * at.dir, fy = cy - 2 * s;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      c.drawCircle(fx + Math.cos(a) * 7 * s, fy + Math.sin(a) * 7 * s, 6 * s, p("#FF8FC0"));
    }
    c.drawCircle(fx, fy, 5 * s, p("#FFD166"));
  } else if (id === "acc_crown") {
    c.drawPath(path(`M ${cx - 24 * s} ${cy + 6 * s} L ${cx - 26 * s} ${cy - 14 * s} L ${cx - 12 * s} ${cy - 2 * s} L ${cx} ${cy - 22 * s} L ${cx + 12 * s} ${cy - 2 * s} L ${cx + 26 * s} ${cy - 14 * s} L ${cx + 24 * s} ${cy + 6 * s} Z`), p("#8A5A32"));
    c.drawPath(path(`M ${cx - 24 * s} ${cy + 6 * s} L ${cx + 24 * s} ${cy + 6 * s}`), p("#5A3418", 4 * s));
    for (const dx of [-26, 0, 26]) c.drawCircle(cx + dx * s, cy + (dx === 0 ? -22 : -14) * s, 4 * s, p("#7FD0E8"));
  } else if (id === "acc_scarf") {
    const [bx, by] = transformPoint(frame.world, headBone, 0, 26);
    const sx = at.x + bx * s * at.dir, sy = at.y + by * s;
    c.drawPath(path(`M ${sx - 30 * s} ${sy - 4 * s} Q ${sx} ${sy + 12 * s} ${sx + 30 * s} ${sy - 4 * s} L ${sx + 30 * s} ${sy + 6 * s} Q ${sx} ${sy + 22 * s} ${sx - 30 * s} ${sy + 6 * s} Z`), p("#E2574C"));
    c.drawPath(path(`M ${sx + 14 * s * at.dir} ${sy + 10 * s} L ${sx + 20 * s * at.dir} ${sy + 34 * s} L ${sx + 8 * s * at.dir} ${sy + 32 * s} Z`), p("#C23E36"));
    for (let i = -2; i <= 2; i++) c.drawLine(sx + i * 12 * s, sy, sx + i * 12 * s, sy + 12 * s, p("#FFFFFF", 1.5 * s));
  }
}
