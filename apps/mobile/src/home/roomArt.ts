import { BlurStyle, ClipOp, createPicture, PaintStyle, Skia, StrokeCap, StrokeJoin, TileMode, vec, type SkCanvas, type SkPicture } from "@shopify/react-native-skia";
import { footprint, SLICE_CATALOG, type Placement, type RoomLayout } from "@tamtam/core";

/**
 * TamTam Home renderer (vertical slice). Vector art in the ART_BIBLE style:
 * coloured outlines, two tones + soft gradient, rounded shapes. artStatus = prototype.
 */

export interface RoomGeom {
  w: number;
  h: number;
  wallTop: number;
  wallBottom: number;
  floorTop: number;
  floorBottom: number;
  wallCell: number;
  wallX0: number;
  floorCellW: number;
  floorCellH: number;
  floorX0: number;
}

export function roomGeom(w: number, h: number, room: RoomLayout): RoomGeom {
  const wallTop = h * 0.04;
  const wallBottom = h * 0.56;
  const floorTop = wallBottom;
  const floorBottom = h * 0.97;
  const wallCell = Math.min((w * 0.94) / room.wall.cols, (wallBottom - wallTop) / room.wall.rows);
  const floorCellW = (w * 0.96) / room.floor.cols;
  const floorCellH = (floorBottom - floorTop) / room.floor.rows;
  return {
    w, h, wallTop, wallBottom, floorTop, floorBottom, wallCell,
    wallX0: (w - wallCell * room.wall.cols) / 2,
    floorCellW, floorCellH, floorX0: w * 0.02,
  };
}

/** Screen rectangle of a placement (floor items stand on the back edge of their footprint). */
export function placementRect(g: RoomGeom, p: Pick<Placement, "x" | "y" | "rotated" | "layer" | "itemId">) {
  const item = SLICE_CATALOG.get(p.itemId)!;
  const f = footprint(p, item);
  if (p.layer === "wall") {
    return { x: g.wallX0 + f.x * g.wallCell, y: g.wallTop + f.y * g.wallCell, w: f.w * g.wallCell, h: f.h * g.wallCell };
  }
  const x = g.floorX0 + f.x * g.floorCellW;
  const y = g.floorTop + f.y * g.floorCellH;
  return { x, y, w: f.w * g.floorCellW, h: f.h * g.floorCellH };
}

export function cellAt(g: RoomGeom, room: RoomLayout, layer: "floor" | "wall" | "rug", px: number, py: number): { x: number; y: number } | null {
  if (layer === "wall") {
    const x = Math.floor((px - g.wallX0) / g.wallCell);
    const y = Math.floor((py - g.wallTop) / g.wallCell);
    return x >= 0 && y >= 0 && x < room.wall.cols && y < room.wall.rows ? { x, y } : null;
  }
  const x = Math.floor((px - g.floorX0) / g.floorCellW);
  const y = Math.floor((py - g.floorTop) / g.floorCellH);
  return x >= 0 && y >= 0 && x < room.floor.cols && y < room.floor.rows ? { x, y } : null;
}

const INK = "#2A1A3E";

function paint(color: string, alpha = 1, opts: { stroke?: number; blur?: number } = {}) {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  p.setAlphaf(alpha);
  if (opts.stroke !== undefined) {
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(opts.stroke);
    p.setStrokeCap(StrokeCap.Round);
    p.setStrokeJoin(StrokeJoin.Round);
  }
  if (opts.blur) p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, opts.blur, true));
  return p;
}

function grad(x0: number, y0: number, x1: number, y1: number, colors: string[]) {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setShader(Skia.Shader.MakeLinearGradient(vec(x0, y0), vec(x1, y1), colors.map((c) => Skia.Color(c)), null, TileMode.Clamp));
  return p;
}

const rr = (x: number, y: number, w: number, h: number, r: number) => Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r);

function outlinedRRect(c: SkCanvas, x: number, y: number, w: number, h: number, r: number, fill: ReturnType<typeof paint>, lw: number) {
  c.drawRRect(rr(x, y, w, h, r), fill);
  c.drawRRect(rr(x, y, w, h, r), paint(INK, 1, { stroke: lw }));
}

const P = (d: string) => Skia.Path.MakeFromSVGString(d)!;
const fillStroke = (c: SkCanvas, d: string, fill: SkPaintT, lw: number, ink = INK) => {
  const path = P(d);
  c.drawPath(path, fill);
  c.drawPath(path, paint(ink, 1, { stroke: lw }));
};
type SkPaintT = ReturnType<typeof paint>;
/** Soft contact shadow on the floor. */
const shadow = (c: SkCanvas, cx: number, by: number, rw: number, rh: number) => c.drawOval(Skia.XYWHRect(cx - rw, by - rh * 0.6, rw * 2, rh * 1.2), paint("#1A0E08", 0.28, { blur: rh * 0.6 }));
/** Deterministic pseudo-random in [0,1). */
const hr = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ── Landscapes for the paintings ──────────────────────────────────────────────
export function drawLandscape(c: SkCanvas, kind: string, x: number, y: number, w: number, h: number) {
  const sky = (a: string, b: string) => c.drawRect(Skia.XYWHRect(x, y, w, h), grad(0, y, 0, y + h, [a, b]));
  const hill = (pts: string, col: string, a = 1) => c.drawPath(P(pts), paint(col, a));
  const X = (u: number) => x + w * u, Y = (v: number) => y + h * v;
  switch (kind) {
    case "volcano":
      sky("#FF9A62", "#FFD9A8");
      hill(`M ${X(0)} ${Y(1)} L ${X(0.36)} ${Y(0.42)} L ${X(0.46)} ${Y(0.38)} L ${X(0.56)} ${Y(0.42)} L ${X(1)} ${Y(1)} Z`, "#6B2B2B");
      hill(`M ${X(0.41)} ${Y(0.43)} L ${X(0.46)} ${Y(0.39)} L ${X(0.5)} ${Y(0.43)} L ${X(0.47)} ${Y(0.62)} Z`, "#FF7A2F");
      c.drawCircle(X(0.46), Y(0.32), w * 0.12, paint("#9A8A8A", 0.6, { blur: w * 0.05 }));
      hill(`M ${X(0)} ${Y(1)} L ${X(0)} ${Y(0.8)} Q ${X(0.3)} ${Y(0.7)} ${X(0.6)} ${Y(0.82)} T ${X(1)} ${Y(0.8)} L ${X(1)} ${Y(1)} Z`, "#3A1E22");
      break;
    case "stars":
      sky("#0E0B2A", "#3B2462");
      for (let i = 0; i < 26; i++) c.drawCircle(X(hr(i)), Y(hr(i + 50) * 0.7), w * (0.006 + 0.01 * hr(i + 9)), paint("#FFF6C8", 0.6 + 0.4 * hr(i + 3)));
      c.drawCircle(X(0.74), Y(0.24), w * 0.09, paint("#FFF1B0"));
      c.drawCircle(X(0.77), Y(0.22), w * 0.08, paint("#2A1E52"));
      hill(`M ${X(0)} ${Y(1)} L ${X(0)} ${Y(0.82)} Q ${X(0.25)} ${Y(0.7)} ${X(0.5)} ${Y(0.8)} T ${X(1)} ${Y(0.76)} L ${X(1)} ${Y(1)} Z`, "#120C26");
      break;
    case "forest":
      sky("#FFD8A8", "#BFE3D0");
      c.drawCircle(X(0.7), Y(0.3), w * 0.1, paint("#FFF1C8", 0.9, { blur: w * 0.03 }));
      for (let layer = 0; layer < 3; layer++) {
        const col = ["#7FA88A", "#4F7F5E", "#2F5A3E"][layer]!;
        for (let i = 0; i < 7; i++) {
          const tx = X(hr(i * 3 + layer) * 1.1 - 0.05), tb = Y(0.72 + layer * 0.1), th = h * (0.32 + 0.18 * hr(i + layer * 7));
          hill(`M ${tx - w * 0.07} ${tb} L ${tx} ${tb - th} L ${tx + w * 0.07} ${tb} Z`, col);
        }
        c.drawRect(Skia.XYWHRect(x, Y(0.72 + layer * 0.1), w, h), paint(col));
      }
      break;
    case "sea":
      sky("#8FD3FF", "#E8F7FF");
      c.drawRect(Skia.XYWHRect(x, Y(0.55), w, h * 0.45), grad(0, Y(0.55), 0, Y(1), ["#2E8FC9", "#145A8A"]));
      for (let i = 0; i < 6; i++) c.drawLine(X(0.1 + hr(i) * 0.5), Y(0.62 + i * 0.06), X(0.2 + hr(i) * 0.5), Y(0.62 + i * 0.06), paint("#BFEAFF", 0.7, { stroke: Math.max(1, h * 0.012) }));
      hill(`M ${X(0.58)} ${Y(1)} L ${X(0.62)} ${Y(0.4)} L ${X(0.78)} ${Y(0.3)} L ${X(1)} ${Y(0.36)} L ${X(1)} ${Y(1)} Z`, "#6E5A4A");
      hill(`M ${X(0.62)} ${Y(0.4)} L ${X(0.78)} ${Y(0.3)} L ${X(1)} ${Y(0.36)} L ${X(1)} ${Y(0.42)} L ${X(0.64)} ${Y(0.45)} Z`, "#5E9A4A");
      c.drawCircle(X(0.25), Y(0.22), w * 0.07, paint("#FFF6D8"));
      break;
    case "mountains":
      sky("#B9D8FF", "#F2F6FF");
      hill(`M ${X(0)} ${Y(1)} L ${X(0.3)} ${Y(0.3)} L ${X(0.55)} ${Y(0.75)} L ${X(0.75)} ${Y(0.25)} L ${X(1)} ${Y(0.7)} L ${X(1)} ${Y(1)} Z`, "#5E6F94");
      hill(`M ${X(0.3)} ${Y(0.3)} L ${X(0.38)} ${Y(0.45)} L ${X(0.33)} ${Y(0.42)} L ${X(0.28)} ${Y(0.48)} L ${X(0.24)} ${Y(0.42)} Z`, "#FFFFFF");
      hill(`M ${X(0.75)} ${Y(0.25)} L ${X(0.83)} ${Y(0.4)} L ${X(0.77)} ${Y(0.37)} L ${X(0.72)} ${Y(0.43)} L ${X(0.68)} ${Y(0.36)} Z`, "#FFFFFF");
      hill(`M ${X(0)} ${Y(1)} L ${X(0)} ${Y(0.82)} Q ${X(0.4)} ${Y(0.7)} ${X(1)} ${Y(0.84)} L ${X(1)} ${Y(1)} Z`, "#3E6B4A");
      break;
    case "aurora":
      sky("#071428", "#123A4A");
      for (let i = 0; i < 3; i++) {
        const a = P(`M ${X(-0.1)} ${Y(0.35 + i * 0.08)} C ${X(0.3)} ${Y(0.05 + i * 0.1)} ${X(0.6)} ${Y(0.5 + i * 0.05)} ${X(1.1)} ${Y(0.2 + i * 0.08)}`);
        c.drawPath(a, paint(["#4FFFB0", "#7CF4FF", "#B983FF"][i]!, 0.55, { stroke: h * 0.08, blur: h * 0.03 }));
      }
      for (let i = 0; i < 14; i++) c.drawCircle(X(hr(i + 70)), Y(hr(i + 90) * 0.6), w * 0.006, paint("#FFFFFF", 0.8));
      hill(`M ${X(0)} ${Y(1)} L ${X(0)} ${Y(0.78)} L ${X(0.15)} ${Y(0.66)} L ${X(0.3)} ${Y(0.8)} L ${X(0.5)} ${Y(0.7)} L ${X(0.75)} ${Y(0.82)} L ${X(1)} ${Y(0.72)} L ${X(1)} ${Y(1)} Z`, "#08121E");
      break;
    case "waterfall":
      sky("#CFEFD8", "#E8FFF2");
      hill(`M ${X(0)} ${Y(0.2)} L ${X(0.38)} ${Y(0.25)} L ${X(0.4)} ${Y(1)} L ${X(0)} ${Y(1)} Z`, "#4A5E52");
      hill(`M ${X(0.6)} ${Y(0.25)} L ${X(1)} ${Y(0.18)} L ${X(1)} ${Y(1)} L ${X(0.6)} ${Y(1)} Z`, "#4A5E52");
      c.drawRect(Skia.XYWHRect(X(0.4), Y(0.25), w * 0.2, h * 0.6), grad(X(0.4), 0, X(0.6), 0, ["#BFEFFF", "#FFFFFF", "#9FDFFF"]));
      c.drawOval(Skia.XYWHRect(X(0.3), Y(0.8), w * 0.4, h * 0.14), paint("#FFFFFF", 0.8, { blur: h * 0.02 }));
      for (const [u, v] of [[0.1, 0.25], [0.25, 0.22], [0.75, 0.2], [0.9, 0.18]] as const) c.drawCircle(X(u), Y(v), w * 0.08, paint("#3F8A4E"));
      break;
    case "desert":
      sky("#FF8A5B", "#FFD9A0");
      c.drawCircle(X(0.5), Y(0.5), w * 0.14, paint("#FFF1C8", 0.95));
      hill(`M ${X(0)} ${Y(1)} L ${X(0)} ${Y(0.66)} Q ${X(0.3)} ${Y(0.5)} ${X(0.6)} ${Y(0.7)} L ${X(0.6)} ${Y(1)} Z`, "#E0955A");
      hill(`M ${X(0.3)} ${Y(1)} Q ${X(0.65)} ${Y(0.52)} ${X(1)} ${Y(0.68)} L ${X(1)} ${Y(1)} Z`, "#C9773E");
      break;
  }
}

function painting(c: SkCanvas, kind: string, r: { x: number; y: number; w: number; h: number }, u: number) {
  const fx = r.x + r.w * 0.06, fy = r.y + r.h * 0.06, fw = r.w * 0.88, fh = r.h * 0.84;
  c.drawRRect(rr(fx + 3, fy + 5, fw, fh, 4), paint("#000000", 0.3, { blur: 4 }));
  // Bevelled wooden frame.
  c.drawRRect(rr(fx, fy, fw, fh, 4), grad(fx, fy, fx + fw, fy + fh, ["#B07A48", "#6E4426"]));
  c.drawRRect(rr(fx + fw * 0.04, fy + fh * 0.04, fw * 0.92, fh * 0.92, 2), paint("#4A2C16"));
  const ix = fx + fw * 0.08, iy = fy + fh * 0.08, iw = fw * 0.84, ih = fh * 0.84;
  c.save();
  c.clipRect(Skia.XYWHRect(ix, iy, iw, ih), ClipOp.Intersect, true);
  drawLandscape(c, kind, ix, iy, iw, ih);
  // Glass reflection.
  c.drawPath(P(`M ${ix} ${iy} L ${ix + iw * 0.45} ${iy} L ${ix} ${iy + ih * 0.6} Z`), paint("#FFFFFF", 0.1));
  c.restore();
  c.drawRRect(rr(fx, fy, fw, fh, 4), paint("#2A170A", 1, { stroke: Math.max(1.2, u * 0.04) }));
  c.drawLine(fx + 3, fy + 2, fx + fw - 3, fy + 2, paint("#E0B07A", 0.8, { stroke: 1.2 }));
}

/** Draws one furniture item inside rect (x, y, w, h) — y/h are the footprint on the floor or wall cells. */
export function drawFurniture(c: SkCanvas, itemId: string, r: { x: number; y: number; w: number; h: number }, mirrored: boolean, variant: string | undefined, u: number) {
  const lw = Math.max(1.4, u * 0.05);
  c.save();
  if (mirrored) {
    c.translate(r.x * 2 + r.w, 0);
    c.scale(-1, 1);
  }
  const { x, y, w, h } = r;
  const base = y + h; // floor contact line
  const cx = x + w / 2;
  if (itemId.startsWith("furn_poster_")) {
    painting(c, itemId === "furn_poster_volcano" && variant === "night" ? "stars" : itemId.slice("furn_poster_".length), r, u);
    c.restore();
    return;
  }
  switch (itemId) {
    case "furn_bed_nest": {
      // Woven twig basket (seen slightly from above) with a quilt and a pillow.
      const bw = w * 0.96, bh = u * 1.25, bx = x + w * 0.02, top = base - bh;
      shadow(c, cx, base, bw * 0.52, u * 0.22);
      const bowl = `M ${bx} ${top + bh * 0.3} C ${bx} ${base + bh * 0.05} ${bx + bw} ${base + bh * 0.05} ${bx + bw} ${top + bh * 0.3} Z`;
      fillStroke(c, bowl, grad(0, top, 0, base, ["#8A5A32", "#4E2E16"]), lw);
      c.save();
      c.clipPath(P(bowl), ClipOp.Intersect, true);
      for (let i = 0; i < 9; i++) {
        const yy = top + bh * (0.36 + i * 0.075);
        c.drawPath(P(`M ${bx} ${yy} Q ${cx} ${yy + bh * 0.12} ${bx + bw} ${yy}`), paint(i % 2 ? "#A8743F" : "#6B4220", 0.9, { stroke: u * 0.07 }));
      }
      for (let i = 0; i < 14; i++) c.drawLine(bx + bw * (i / 14), top + bh * 0.3, bx + bw * (i / 14) + u * 0.1, base, paint("#3A2010", 0.35, { stroke: u * 0.025 }));
      c.restore();
      // Twigs sticking out of the rim.
      for (let i = 0; i < 7; i++) {
        const tx = bx + bw * (0.05 + i * 0.15), ty = top + bh * (0.3 + 0.05 * Math.sin(i));
        c.drawLine(tx, ty, tx + u * (hr(i) - 0.5) * 0.6, ty - u * (0.25 + hr(i + 4) * 0.3), paint("#5A3418", 1, { stroke: u * 0.05 }));
      }
      // Quilt (inside, seen from above) and pillow.
      const quilt = `M ${bx + bw * 0.06} ${top + bh * 0.3} C ${bx + bw * 0.1} ${top - bh * 0.05} ${bx + bw * 0.9} ${top - bh * 0.05} ${bx + bw * 0.94} ${top + bh * 0.3} C ${bx + bw * 0.7} ${top + bh * 0.42} ${bx + bw * 0.3} ${top + bh * 0.42} ${bx + bw * 0.06} ${top + bh * 0.3} Z`;
      fillStroke(c, quilt, grad(0, top, 0, top + bh * 0.4, ["#7FC4B8", "#3E8C88"]), lw * 0.8);
      for (let i = 1; i < 5; i++) c.drawLine(bx + bw * (0.1 + i * 0.16), top + bh * 0.02, bx + bw * (0.08 + i * 0.16), top + bh * 0.36, paint("#2E6E6A", 0.6, { stroke: lw * 0.6 }));
      fillStroke(c, `M ${bx + bw * 0.1} ${top + bh * 0.16} C ${bx + bw * 0.1} ${top - bh * 0.12} ${bx + bw * 0.36} ${top - bh * 0.12} ${bx + bw * 0.36} ${top + bh * 0.12} C ${bx + bw * 0.3} ${top + bh * 0.24} ${bx + bw * 0.14} ${top + bh * 0.26} ${bx + bw * 0.1} ${top + bh * 0.16} Z`, grad(0, top - bh * 0.1, 0, top + bh * 0.24, ["#FFF6E6", "#E8D2B4"]), lw * 0.8);
      c.drawPath(P(`M ${bx + bw * 0.02} ${top + bh * 0.3} Q ${cx} ${top + bh * 0.46} ${bx + bw * 0.98} ${top + bh * 0.3}`), paint("#C8955C", 0.9, { stroke: u * 0.06 }));
      break;
    }
    case "furn_rug_round": {
      c.drawOval(Skia.XYWHRect(x, y + h * 0.1, w, h * 0.8), paint("#000000", 0.15, { blur: 3 }));
      const rings = ["#B5532F", "#E3A04A", "#7C9A5A", "#E8D2A8", "#B5532F", "#E3A04A"];
      rings.forEach((col, i) => {
        const k = 1 - i * 0.15;
        c.drawOval(Skia.XYWHRect(cx - (w / 2) * k, y + h * 0.5 - h * 0.4 * k, w * k, h * 0.8 * k), paint(col));
        c.drawOval(Skia.XYWHRect(cx - (w / 2) * k, y + h * 0.5 - h * 0.4 * k, w * k, h * 0.8 * k), paint("#5A2A14", 0.35, { stroke: 1 }));
      });
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const ex = cx + Math.cos(a) * w * 0.5, ey = y + h * 0.5 + Math.sin(a) * h * 0.4;
        c.drawLine(ex, ey, ex + Math.cos(a) * u * 0.12, ey + Math.sin(a) * u * 0.08, paint("#E8D2A8", 0.9, { stroke: 1.2 }));
      }
      break;
    }
    case "furn_lamp_mushroom": {
      const lh = u * 1.9, capW = w * 1.25, capY = base - lh * 0.62;
      shadow(c, cx, base, w * 0.35, u * 0.12);
      c.drawCircle(cx, capY + u * 0.2, u * 1.2, paint("#FFC870", 0.32, { blur: u * 0.8 }));
      // Stem with a flared base.
      fillStroke(c, `M ${cx - w * 0.15} ${capY} C ${cx - w * 0.2} ${base - lh * 0.3} ${cx - w * 0.28} ${base - u * 0.12} ${cx - w * 0.3} ${base} L ${cx + w * 0.3} ${base} C ${cx + w * 0.28} ${base - u * 0.12} ${cx + w * 0.2} ${base - lh * 0.3} ${cx + w * 0.15} ${capY} Z`, grad(cx - w * 0.2, 0, cx + w * 0.2, 0, ["#E9DCC4", "#FFF6E6", "#CDBB9C"]), lw);
      // Gills under the cap (lit).
      c.drawOval(Skia.XYWHRect(cx - capW / 2, capY - u * 0.12, capW, u * 0.3), paint("#FFE2A8"));
      for (let i = -5; i <= 5; i++) c.drawLine(cx, capY, cx + (i / 5) * capW * 0.48, capY + u * 0.1, paint("#D9A868", 0.8, { stroke: 1 }));
      // Cap.
      const cap = `M ${cx - capW / 2} ${capY} C ${cx - capW / 2} ${capY - lh * 0.62} ${cx + capW / 2} ${capY - lh * 0.62} ${cx + capW / 2} ${capY} C ${cx + capW * 0.3} ${capY + u * 0.08} ${cx - capW * 0.3} ${capY + u * 0.08} ${cx - capW / 2} ${capY} Z`;
      fillStroke(c, cap, grad(0, capY - lh * 0.4, 0, capY, ["#E8573E", "#A8281E"]), lw);
      for (const [dx, dy, rad] of [[-0.28, -0.12, 0.09], [0.05, -0.22, 0.11], [0.3, -0.1, 0.07], [-0.08, -0.07, 0.05], [0.18, -0.3, 0.05]] as const) {
        c.drawOval(Skia.XYWHRect(cx + capW * dx - capW * rad, capY + dy * lh * 0.9 - capW * rad * 0.7, capW * rad * 2, capW * rad * 1.4), paint("#FFF4E2", 0.95));
      }
      c.drawPath(P(`M ${cx - capW * 0.35} ${capY - lh * 0.18} Q ${cx - capW * 0.2} ${capY - lh * 0.36} ${cx} ${capY - lh * 0.38}`), paint("#FFFFFF", 0.4, { stroke: u * 0.06 }));
      break;
    }
    case "furn_chair_wood": {
      // 3/4 view: seat as a trapezoid, four legs with stretchers, backrest with slats.
      const sh = u * 0.95, seatY = base - sh, sw = w * 0.72, sx = x + w * 0.14, depth = u * 0.28;
      shadow(c, cx, base, w * 0.4, u * 0.14);
      const wood = grad(0, seatY - u, 0, base, ["#C68A55", "#8A5530"]);
      for (const lx of [sx + sw * 0.08, sx + sw * 0.92]) c.drawRRect(rr(lx - u * 0.05, seatY - depth, u * 0.1, sh + depth - u * 0.05, u * 0.03), paint("#6E4222"));
      // Backrest (behind the seat).
      const bTop = seatY - depth - u * 0.95;
      for (const lx of [sx + sw * 0.06, sx + sw * 0.94]) fillStroke(c, `M ${lx - u * 0.06} ${seatY - depth} L ${lx - u * 0.04} ${bTop} L ${lx + u * 0.06} ${bTop} L ${lx + u * 0.06} ${seatY - depth} Z`, wood, lw * 0.8);
      fillStroke(c, `M ${sx} ${bTop - u * 0.04} Q ${cx} ${bTop - u * 0.16} ${sx + sw} ${bTop - u * 0.04} L ${sx + sw} ${bTop + u * 0.16} Q ${cx} ${bTop + u * 0.04} ${sx} ${bTop + u * 0.16} Z`, wood, lw * 0.8);
      for (let i = 1; i <= 3; i++) c.drawRRect(rr(sx + sw * (i / 4) - u * 0.04, bTop + u * 0.14, u * 0.08, u * 0.68, u * 0.03), paint("#A86E40"));
      // Seat.
      fillStroke(c, `M ${sx} ${seatY} L ${sx + sw * 0.1} ${seatY - depth} L ${sx + sw * 1.0} ${seatY - depth} L ${sx + sw} ${seatY} Z`, grad(0, seatY - depth, 0, seatY, ["#D99A62", "#B57846"]), lw);
      c.drawRect(Skia.XYWHRect(sx, seatY, sw, u * 0.12), paint("#8A5530"));
      c.drawRect(Skia.XYWHRect(sx, seatY, sw, u * 0.12), paint(INK, 1, { stroke: lw * 0.8 }));
      // Front legs + stretcher.
      for (const lx of [sx + sw * 0.04, sx + sw * 0.96]) fillStroke(c, `M ${lx - u * 0.06} ${seatY + u * 0.1} L ${lx - u * 0.05} ${base} L ${lx + u * 0.05} ${base} L ${lx + u * 0.06} ${seatY + u * 0.1} Z`, wood, lw * 0.8);
      c.drawLine(sx + sw * 0.04, base - sh * 0.35, sx + sw * 0.96, base - sh * 0.35, paint("#6E4222", 1, { stroke: u * 0.06 }));
      break;
    }
    case "furn_plant_fern": {
      const ph = u * 2.1, potH = u * 0.75, potTop = base - potH;
      shadow(c, cx, base, w * 0.3, u * 0.12);
      // Fronds: arching stems with leaflets.
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.38;
        const len = ph * (0.75 + 0.2 * hr(i));
        const ex = cx + Math.cos(a) * len * 0.75, ey = potTop + Math.sin(a) * len * 0.85;
        const mx = cx + Math.cos(a) * len * 0.3, my = potTop - len * 0.55;
        const col = i % 2 ? "#4F8A3E" : "#6CAA4A";
        c.drawPath(P(`M ${cx} ${potTop} Q ${mx} ${my} ${ex} ${ey}`), paint("#3E6E2E", 1, { stroke: u * 0.04 }));
        for (let k = 1; k <= 7; k++) {
          const t = k / 8;
          const px = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * mx + t * t * ex;
          const py = (1 - t) * (1 - t) * potTop + 2 * (1 - t) * t * my + t * t * ey;
          const sz = u * 0.2 * (1 - t * 0.6);
          c.drawOval(Skia.XYWHRect(px - sz, py - sz * 0.35, sz * 2, sz * 0.7), paint(col));
        }
      }
      // Terracotta pot with rim and soil.
      fillStroke(c, `M ${cx - w * 0.3} ${potTop + u * 0.1} L ${cx - w * 0.22} ${base} L ${cx + w * 0.22} ${base} L ${cx + w * 0.3} ${potTop + u * 0.1} Z`, grad(cx - w * 0.3, 0, cx + w * 0.3, 0, ["#C8653A", "#E08A5A", "#A84E2A"]), lw);
      c.drawOval(Skia.XYWHRect(cx - w * 0.3, potTop - u * 0.05, w * 0.6, u * 0.18), paint("#4A2E1A"));
      fillStroke(c, `M ${cx - w * 0.34} ${potTop} L ${cx + w * 0.34} ${potTop} L ${cx + w * 0.33} ${potTop + u * 0.16} L ${cx - w * 0.33} ${potTop + u * 0.16} Z`, paint("#D97A4A"), lw * 0.8);
      break;
    }
    case "furn_sofa_cushion": {
      // Log-frame sofa with fabric cushions.
      const sh = u * 1.35, top = base - sh;
      shadow(c, cx, base, w * 0.5, u * 0.2);
      fillStroke(c, `M ${x + w * 0.06} ${top + sh * 0.1} Q ${cx} ${top - sh * 0.12} ${x + w * 0.94} ${top + sh * 0.1} L ${x + w * 0.94} ${top + sh * 0.6} L ${x + w * 0.06} ${top + sh * 0.6} Z`, grad(0, top, 0, top + sh * 0.6, ["#A87FCF", "#6E4FA0"]), lw);
      for (let i = 0; i < 3; i++) fillStroke(c, `M ${x + w * (0.1 + i * 0.27)} ${top + sh * 0.18} q ${w * 0.13} ${-sh * 0.12} ${w * 0.26} 0 l 0 ${sh * 0.38} q ${-w * 0.13} ${sh * 0.06} ${-w * 0.26} 0 Z`, grad(0, top, 0, top + sh * 0.6, ["#C9A8EE", "#9A78CF"]), lw * 0.7);
      fillStroke(c, `M ${x + w * 0.08} ${top + sh * 0.55} L ${x + w * 0.92} ${top + sh * 0.55} L ${x + w * 0.92} ${top + sh * 0.78} L ${x + w * 0.08} ${top + sh * 0.78} Z`, grad(0, top + sh * 0.55, 0, top + sh * 0.78, ["#B994E0", "#8A64C0"]), lw);
      // Log base and arm logs with end rings.
      fillStroke(c, `M ${x + w * 0.04} ${top + sh * 0.76} L ${x + w * 0.96} ${top + sh * 0.76} L ${x + w * 0.96} ${base - sh * 0.04} L ${x + w * 0.04} ${base - sh * 0.04} Z`, grad(0, top + sh * 0.76, 0, base, ["#9A6438", "#6A3E1E"]), lw);
      for (const ax of [x, x + w * 0.9]) {
        fillStroke(c, `M ${ax} ${top + sh * 0.35} L ${ax + w * 0.1} ${top + sh * 0.35} L ${ax + w * 0.1} ${base} L ${ax} ${base} Z`, grad(ax, 0, ax + w * 0.1, 0, ["#7A4A26", "#A8743F", "#6A3E1E"]), lw);
        c.drawOval(Skia.XYWHRect(ax, top + sh * 0.3, w * 0.1, sh * 0.12), paint("#E3B47A"));
        c.drawOval(Skia.XYWHRect(ax + w * 0.025, top + sh * 0.325, w * 0.05, sh * 0.06), paint("#B07A48", 1, { stroke: 1 }));
      }
      break;
    }
    case "furn_brazier": {
      const bh = u * 1.7, bowlY = base - bh * 0.62;
      shadow(c, cx, base, w * 0.35, u * 0.12);
      c.drawCircle(cx, bowlY - u * 0.3, u * 1.1, paint("#FF8A3D", 0.38, { blur: u * 0.6 }));
      for (const dx of [-0.3, 0, 0.3]) c.drawLine(cx + w * dx * 0.5, bowlY, cx + w * dx, base, paint("#5A3A22", 1, { stroke: u * 0.08 }));
      fillStroke(c, `M ${cx - w * 0.42} ${bowlY - u * 0.05} C ${cx - w * 0.36} ${bowlY + u * 0.5} ${cx + w * 0.36} ${bowlY + u * 0.5} ${cx + w * 0.42} ${bowlY - u * 0.05} Z`, grad(cx - w * 0.4, 0, cx + w * 0.4, 0, ["#9C5A2A", "#E0A060", "#8A4A20"]), lw);
      for (let i = 0; i < 5; i++) c.drawCircle(cx + w * (i - 2) * 0.14, bowlY - u * 0.02, u * 0.1, paint(i % 2 ? "#FF5A2A" : "#3A1A10"));
      const fl = `M ${cx - w * 0.25} ${bowlY} C ${cx - w * 0.3} ${bowlY - u * 0.6} ${cx - w * 0.05} ${bowlY - u * 0.6} ${cx} ${bowlY - u * 1.1} C ${cx + w * 0.08} ${bowlY - u * 0.6} ${cx + w * 0.32} ${bowlY - u * 0.55} ${cx + w * 0.25} ${bowlY} Z`;
      c.drawPath(P(fl), grad(0, bowlY - u * 1.1, 0, bowlY, ["#FFE08A", "#FF8A3D"]));
      break;
    }
    case "gym_dumbbells": {
      // Low wooden rack with two dumbbells.
      const rh = u * 0.55, top = base - rh;
      shadow(c, cx, base, w * 0.48, u * 0.14);
      fillStroke(c, `M ${x + w * 0.04} ${top} L ${x + w * 0.96} ${top} L ${x + w * 0.96} ${top + u * 0.12} L ${x + w * 0.04} ${top + u * 0.12} Z`, grad(0, top, 0, top + u * 0.12, ["#C68A55", "#8A5530"]), lw);
      for (const lx of [0.08, 0.88]) c.drawRect(Skia.XYWHRect(x + w * lx, top + u * 0.12, w * 0.05, rh - u * 0.12), paint("#6E4222"));
      for (const dx of [0.28, 0.72]) {
        const db = cx + w * (dx - 0.5), dy = top - u * 0.16;
        c.drawRRect(rr(db - w * 0.16, dy - u * 0.03, w * 0.32, u * 0.06, u * 0.02), paint("#B8B4C8"));
        for (const sx of [-0.15, 0.1]) fillStroke(c, `M ${db + w * sx} ${dy - u * 0.17} L ${db + w * sx + w * 0.05} ${dy - u * 0.17} L ${db + w * sx + w * 0.05} ${dy + u * 0.17} L ${db + w * sx} ${dy + u * 0.17} Z`, grad(0, dy - u * 0.17, 0, dy + u * 0.17, ["#5A5670", "#2E2A3E"]), lw * 0.7);
      }
      break;
    }
    case "study_desk": {
      const top = base - u * 1.05;
      shadow(c, cx, base, w * 0.48, u * 0.16);
      const wood = grad(0, top, 0, base, ["#B07A48", "#7A4A2A"]);
      fillStroke(c, `M ${x + w * 0.08} ${top + u * 0.14} L ${x + w * 0.14} ${top + u * 0.14} L ${x + w * 0.13} ${base} L ${x + w * 0.09} ${base} Z`, wood, lw * 0.8);
      fillStroke(c, `M ${x + w * 0.86} ${top + u * 0.14} L ${x + w * 0.92} ${top + u * 0.14} L ${x + w * 0.91} ${base} L ${x + w * 0.87} ${base} Z`, wood, lw * 0.8);
      fillStroke(c, `M ${x + w * 0.55} ${top + u * 0.16} L ${x + w * 0.85} ${top + u * 0.16} L ${x + w * 0.85} ${top + u * 0.6} L ${x + w * 0.55} ${top + u * 0.6} Z`, paint("#9A6438"), lw * 0.8);
      c.drawCircle(x + w * 0.7, top + u * 0.38, u * 0.04, paint("#E3B47A"));
      fillStroke(c, `M ${x + w * 0.02} ${top + u * 0.02} L ${x + w * 0.06} ${top - u * 0.14} L ${x + w * 0.98} ${top - u * 0.14} L ${x + w * 0.98} ${top + u * 0.02} Z`, grad(0, top - u * 0.14, 0, top, ["#D9A062", "#B07A48"]), lw);
      c.drawRect(Skia.XYWHRect(x + w * 0.02, top + u * 0.02, w * 0.96, u * 0.12), paint("#8A5530"));
      const bx = x + w * 0.18, by = top - u * 0.24;
      fillStroke(c, `M ${bx} ${by} Q ${bx + w * 0.09} ${by - u * 0.06} ${bx + w * 0.17} ${by + u * 0.02} Q ${bx + w * 0.25} ${by - u * 0.06} ${bx + w * 0.34} ${by} L ${bx + w * 0.34} ${by + u * 0.1} L ${bx} ${by + u * 0.1} Z`, paint("#FFF6E6"), lw * 0.6);
      const jx = x + w * 0.62, jy = top - u * 0.55;
      fillStroke(c, `M ${jx} ${jy + u * 0.08} L ${jx + w * 0.12} ${jy + u * 0.08} L ${jx + w * 0.12} ${jy + u * 0.42} L ${jx} ${jy + u * 0.42} Z`, paint("#BFEFFF", 0.5), lw * 0.6);
      c.drawRect(Skia.XYWHRect(jx - w * 0.005, jy, w * 0.13, u * 0.08), paint("#9A6438"));
      for (const k of [0.2, 0.32]) c.drawCircle(jx + w * 0.06, jy + u * k + u * 0.1, u * 0.05, paint("#FF8A00", 0.95, { blur: 1 }));
      const lx = x + w * 0.86;
      c.drawLine(lx, top - u * 0.14, lx, top - u * 0.62, paint("#4A4558", 1, { stroke: lw * 0.8 }));
      c.drawCircle(lx - w * 0.03, top - u * 0.64, u * 0.1, paint("#FFD166"));
      c.drawCircle(lx - w * 0.03, top - u * 0.64, u * 0.3, paint("#FFD166", 0.25, { blur: 8 }));
      break;
    }
    case "furn_litter_moss": {
      // Low woven tray full of moss.
      const th = u * 0.55, top = base - th;
      shadow(c, cx, base, w * 0.5, u * 0.14);
      fillStroke(c, `M ${x + w * 0.04} ${top} L ${x + w * 0.96} ${top} L ${x + w * 0.88} ${base} L ${x + w * 0.12} ${base} Z`, grad(0, top, 0, base, ["#9A6A3A", "#5A3418"]), lw);
      for (let i = 0; i < 4; i++) c.drawLine(x + w * 0.08, top + th * (0.25 + i * 0.2), x + w * 0.92, top + th * (0.25 + i * 0.2), paint("#3A2010", 0.4, { stroke: u * 0.03 }));
      for (let i = 0; i < 9; i++) c.drawCircle(x + w * (0.14 + i * 0.09), top - u * 0.02 + Math.sin(i * 2.1) * u * 0.04, u * 0.11, paint(i % 2 ? "#6E9A3E" : "#4E7A2E"));
      break;
    }
    case "furn_toy_ball": {
      const r0 = Math.min(w, u) * 0.32, by = base - r0;
      shadow(c, cx, base, r0 * 1.1, u * 0.1);
      c.drawCircle(cx, by, r0, grad(cx - r0, by - r0, cx + r0, by + r0, ["#E8C07A", "#9A6A3A"]));
      c.save();
      c.clipPath(P(`M ${cx - r0} ${by} A ${r0} ${r0} 0 1 0 ${cx + r0} ${by} A ${r0} ${r0} 0 1 0 ${cx - r0} ${by} Z`), ClipOp.Intersect, true);
      for (let i = -3; i <= 3; i++) {
        c.drawLine(cx + i * r0 * 0.35 - r0, by - r0, cx + i * r0 * 0.35 + r0, by + r0, paint("#6B4220", 0.7, { stroke: u * 0.04 }));
        c.drawLine(cx + i * r0 * 0.35 + r0, by - r0, cx + i * r0 * 0.35 - r0, by + r0, paint("#6B4220", 0.5, { stroke: u * 0.03 }));
      }
      c.restore();
      c.drawCircle(cx, by, r0, paint("#3A2010", 1, { stroke: lw }));
      break;
    }
    case "furn_toy_spinner": {
      const sh = u * 0.9, top = base - sh;
      shadow(c, cx, base, w * 0.25, u * 0.08);
      fillStroke(c, `M ${cx} ${base} L ${cx - w * 0.32} ${top + sh * 0.45} C ${cx - w * 0.34} ${top + sh * 0.1} ${cx + w * 0.34} ${top + sh * 0.1} ${cx + w * 0.32} ${top + sh * 0.45} Z`, grad(0, top, 0, base, ["#C88A4A", "#7A4A22"]), lw);
      fillStroke(c, `M ${cx - w * 0.3} ${top + sh * 0.3} C ${cx - w * 0.3} ${top - sh * 0.05} ${cx + w * 0.3} ${top - sh * 0.05} ${cx + w * 0.3} ${top + sh * 0.3} Z`, grad(0, top, 0, top + sh * 0.3, ["#8A5A32", "#5A3418"]), lw);
      c.drawLine(cx, top + sh * 0.05, cx, top - sh * 0.18, paint("#4E2E16", 1, { stroke: lw * 1.4 }));
      break;
    }
    case "furn_stove_clay": {
      const sh = u * 1.35, top = base - sh;
      shadow(c, cx, base, w * 0.5, u * 0.18);
      fillStroke(c, `M ${x + w * 0.06} ${base} L ${x + w * 0.1} ${top + sh * 0.2} Q ${cx} ${top - sh * 0.05} ${x + w * 0.9} ${top + sh * 0.2} L ${x + w * 0.94} ${base} Z`, grad(0, top, 0, base, ["#C27A4E", "#7A3E22"]), lw);
      fillStroke(c, `M ${cx - w * 0.16} ${base} L ${cx - w * 0.16} ${top + sh * 0.6} Q ${cx} ${top + sh * 0.42} ${cx + w * 0.16} ${top + sh * 0.6} L ${cx + w * 0.16} ${base} Z`, paint("#2A120A"), lw);
      c.drawCircle(cx, base - sh * 0.15, u * 0.22, paint("#FF8A2A", 0.9, { blur: 4 }));
      c.drawCircle(cx, base - sh * 0.12, u * 0.12, paint("#FFD166"));
      // Pot on top.
      fillStroke(c, `M ${cx - w * 0.2} ${top + sh * 0.12} L ${cx + w * 0.2} ${top + sh * 0.12} L ${cx + w * 0.16} ${top - sh * 0.22} L ${cx - w * 0.16} ${top - sh * 0.22} Z`, grad(0, top - sh * 0.2, 0, top, ["#5C6470", "#2E333B"]), lw);
      break;
    }
    case "furn_tub_wood": {
      const th = u * 1.05, top = base - th;
      shadow(c, cx, base, w * 0.5, u * 0.16);
      const tub = `M ${x + w * 0.04} ${top} L ${x + w * 0.96} ${top} L ${x + w * 0.88} ${base} L ${x + w * 0.12} ${base} Z`;
      fillStroke(c, tub, grad(0, top, 0, base, ["#B07A44", "#6B4220"]), lw);
      for (let i = 1; i < 7; i++) c.drawLine(x + w * (0.04 + i * 0.13), top, x + w * (0.12 + i * 0.108), base, paint("#4E2E16", 0.5, { stroke: u * 0.03 }));
      for (const k of [0.3, 0.75]) c.drawLine(x + w * (0.04 + 0.08 * k), top + th * k, x + w * (0.96 - 0.08 * k), top + th * k, paint("#3E3A40", 1, { stroke: u * 0.08 }));
      c.drawOval(Skia.XYWHRect(x + w * 0.08, top - u * 0.12, w * 0.84, u * 0.26), paint("#7FD0E8", 0.9));
      for (let i = 0; i < 5; i++) c.drawCircle(x + w * (0.2 + i * 0.15), top - u * 0.08, u * (0.08 + 0.04 * (i % 2)), paint("#FFFFFF", 0.85));
      break;
    }
    default:
      outlinedRRect(c, x, base - u, w, u, u * 0.1, paint("#CCCCCC"), lw);
  }
  c.restore();
}

// ── Nest-house walls and floors (editable finishes) ──────────────────────────
export function drawWall(c: SkCanvas, kind: string, w: number, top: number, bottom: number) {
  const H = bottom - top;
  switch (kind) {
    case "wall_logs": {
      const n = 7, lh = H / n;
      for (let i = 0; i < n; i++) {
        const y0 = top + i * lh;
        c.drawRRect(rr(-10, y0 + 1, w + 20, lh - 2, lh / 2), grad(0, y0, 0, y0 + lh, ["#A8743F", "#7A4A26", "#5A3418"]));
        c.drawLine(0, y0 + lh * 0.35, w, y0 + lh * 0.35, paint("#C8955C", 0.4, { stroke: 1.5 }));
        for (const ex of [6, w - 6]) {
          c.drawOval(Skia.XYWHRect(ex - lh * 0.45, y0 + 2, lh * 0.9, lh - 4), paint("#E3B47A"));
          c.drawOval(Skia.XYWHRect(ex - lh * 0.25, y0 + lh * 0.25, lh * 0.5, lh * 0.5), paint("#B07A48", 1, { stroke: 1 }));
        }
      }
      break;
    }
    case "wall_moss": {
      c.drawRect(Skia.XYWHRect(0, top, w, H), paint("#4A4E5A"));
      const rows = 6, rh = H / rows;
      for (let r = 0; r < rows; r++) {
        let xx = -hr(r) * 40;
        while (xx < w) {
          const bw = 40 + hr(r * 13 + xx) * 40;
          c.drawRRect(rr(xx + 2, top + r * rh + 2, bw - 4, rh - 4, 8), grad(0, top + r * rh, 0, top + (r + 1) * rh, ["#8A8E9A", "#5E6270"]));
          if (hr(xx + r) > 0.45) c.drawOval(Skia.XYWHRect(xx + 4, top + r * rh, bw * 0.7, rh * 0.35), paint("#5E9A4A", 0.9));
          xx += bw;
        }
      }
      break;
    }
    case "wall_leaves": {
      c.drawRect(Skia.XYWHRect(0, top, w, H), grad(0, top, 0, bottom, ["#F2E2C4", "#E3CBA2"]));
      for (let i = 0; i < 60; i++) {
        const lx = hr(i) * w, ly = top + hr(i + 100) * H, s = 6 + hr(i + 7) * 7, a = hr(i + 3) * 6.28;
        c.save();
        c.translate(lx, ly);
        c.rotate((a * 180) / Math.PI, 0, 0);
        c.drawPath(P(`M 0 ${-s} C ${s * 0.7} ${-s * 0.4} ${s * 0.7} ${s * 0.4} 0 ${s} C ${-s * 0.7} ${s * 0.4} ${-s * 0.7} ${-s * 0.4} 0 ${-s} Z`), paint(["#D9733A", "#C9A03A", "#8AA04A", "#B5452E"][i % 4]!, 0.75));
        c.drawLine(0, -s, 0, s, paint("#7A4A26", 0.5, { stroke: 0.8 }));
        c.restore();
      }
      break;
    }
    case "wall_treeheart": {
      c.drawRect(Skia.XYWHRect(0, top, w, H), grad(0, top, 0, bottom, ["#8A5530", "#5A3418"]));
      for (let i = 0; i < 18; i++) {
        const gx = (i / 18) * w + hr(i) * 10;
        c.drawPath(P(`M ${gx} ${top} C ${gx + 14} ${top + H * 0.3} ${gx - 14} ${top + H * 0.6} ${gx + 6} ${bottom}`), paint("#3E2210", 0.35, { stroke: 1.6 }));
      }
      for (let i = 0; i < 4; i++) c.drawOval(Skia.XYWHRect(hr(i + 30) * w, top + hr(i + 40) * H, 26, 40), paint("#3E2210", 0.4, { stroke: 2 }));
      for (let i = 0; i < 16; i++) c.drawCircle(hr(i + 60) * w, top + hr(i + 80) * H, 2.2, paint("#FFE88A", 0.9, { blur: 2 }));
      break;
    }
    default: {
      // wall_woven: interlaced twigs, like the inside of a nest.
      c.drawRect(Skia.XYWHRect(0, top, w, H), grad(0, top, 0, bottom, ["#6B4426", "#4A2C16"]));
      const n = 16;
      for (let i = 0; i < n; i++) {
        const yy = top + (i + 0.5) * (H / n);
        const amp = H / n * 0.35;
        let d = `M -10 ${yy}`;
        for (let k = 0; k <= 12; k++) d += ` Q ${(k + 0.5) * (w / 12)} ${yy + (k % 2 ? amp : -amp) * (i % 2 ? 1 : -1)} ${(k + 1) * (w / 12)} ${yy}`;
        c.drawPath(P(d), paint(i % 3 === 0 ? "#B07A48" : i % 3 === 1 ? "#8A5A32" : "#9A6A3C", 1, { stroke: H / n * 0.75 }));
        c.drawPath(P(d), paint("#D9A868", 0.25, { stroke: 1.2 }));
      }
      for (let i = 0; i < 14; i++) {
        const lx = hr(i + 5) * w, ly = top + hr(i + 25) * H;
        c.drawPath(P(`M ${lx} ${ly} c 6 -6 14 -6 18 0 c -6 6 -14 6 -18 0 Z`), paint(i % 2 ? "#7FA84A" : "#5E8A3A", 0.9));
      }
    }
  }
}

export function drawFloor(c: SkCanvas, kind: string, w: number, top: number, bottom: number) {
  const H = bottom - top;
  switch (kind) {
    case "floor_moss":
      c.drawRect(Skia.XYWHRect(0, top, w, H), grad(0, top, 0, bottom, ["#5E8A3A", "#3E6B2A"]));
      for (let i = 0; i < 160; i++) c.drawCircle(hr(i) * w, top + hr(i + 300) * H, 1.5 + hr(i + 9) * 3, paint(i % 3 ? "#7FA84A" : "#4E7A30", 0.8));
      for (let i = 0; i < 10; i++) {
        const cx = hr(i + 50) * w, cy = top + hr(i + 70) * H;
        for (let k = 0; k < 3; k++) c.drawCircle(cx + Math.cos(k * 2.1) * 4, cy + Math.sin(k * 2.1) * 4, 3.5, paint("#9BC85A"));
      }
      break;
    case "floor_stone":
      c.drawRect(Skia.XYWHRect(0, top, w, H), paint("#5A4E44"));
      for (let i = 0; i < 70; i++) {
        const sx = hr(i) * w, sy = top + hr(i + 200) * H, sr = 10 + hr(i + 5) * 16;
        c.drawOval(Skia.XYWHRect(sx - sr, sy - sr * 0.45, sr * 2, sr * 0.9), grad(0, sy - sr * 0.45, 0, sy + sr * 0.45, ["#B8AE9E", "#7E7466"]));
      }
      break;
    case "floor_rings": {
      c.drawRect(Skia.XYWHRect(0, top, w, H), paint("#4A2C16"));
      for (let i = 0; i < 26; i++) {
        const sx = hr(i) * w, sy = top + hr(i + 120) * H, sr = 16 + hr(i + 3) * 18;
        c.drawOval(Skia.XYWHRect(sx - sr, sy - sr * 0.5, sr * 2, sr), paint("#D9A868"));
        for (let k = 1; k < 5; k++) c.drawOval(Skia.XYWHRect(sx - sr * (1 - k * 0.2), sy - sr * 0.5 * (1 - k * 0.2), sr * 2 * (1 - k * 0.2), sr * (1 - k * 0.2)), paint("#9A6438", 0.7, { stroke: 1 }));
        c.drawOval(Skia.XYWHRect(sx - sr, sy - sr * 0.5, sr * 2, sr), paint("#5A3418", 1, { stroke: 2 }));
      }
      break;
    }
    default: {
      // floor_planks: warm boards with staggered joints and grain.
      c.drawRect(Skia.XYWHRect(0, top, w, H), grad(0, top, 0, bottom, ["#B07A48", "#8A5530"]));
      const rows = 7, rh = H / rows;
      for (let r = 0; r < rows; r++) {
        const y0 = top + r * rh;
        c.drawRect(Skia.XYWHRect(0, y0, w, rh), paint(r % 2 ? "#A06C3E" : "#B57E4A", 0.6));
        c.drawLine(0, y0, w, y0, paint("#5A3418", 0.6, { stroke: 1.5 }));
        for (let k = 0; k < 4; k++) {
          const jx = ((k + (r % 2) * 0.5) / 4) * w + hr(r * 7 + k) * 30;
          c.drawLine(jx, y0, jx, y0 + rh, paint("#5A3418", 0.5, { stroke: 1.2 }));
        }
        c.drawLine(0, y0 + rh * 0.5, w, y0 + rh * 0.5 + 2, paint("#7A4A26", 0.18, { stroke: 1 }));
      }
    }
  }
}

export function buildRoomPicture(room: RoomLayout, g: RoomGeom, opts: { night: boolean; lightsOn: boolean; hidePlacement?: string }): SkPicture {
  return createPicture((c) => {
    const { w, h } = g;
    const u = g.floorCellH;
    drawWall(c, room.finishes.wallpaper ?? "wall_woven", w, 0, g.wallBottom);
    // Warm light pooling down the wall.
    c.drawOval(Skia.XYWHRect(-w * 0.2, g.wallBottom - h * 0.2, w * 1.4, h * 0.4), paint("#FFB25E", 0.12, { blur: 40 }));
    // Round window with the forest outside.
    const win = room.windowCells;
    const wx = g.wallX0 + win.x * g.wallCell, wy = g.wallTop + win.y * g.wallCell, ww = win.w * g.wallCell, wh = win.h * g.wallCell;
    const wcx = wx + ww / 2, wcy = wy + wh / 2, wr = Math.min(ww, wh) / 2;
    c.drawCircle(wcx, wcy, wr + 9, grad(0, wcy - wr, 0, wcy + wr, ["#9A6438", "#5A3418"]));
    c.save();
    c.clipPath(P(`M ${wcx - wr} ${wcy} A ${wr} ${wr} 0 1 0 ${wcx + wr} ${wcy} A ${wr} ${wr} 0 1 0 ${wcx - wr} ${wcy} Z`), ClipOp.Intersect, true);
    drawLandscape(c, opts.night ? "stars" : "forest", wcx - wr, wcy - wr, wr * 2, wr * 2);
    if (opts.night) for (let i = 0; i < 8; i++) c.drawCircle(wcx - wr + hr(i + 11) * wr * 2, wcy + hr(i + 33) * wr, 2, paint("#E8FF8A", 0.9, { blur: 2 }));
    c.restore();
    c.drawLine(wcx - wr, wcy, wcx + wr, wcy, paint("#5A3418", 1, { stroke: 5 }));
    c.drawLine(wcx, wcy - wr, wcx, wcy + wr, paint("#5A3418", 1, { stroke: 5 }));
    c.drawCircle(wcx, wcy, wr + 9, paint("#2A170A", 1, { stroke: 3 }));
    c.drawCircle(wcx, wcy, wr, paint("#2A170A", 1, { stroke: 2 }));
    // Window sill with a little vine.
    c.drawRRect(rr(wcx - wr * 0.8, wcy + wr + 6, wr * 1.6, 10, 4), paint("#8A5530"));
    for (let i = 0; i < 6; i++) c.drawOval(Skia.XYWHRect(wcx - wr * 0.7 + i * wr * 0.28, wcy + wr + 2 + (i % 2) * 6, 12, 7), paint("#5E8A3A"));
    // Floor.
    drawFloor(c, room.finishes.flooring, w, g.floorTop, h);
    // Skirting made of roots.
    c.drawRect(Skia.XYWHRect(0, g.wallBottom - 10, w, 12), grad(0, g.wallBottom - 10, 0, g.wallBottom + 2, ["#7A4A26", "#4A2C16"]));
    for (let i = 0; i < 9; i++) {
      const rx = hr(i + 400) * w;
      c.drawPath(P(`M ${rx} ${g.wallBottom - 6} C ${rx + 20} ${g.wallBottom + 4} ${rx + 30} ${g.wallBottom + 14} ${rx + 50} ${g.wallBottom + 18}`), paint("#5A3418", 0.9, { stroke: 5 }));
    }
    // Nest-house frame: curved trunk walls and a twig ceiling arch.
    const frame = grad(0, 0, 0, h, ["#5A3418", "#3A1F0C"]);
    c.drawPath(P(`M 0 0 L ${w * 0.16} 0 C ${w * 0.06} ${h * 0.1} ${w * 0.03} ${h * 0.3} ${w * 0.035} ${g.wallBottom} L 0 ${g.wallBottom + 6} Z`), frame);
    c.drawPath(P(`M ${w} 0 L ${w * 0.84} 0 C ${w * 0.94} ${h * 0.1} ${w * 0.97} ${h * 0.3} ${w * 0.965} ${g.wallBottom} L ${w} ${g.wallBottom + 6} Z`), frame);
    c.drawPath(P(`M 0 0 L ${w} 0 L ${w} ${h * 0.05} Q ${w / 2} ${h * 0.14} 0 ${h * 0.05} Z`), frame);
    for (let i = 0; i < 22; i++) {
      const tx = hr(i + 500) * w, ty = h * (0.04 + 0.06 * Math.sin((tx / w) * Math.PI));
      c.drawLine(tx, ty, tx + (hr(i + 510) - 0.5) * 50, ty + 6 + hr(i + 520) * 14, paint(i % 2 ? "#7A4A26" : "#9A6438", 1, { stroke: 3 }));
    }
    for (let i = 0; i < 9; i++) c.drawOval(Skia.XYWHRect(hr(i + 600) * w, h * (0.05 + 0.05 * hr(i + 610)), 16, 8), paint(i % 2 ? "#7FA84A" : "#5E8A3A"));
    // Furniture: wall → rugs → floor (back to front).
    const order = { wall: 0, rug: 1, floor: 2, surface: 3 } as const;
    const items = [...room.placements].filter((p) => p.uid !== opts.hidePlacement).sort((a, b) => order[a.layer] - order[b.layer] || a.y - b.y);
    for (const p of items) drawFurniture(c, p.itemId, placementRect(g, p), p.mirrored, p.colorVariant, u);
    // Lighting: night tint, lamp glow when lights are on.
    if (opts.night || !opts.lightsOn) c.drawRect(Skia.XYWHRect(0, 0, w, h), paint("#140A2A", opts.lightsOn ? 0.28 : 0.55));
    if (opts.lightsOn && opts.night) {
      for (const p of room.placements.filter((q) => q.itemId === "furn_lamp_mushroom" || q.itemId === "furn_brazier")) {
        const r = placementRect(g, p);
        c.drawCircle(r.x + r.w / 2, r.y + r.h - u * 1.6, u * 3.2, paint("#FFB25E", 0.22, { blur: u * 1.5 }));
      }
    }
  }, Skia.XYWHRect(0, 0, g.w, g.h));
}
