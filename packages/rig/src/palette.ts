import type { Palette } from "./types";

/**
 * Genetic colour → full palette, derived in OKLCH so light/shade variants keep
 * perceived hue and contrast for any allele colour (see ART_DIRECTION §3.2).
 */

type Lab = [number, number, number];

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex colour "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  const to = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function hexToOklch(hex: string): Lab {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}

export function oklchToHex([L, C, H]: Lab): string {
  const h = (H * Math.PI) / 180;
  // Reduce chroma until in sRGB gamut (simple, stable gamut mapping).
  for (let c = C; c >= 0; c -= 0.005) {
    const A = c * Math.cos(h);
    const B = c * Math.sin(h);
    const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
    const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
    const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
    const rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) {
      return rgbToHex(rgb.map((v) => linearToSrgb(Math.min(1, Math.max(0, v)))) as [number, number, number]);
    }
  }
  return rgbToHex([L, L, L]);
}

const shift = (hex: string, dL: number, cMul: number, dH = 0): string => {
  const [L, C, H] = hexToOklch(hex);
  return oklchToHex([Math.min(0.98, Math.max(0.05, L + dL)), C * cMul, H + dH]);
};

export interface PaletteGenes {
  base: string;
  accent: string;
  /** Eye/iris colour. */
  eye?: string;
  /** Glow colour for VFX; defaults to a light accent. */
  glow?: string;
}

export function derivePalette(g: PaletteGenes): Palette {
  return {
    base: g.base.toUpperCase(),
    baseLight: shift(g.base, 0.09, 0.85, -6),
    baseShade: shift(g.base, -0.13, 1.05, 10),
    accent: g.accent.toUpperCase(),
    accentLight: shift(g.accent, 0.08, 0.8, -4),
    accentShade: shift(g.accent, -0.12, 1.05, 8),
    // Coloured line art: a very dark, saturated version of the base hue (never black).
    ink: shift(g.base, -0.45, 0.6, 12),
    eye: (g.eye ?? "#2A1A2E").toUpperCase(),
    glow: (g.glow ?? shift(g.accent, 0.12, 0.9)).toUpperCase(),
  };
}

/** WCAG relative-luminance contrast ratio. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map(srgbToLinear) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
