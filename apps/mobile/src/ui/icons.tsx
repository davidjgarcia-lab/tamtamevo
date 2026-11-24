import { PaintStyle, Skia, StrokeCap, StrokeJoin } from "@shopify/react-native-skia";
import { Snapshot } from "./snapshot";

/**
 * Vector icon set (24×24 grid, rounded strokes) in the TamTam EVO brand style.
 * Each icon is a list of [svgPath, mode, colourKey]; "s" = stroke, "f" = fill.
 */
type Layer = [d: string, mode: "s" | "f", tone?: "main" | "accent" | "soft"];

export const ICONS: Record<string, Layer[]> = {
  home: [["M3 11 L12 3.5 L21 11", "s"], ["M5.5 9.5 V20 H18.5 V9.5", "s"], ["M10 20 V14 H14 V20", "s", "accent"]],
  farm: [["M3 20 V10 L12 4 L21 10 V20 Z", "s"], ["M8 20 V13 H16 V20", "s", "accent"], ["M8 13 L16 20 M16 13 L8 20", "s", "accent"]],
  shop: [["M4.5 8 H19.5 L18.3 20 H5.7 Z", "s"], ["M8.5 10 V7 C8.5 3.5 15.5 3.5 15.5 7 V10", "s", "accent"]],
  arena: [["M5 4 L14 13 M4 7 L4 4 L7 4", "s"], ["M19 4 L10 13 M20 7 L20 4 L17 4", "s", "accent"], ["M7 15 L4.5 17.5 M9 17 L6.5 19.5 M17 15 L19.5 17.5 M15 17 L17.5 19.5", "s"]],
  connect: [["M9.5 14.5 L14.5 9.5", "s", "accent"], ["M11 6.5 L13 4.5 C15 2.5 19.5 4 19.5 4.5 C20 5 21.5 9 19.5 11 L17.5 13", "s"], ["M13 17.5 L11 19.5 C9 21.5 4.5 20 4.5 19.5 C4 19 2.5 15 4.5 13 L6.5 11", "s"]],
  food: [["M5 11 H19 C19 16 16 19.5 12 19.5 C8 19.5 5 16 5 11 Z", "s"], ["M9 8 C8 6.5 10 5.5 9 4 M12.5 8 C11.5 6.5 13.5 5.5 12.5 4 M16 8 C15 6.5 17 5.5 16 4", "s", "accent"]],
  shower: [["M6 21 V7 C6 4 9 3 11 4.5", "s"], ["M8.5 7.5 H15.5 L12 4.5 Z", "f", "accent"], ["M10 11 L9.4 13 M12 11 V13.4 M14 11 L14.6 13 M10.5 16 L10 18 M13.5 16 L14 18", "s", "accent"]],
  mop: [["M15 3 L10 13", "s"], ["M6.5 13 H14 L15.5 20 H5 Z", "s", "accent"], ["M8 16.5 V20 M10.3 16.5 V20 M12.6 16.5 V20", "s", "accent"]],
  play: [["M12 3.5 A8.5 8.5 0 1 0 12.01 3.5 Z", "s"], ["M4 10 C9 12 15 12 20 10 M7 18 C9 14 15 14 17 18", "s", "accent"]],
  nap: [["M14 4 H19 L14 10 H19", "s", "accent"], ["M5 12 H9 L5 17 H9", "s"], ["M11 16 H14 L11 20 H14", "s"]],
  moon: [["M19 14.5 A7.5 7.5 0 1 1 9.5 5 A6 6 0 0 0 19 14.5 Z", "s"], ["M17 4 L17.5 5.5 L19 6 L17.5 6.5 L17 8 L16.5 6.5 L15 6 L16.5 5.5 Z", "f", "accent"]],
  sun: [["M12 8 A4 4 0 1 0 12.01 8 Z", "s", "accent"], ["M12 2.5 V4.5 M12 19.5 V21.5 M2.5 12 H4.5 M19.5 12 H21.5 M5.3 5.3 L6.7 6.7 M17.3 17.3 L18.7 18.7 M5.3 18.7 L6.7 17.3 M17.3 6.7 L18.7 5.3", "s"]],
  gym: [["M7 12 H17", "s"], ["M4 8.5 V15.5 M7 7 V17 M17 7 V17 M20 8.5 V15.5", "s", "accent"]],
  study: [["M3.5 5.5 C6.5 4.5 9.5 4.5 12 6.5 V19.5 C9.5 17.5 6.5 17.5 3.5 18.5 Z", "s"], ["M20.5 5.5 C17.5 4.5 14.5 4.5 12 6.5 V19.5 C14.5 17.5 17.5 17.5 20.5 18.5 Z", "s", "accent"]],
  decor: [["M14.5 4.5 L19.5 9.5 L11 18 L6 13 Z", "s"], ["M6 13 L4 20 L11 18", "s", "accent"]],
  back: [["M14.5 5 L7.5 12 L14.5 19", "s"]],
  close: [["M6 6 L18 18 M18 6 L6 18", "s"]],
  replay: [["M5 12 A7 7 0 1 0 7.5 6.5", "s"], ["M4 4.5 V9 H8.5", "s", "accent"]],
  up: [["M5 15 L12 8 L19 15", "s"]],
  down: [["M5 9 L12 16 L19 9", "s"]],
  left: [["M15 5 L8 12 L15 19", "s"]],
  right: [["M9 5 L16 12 L9 19", "s"]],
  heart: [["M12 20 C5 15 3 11.5 3 8.5 C3 5.5 5.5 4 7.5 4 C9.5 4 11 5.2 12 7 C13 5.2 14.5 4 16.5 4 C18.5 4 21 5.5 21 8.5 C21 11.5 19 15 12 20 Z", "f", "accent"]],
  trophy: [["M7 4 H17 V9 C17 12 14.5 14 12 14 C9.5 14 7 12 7 9 Z", "s", "accent"], ["M7 6 H4 C4 9 5.5 10 7 10 M17 6 H20 C20 9 18.5 10 17 10 M12 14 V18 M8 20 H16", "s"]],
  egg: [["M12 3 C16 3 19 9 19 13.5 C19 18 16 21 12 21 C8 21 5 18 5 13.5 C5 9 8 3 12 3 Z", "s"], ["M9 13 L11 11 L13 13.5 L15 11.5", "s", "accent"]],
  lock: [["M6 11 H18 V20 H6 Z", "s"], ["M8.5 11 V8 C8.5 4 15.5 4 15.5 8 V11", "s", "accent"]],
  camera: [["M3.5 8 H7.5 L9 5.5 H15 L16.5 8 H20.5 V19 H3.5 Z", "s"], ["M12 10 A3.4 3.4 0 1 0 12.01 10 Z", "s", "accent"]],
  bulb: [["M9 17 H15 M10 20 H14", "s"], ["M12 3.5 C8 3.5 6 6.5 6 9 C6 12 9 13 9 15.5 H15 C15 13 18 12 18 9 C18 6.5 16 3.5 12 3.5 Z", "s", "accent"]],
  book: [["M5 4 H17 C18 4 19 5 19 6 V20 H7 C6 20 5 19 5 18 Z", "s"], ["M5 18 C5 17 6 16 7 16 H19", "s", "accent"], ["M9 8 H15", "s", "accent"]],
  // Minigame icons (D9: no names, icons only).
  maze: [["M4 4 H20 V20 H4 Z", "s"], ["M8 4 V12 H12 M16 8 V16 H8 M12 20 V16", "s", "accent"], ["M17.6 18 A1.6 1.6 0 1 0 17.61 18 Z", "f", "accent"]],
  bricks: [["M3 4 H10 V7.5 H3 Z M14 4 H21 V7.5 H14 Z M6.5 9.5 H13.5 V13 H6.5 Z", "f", "accent"], ["M8 20 H16", "s"], ["M12 16 A1.7 1.7 0 1 0 12.01 16 Z", "f"]],
  grid: [["M4 4 H20 V20 H4 Z M12 4 V20 M4 12 H20", "s"], ["M8 6 C10 8 8 10 8 10 C6 8 8 6 8 6 Z", "f", "accent"], ["M16 14 A2 2 0 1 0 16.01 14 Z", "f", "accent"]],
  trail: [["M4 18 H9 V12 H15 V6 H20", "s", "accent"], ["M20 6 A1.8 1.8 0 1 0 20.01 6 Z", "f"], ["M5 8 A1.4 1.4 0 1 0 5.01 8 Z", "f", "soft"]],
};

export function Icon({ name, size = 24, color = "#F5F3FF", accent = "#00D4FF", stroke = 2.2 }: { name: keyof typeof ICONS; size?: number; color?: string; accent?: string; stroke?: number }) {
  const layers = ICONS[name] ?? [];
  return (
    <Snapshot
      id={`icon:${name}:${color}:${accent}:${stroke}`}
      w={size}
      h={size}
      draw={(c) => {
        c.scale(size / 24, size / 24);
        for (const [d, mode, tone] of layers) {
          const path = Skia.Path.MakeFromSVGString(d);
          if (!path) continue;
          const p = Skia.Paint();
          p.setAntiAlias(true);
          p.setColor(Skia.Color(tone === "accent" ? accent : tone === "soft" ? "#FFD166" : color));
          if (mode === "s") {
            p.setStyle(PaintStyle.Stroke);
            p.setStrokeWidth(stroke);
            p.setStrokeCap(StrokeCap.Round);
            p.setStrokeJoin(StrokeJoin.Round);
          }
          c.drawPath(path, p);
        }
      }}
    />
  );
}
