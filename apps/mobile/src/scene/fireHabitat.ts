import { BlurStyle, createPicture, Skia, TileMode, vec, type SkCanvas, type SkPicture } from "@shopify/react-native-skia";

/**
 * Brasálidos habitat (spike version): basalt cave with a distant lava river.
 * Built once per size as a static picture; living elements (ambient embers,
 * lava pulse) are drawn per frame by `drawFireAmbient`.
 * 4 depth layers per ART_DIRECTION §6: sky/back, far, mid (ground), foreground frame.
 */

const C = {
  top: "#2A0E1E",
  mid: "#5B1A24",
  low: "#8C3622",
  rockFar: "#3B1420",
  rockNear: "#1C0811",
  lava: "#FF7A2F",
  lavaCore: "#FFD166",
  ground: "#4A1D22",
  groundTop: "#7A3528",
  obsidian: "#2C1638",
  obsidianEdge: "#9C6BD6",
};

const paint = (color: string, alpha = 1, blur = 0) => {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  p.setAlphaf(alpha);
  if (blur) p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  return p;
};

const path = (d: string) => Skia.Path.MakeFromSVGString(d)!;

export function buildFireHabitat(w: number, h: number, groundY: number): SkPicture {
  return createPicture((canvas: SkCanvas) => {
    // Back layer: warm cave gradient.
    const bg = Skia.Paint();
    bg.setShader(
      Skia.Shader.MakeLinearGradient(vec(0, 0), vec(0, h), [Skia.Color(C.top), Skia.Color(C.mid), Skia.Color(C.low)], [0, 0.55, 1], TileMode.Clamp),
    );
    canvas.drawRect(Skia.XYWHRect(0, 0, w, h), bg);

    // Far layer: distant lava glow and river.
    const horizon = groundY - h * 0.16;
    canvas.drawOval(Skia.XYWHRect(-w * 0.2, horizon - h * 0.12, w * 1.4, h * 0.3), paint(C.lava, 0.35, 40));
    canvas.save();
    canvas.translate(0, horizon);
    const river = path(
      `M 0 0 C ${w * 0.2} -8 ${w * 0.35} 10 ${w * 0.55} 2 C ${w * 0.75} -6 ${w * 0.85} 8 ${w} 0 L ${w} 10 C ${w * 0.8} 16 ${w * 0.6} 6 ${w * 0.45} 12 C ${w * 0.3} 18 ${w * 0.15} 8 0 12 Z`,
    );
    canvas.drawPath(river, paint(C.lava, 0.9, 6));
    canvas.drawPath(river, paint(C.lavaCore, 0.7, 2));
    canvas.restore();

    // Far rock silhouettes (basalt columns).
    const cols = [0.06, 0.13, 0.82, 0.9, 0.97];
    cols.forEach((cx, i) => {
      const cw = w * (0.05 + (i % 2) * 0.02);
      const ch = h * (0.26 + (i % 3) * 0.07);
      canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(w * cx - cw / 2, horizon - ch + 6, cw, ch), 6, 6), paint(C.rockFar, 0.95));
    });

    // Mid layer: ground platform with a lit rim.
    const ground = path(
      `M ${-w * 0.1} ${groundY - 14} C ${w * 0.2} ${groundY - 30} ${w * 0.8} ${groundY - 30} ${w * 1.1} ${groundY - 14} L ${w * 1.1} ${h} L ${-w * 0.1} ${h} Z`,
    );
    const gp = Skia.Paint();
    gp.setAntiAlias(true);
    gp.setShader(
      Skia.Shader.MakeLinearGradient(vec(0, groundY - 30), vec(0, h), [Skia.Color(C.groundTop), Skia.Color(C.ground), Skia.Color("#2A0E14")], [0, 0.25, 1], TileMode.Clamp),
    );
    canvas.drawPath(ground, gp);

    // Obsidian crystals.
    const crystal = (x: number, y: number, s: number, flip: number) => {
      canvas.save();
      canvas.translate(x, y);
      canvas.scale(s * flip, s);
      canvas.drawPath(path("M -10 0 L -6 -34 L 2 -46 L 8 -30 L 12 0 Z"), paint(C.obsidian));
      canvas.drawPath(path("M -6 -34 L 2 -46 L 0 -12 Z"), paint(C.obsidianEdge, 0.55));
      canvas.drawPath(path("M 14 0 L 18 -20 L 24 -14 L 24 0 Z"), paint(C.obsidian));
      canvas.restore();
    };
    crystal(w * 0.12, groundY - 6, h / 520, 1);
    crystal(w * 0.88, groundY - 4, h / 600, -1);

    // Foreground frame: cave lip at the top and dark rocks at the corners.
    canvas.drawPath(
      path(`M 0 0 L ${w} 0 L ${w} ${h * 0.1} C ${w * 0.8} ${h * 0.05} ${w * 0.65} ${h * 0.12} ${w * 0.5} ${h * 0.07} C ${w * 0.35} ${h * 0.03} ${w * 0.15} ${h * 0.12} 0 ${h * 0.08} Z`),
      paint(C.rockNear),
    );
    canvas.drawPath(path(`M 0 ${h} L 0 ${h * 0.86} C ${w * 0.08} ${h * 0.82} ${w * 0.16} ${h * 0.9} ${w * 0.2} ${h} Z`), paint(C.rockNear));
    canvas.drawPath(path(`M ${w} ${h} L ${w} ${h * 0.84} C ${w * 0.9} ${h * 0.8} ${w * 0.84} ${h * 0.92} ${w * 0.78} ${h} Z`), paint(C.rockNear));
  }, Skia.XYWHRect(0, 0, w, h));
}
