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

const INK = "#4A2027";

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

/** Draws one furniture item inside rect (x, y, w, h) — y/h are the footprint on the floor or wall cells. */
export function drawFurniture(c: SkCanvas, itemId: string, r: { x: number; y: number; w: number; h: number }, mirrored: boolean, variant: string | undefined, u: number) {
  const lw = Math.max(1.5, u * 0.06);
  c.save();
  if (mirrored) {
    c.translate(r.x * 2 + r.w, 0);
    c.scale(-1, 1);
  }
  const { x, y, w, h } = r;
  const base = y + h; // floor contact line
  switch (itemId) {
    case "furn_bed_nest": {
      const bh = u * 1.5;
      c.drawOval(Skia.XYWHRect(x + w * 0.02, base - bh * 0.35, w * 0.96, bh * 0.55), paint("#000000", 0.18, { blur: 4 }));
      outlinedRRect(c, x + w * 0.04, base - bh, w * 0.92, bh * 0.85, u * 0.5, grad(0, base - bh, 0, base, ["#C9824E", "#8E5133"]), lw);
      outlinedRRect(c, x + w * 0.1, base - bh * 0.95, w * 0.8, bh * 0.5, u * 0.4, grad(0, base - bh, 0, base - bh * 0.4, ["#FFB38A", "#F2735A"]), lw);
      outlinedRRect(c, x + w * 0.08, base - bh * 1.12, w * 0.3, bh * 0.38, u * 0.18, paint("#FFF1DC"), lw);
      for (let i = 0; i < 4; i++) c.drawCircle(x + w * (0.48 + i * 0.1), base - bh * 0.72, u * 0.06, paint("#FFE08A", 0.9));
      break;
    }
    case "furn_rug_round": {
      c.drawOval(Skia.XYWHRect(x, y + h * 0.1, w, h * 0.8), grad(0, y, 0, y + h, ["#E8573E", "#B5362F"]));
      c.drawOval(Skia.XYWHRect(x + w * 0.12, y + h * 0.24, w * 0.76, h * 0.52), paint("#FFB627", 0.85));
      c.drawOval(Skia.XYWHRect(x + w * 0.26, y + h * 0.36, w * 0.48, h * 0.28), paint("#FF7A3D"));
      c.drawOval(Skia.XYWHRect(x, y + h * 0.1, w, h * 0.8), paint(INK, 0.8, { stroke: lw }));
      break;
    }
    case "furn_lamp_mushroom": {
      const lh = u * 2.2;
      c.drawCircle(x + w / 2, base - lh * 0.75, u * 1.1, paint("#FFD27A", 0.35, { blur: u * 0.7 }));
      outlinedRRect(c, x + w * 0.42, base - lh * 0.6, w * 0.16, lh * 0.58, u * 0.08, paint("#F3E4CC"), lw);
      const cap = Skia.Path.MakeFromSVGString(`M ${x + w * 0.05} ${base - lh * 0.58} C ${x + w * 0.05} ${base - lh * 1.05} ${x + w * 0.95} ${base - lh * 1.05} ${x + w * 0.95} ${base - lh * 0.58} Z`)!;
      c.drawPath(cap, grad(0, base - lh, 0, base - lh * 0.6, ["#FF8A5B", "#D6452F"]));
      c.drawPath(cap, paint(INK, 1, { stroke: lw }));
      c.drawCircle(x + w * 0.35, base - lh * 0.8, u * 0.1, paint("#FFF1DC"));
      c.drawCircle(x + w * 0.62, base - lh * 0.86, u * 0.08, paint("#FFF1DC"));
      break;
    }
    case "furn_chair_wood": {
      const ch = u * 1.8;
      outlinedRRect(c, x + w * 0.2, base - ch, w * 0.12, ch, u * 0.05, paint("#9A5B3A"), lw);
      outlinedRRect(c, x + w * 0.68, base - ch * 0.55, w * 0.1, ch * 0.55, u * 0.05, paint("#9A5B3A"), lw);
      outlinedRRect(c, x + w * 0.24, base - ch * 0.6, w * 0.56, u * 0.24, u * 0.08, paint("#C7804F"), lw);
      outlinedRRect(c, x + w * 0.18, base - ch * 1.02, w * 0.2, ch * 0.5, u * 0.08, paint("#C7804F"), lw);
      break;
    }
    case "furn_poster_volcano":
    case "furn_poster_stars": {
      const night = itemId === "furn_poster_stars" || variant === "night";
      outlinedRRect(c, x + w * 0.08, y + h * 0.06, w * 0.84, h * 0.88, u * 0.1, paint("#FFF4E2"), lw);
      const ix = x + w * 0.16, iy = y + h * 0.14, iw = w * 0.68, ih = h * 0.72;
      c.save();
      c.clipRRect(rr(ix, iy, iw, ih, u * 0.06), ClipOp.Intersect, true);
      c.drawRect(Skia.XYWHRect(ix, iy, iw, ih), grad(0, iy, 0, iy + ih, night ? ["#1B1340", "#4B2A6B"] : variant === "dusk" ? ["#FF9A62", "#FFD39A"] : ["#FFB38A", "#FFE3B5"]));
      if (itemId === "furn_poster_stars") {
        for (let i = 0; i < 9; i++) c.drawCircle(ix + iw * ((i * 37) % 100) / 100, iy + ih * ((i * 53) % 70) / 100, u * 0.05, paint("#FFF6C8"));
        c.drawCircle(ix + iw * 0.7, iy + ih * 0.3, u * 0.25, paint("#FFF1B0"));
      } else {
        const v = Skia.Path.MakeFromSVGString(`M ${ix} ${iy + ih} L ${ix + iw * 0.38} ${iy + ih * 0.38} L ${ix + iw * 0.5} ${iy + ih * 0.42} L ${ix + iw * 0.62} ${iy + ih * 0.36} L ${ix + iw} ${iy + ih} Z`)!;
        c.drawPath(v, paint(night ? "#2A1430" : "#6B2B2B"));
        c.drawCircle(ix + iw * 0.5, iy + ih * 0.3, u * 0.18, paint("#FF7A2F", 0.9, { blur: u * 0.12 }));
      }
      c.restore();
      break;
    }
    case "furn_plant_fern": {
      const ph = u * 1.9;
      outlinedRRect(c, x + w * 0.25, base - ph * 0.42, w * 0.5, ph * 0.42, u * 0.12, grad(0, base - ph * 0.4, 0, base, ["#E07A4F", "#A9472D"]), lw);
      for (let i = -2; i <= 2; i++) {
        const leaf = Skia.Path.MakeFromSVGString(`M ${x + w / 2} ${base - ph * 0.4} Q ${x + w / 2 + i * w * 0.25} ${base - ph * 1.0} ${x + w / 2 + i * w * 0.32} ${base - ph * (0.95 - Math.abs(i) * 0.1)}`)!;
        c.drawPath(leaf, paint(i % 2 ? "#FF8A3D" : "#FFB627", 1, { stroke: u * 0.16 }));
      }
      break;
    }
    case "furn_sofa_cushion": {
      const sh = u * 1.4;
      outlinedRRect(c, x + w * 0.02, base - sh, w * 0.96, sh, u * 0.35, grad(0, base - sh, 0, base, ["#8C6BC9", "#5B3F94"]), lw);
      for (let i = 0; i < 3; i++) outlinedRRect(c, x + w * (0.08 + i * 0.29), base - sh * 0.9, w * 0.26, sh * 0.5, u * 0.2, paint("#B79BEA"), lw);
      break;
    }
    case "furn_brazier": {
      const bh = u * 1.7;
      c.drawCircle(x + w / 2, base - bh * 0.95, u * 0.9, paint("#FF8A3D", 0.4, { blur: u * 0.5 }));
      outlinedRRect(c, x + w * 0.15, base - bh * 0.65, w * 0.7, bh * 0.35, u * 0.12, grad(0, base - bh, 0, base, ["#E0A060", "#9C5A2A"]), lw);
      outlinedRRect(c, x + w * 0.44, base - bh * 0.32, w * 0.12, bh * 0.32, u * 0.04, paint("#9C5A2A"), lw);
      const fl = Skia.Path.MakeFromSVGString(`M ${x + w * 0.3} ${base - bh * 0.65} C ${x + w * 0.3} ${base - bh * 1.1} ${x + w * 0.5} ${base - bh * 1.0} ${x + w * 0.5} ${base - bh * 1.35} C ${x + w * 0.62} ${base - bh * 1.0} ${x + w * 0.72} ${base - bh * 0.95} ${x + w * 0.7} ${base - bh * 0.65} Z`)!;
      c.drawPath(fl, paint("#FFB627"));
      break;
    }
    case "gym_dumbbells": {
      const mh = u * 0.25;
      outlinedRRect(c, x + w * 0.02, base - mh, w * 0.96, mh, u * 0.1, paint("#3E6E8E"), lw);
      const bar = base - mh - u * 0.35;
      outlinedRRect(c, x + w * 0.15, bar - u * 0.05, w * 0.7, u * 0.1, u * 0.04, paint("#6E6A78"), lw * 0.8);
      for (const cx of [0.15, 0.79]) outlinedRRect(c, x + w * cx, bar - u * 0.32, w * 0.07, u * 0.64, u * 0.06, grad(0, bar - u * 0.3, 0, bar + u * 0.3, ["#8B86A0", "#4A4558"]), lw * 0.8);
      break;
    }
    default:
      outlinedRRect(c, x, base - u, w, u, u * 0.1, paint("#CCCCCC"), lw);
  }
  c.restore();
}

export function buildRoomPicture(room: RoomLayout, g: RoomGeom, opts: { night: boolean; lightsOn: boolean; hidePlacement?: string }): SkPicture {
  return createPicture((c) => {
    const { w, h } = g;
    const u = g.floorCellH;
    // Wall with wallpaper stripes.
    c.drawRect(Skia.XYWHRect(0, 0, w, g.wallBottom), grad(0, 0, 0, g.wallBottom, ["#F9DDB9", room.finishes.wallColor]));
    for (let i = 0; i < 14; i++) c.drawRect(Skia.XYWHRect(i * (w / 14) + w / 56, 0, w / 56, g.wallBottom), paint("#F0C79A", 0.35));
    // Window with the fire-island view.
    const win = room.windowCells;
    const wx = g.wallX0 + win.x * g.wallCell, wy = g.wallTop + win.y * g.wallCell, ww = win.w * g.wallCell, wh = win.h * g.wallCell;
    c.drawRRect(rr(wx - 6, wy - 6, ww + 12, wh + 12, 14), paint("#B36A3E"));
    c.save();
    c.clipRRect(rr(wx, wy, ww, wh, 10), ClipOp.Intersect, true);
    c.drawRect(Skia.XYWHRect(wx, wy, ww, wh), grad(0, wy, 0, wy + wh, opts.night ? ["#120B2E", "#3A1C4A"] : ["#7FC8F8", "#FFD6A5"]));
    const island = Skia.Path.MakeFromSVGString(`M ${wx} ${wy + wh} L ${wx + ww * 0.25} ${wy + wh * 0.62} L ${wx + ww * 0.42} ${wy + wh * 0.4} L ${wx + ww * 0.5} ${wy + wh * 0.44} L ${wx + ww * 0.58} ${wy + wh * 0.38} L ${wx + ww * 0.8} ${wy + wh * 0.66} L ${wx + ww} ${wy + wh} Z`)!;
    c.drawPath(island, paint(opts.night ? "#2B1430" : "#7A3B3B"));
    c.drawCircle(wx + ww * 0.5, wy + wh * 0.36, ww * 0.06, paint("#FF7A2F", 0.9, { blur: 6 }));
    if (opts.night) for (let i = 0; i < 7; i++) c.drawCircle(wx + ww * ((i * 29) % 100) / 100, wy + wh * ((i * 17) % 30) / 100, 1.6, paint("#FFF6C8"));
    c.restore();
    c.drawRRect(rr(wx - 6, wy - 6, ww + 12, wh + 12, 14), paint(INK, 1, { stroke: 3 }));
    c.drawRect(Skia.XYWHRect(wx + ww / 2 - 3, wy, 6, wh), paint("#B36A3E"));
    // Skirting board.
    c.drawRect(Skia.XYWHRect(0, g.wallBottom - 10, w, 10), paint("#B36A3E"));
    // Floor planks.
    c.drawRect(Skia.XYWHRect(0, g.floorTop, w, h - g.floorTop), grad(0, g.floorTop, 0, h, ["#C98C5A", "#A86B40"]));
    for (let r = 1; r < 6; r++) c.drawLine(0, g.floorTop + ((h - g.floorTop) * r) / 6, w, g.floorTop + ((h - g.floorTop) * r) / 6, paint("#8E5733", 0.35, { stroke: 1.5 }));
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
