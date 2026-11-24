import type { PaintRef, PartDef } from "@tamtam/rig";

/**
 * Modular part library: for each family, the pieces it can give to a Tamtam (body, head, legs, tail,
 * back appendage) drawn on the SHARED quadruped skeleton of Chispín v3 (same bones → every clip works).
 * Coordinates are bone-local, like chispin.ts. artStatus: prototype.
 */
export type Fam = "fire" | "plant" | "electric" | "crystal" | "shadow" | "water" | "plasma" | "light" | "rock" | "mystic";
/** Families with their own vector shapes; Mistor (mystic) reuses Lúmina's (light) shapes with its own palette. */
type BaseFam = Exclude<Fam, "mystic">;
const baseFam = (f: Fam): BaseFam => (f === "mystic" ? "light" : f);

export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
const INK: PaintRef = { tint: "ink" };
const glow = (alpha: number): PaintRef => ({ tint: "glow", alpha });
type P = Omit<PartDef, "id"> & { id?: string };
let uid = 0;
const mk = (prefix: string, ps: P[]): PartDef[] => ps.map((p) => ({ ...p, id: p.id ?? `${prefix}${uid++}` }) as PartDef);

/** Translucent families. */
const BODY_ALPHA: Partial<Record<BaseFam, number>> = { shadow: 0.82, plasma: 0.78, crystal: 0.88 };

// ── BODY ─────────────────────────────────────────────────────────────────────
const TORSO = "M -34 -6 C -36 -19 -22 -25 -4 -25 C 14 -25 30 -21 34 -8 C 37 4 28 14 10 15 L -18 15 C -30 14 -35 6 -34 -6 Z";
const TORSO_BULKY = "M -36 -6 C -38 -22 -22 -29 -4 -29 C 16 -29 33 -23 36 -8 C 39 6 28 17 10 17 L -18 17 C -32 16 -37 7 -36 -6 Z";
const TORSO_FACET = "M -34 -4 L -26 -22 L -6 -27 L 16 -25 L 32 -14 L 35 0 L 26 13 L 4 16 L -20 15 L -32 8 Z";
const TORSO_ANGULAR = "M -35 -4 L -30 -20 L -10 -26 L 18 -25 L 33 -16 L 36 2 L 27 14 L -20 15 L -33 9 Z";
const TORSO_BLOB = "M -36 0 C -38 -24 -16 -32 2 -32 C 22 -32 38 -22 38 -4 C 38 12 26 18 4 18 C -20 18 -36 14 -36 0 Z";
const TORSO_SLIM = "M -32 -6 C -33 -17 -20 -22 -4 -22 C 12 -22 28 -19 32 -8 C 35 2 26 11 10 12 L -18 12 C -28 11 -33 5 -32 -6 Z";
const TORSO_GHOST = "M -34 -6 C -36 -20 -20 -26 -2 -26 C 16 -26 32 -20 34 -6 C 36 8 30 16 24 20 L 18 13 L 12 21 L 4 13 L -4 22 L -12 13 L -20 20 L -26 12 C -32 9 -34 2 -34 -6 Z";

const TORSO_BY: Record<BaseFam, string[]> = {
  fire: [TORSO, TORSO_BULKY], rock: [TORSO, TORSO_BULKY], plant: [TORSO_BULKY, TORSO], electric: [TORSO_ANGULAR, TORSO_BULKY],
  crystal: [TORSO_FACET, TORSO_ANGULAR], shadow: [TORSO_GHOST, TORSO_SLIM], water: [TORSO_SLIM, TORSO], plasma: [TORSO_BLOB, TORSO_BULKY], light: [TORSO_SLIM, TORSO_GHOST],
};

export function bodyParts(fIn: Fam, v: number): PartDef[] {
  const f = baseFam(fIn);
  const d = TORSO_BY[f][v % 2]!;
  const a = BODY_ALPHA[f] ?? 1;
  const out: P[] = [
    { bone: "body", d, stroke: INK, strokeWidth: 5, z: 6 },
    { bone: "body", d, fill: { gradient: ["baseLight", "base", "baseShade"], from: [0, -28], to: [0, 16], alpha: a }, z: 7, sheen: f !== "plant" && f !== "shadow" },
    { bone: "body", d: "M -30 -14 C -24 -22 -10 -25 4 -25 C -10 -23 -22 -20 -28 -11 Z", fill: { tint: "baseLight", alpha: 0.9 }, z: 9 },
  ];
  const belly: Record<BaseFam, P[]> = {
    fire: [{ bone: "body", d: "M -26 7 C -12 15 12 15 27 6 L 28 11 C 12 19 -12 19 -27 12 Z", fill: { gradient: ["#F4DDB8", "#D9B48A"], from: [0, 6], to: [0, 18] }, stroke: { tint: "ink", alpha: 0.7 }, strokeWidth: 1.6, z: 8 },
      { bone: "body", d: "M -22 -20 L -18 -26 L -12 -21 M 0 -24 L 4 -30 L 9 -24", stroke: INK, strokeWidth: 1.6, fill: { tint: "baseShade" }, z: 8 }],
    rock: [{ bone: "body", d: "M -26 7 C -12 15 12 15 27 6 L 28 11 C 12 19 -12 19 -27 12 Z", fill: { gradient: ["#EED7AE", "#C9A57A"], from: [0, 6], to: [0, 18] }, stroke: { tint: "ink", alpha: 0.7 }, strokeWidth: 1.6, z: 8 },
      { bone: "body", d: "M -16 11 L -15 16 M -6 13 L -6 18 M 4 13 L 4 18 M 14 11 L 15 16", stroke: { color: "#A88660" }, strokeWidth: 1.2, z: 8 },
      { bone: "body", d: "M -24 -18 Q -20 -22 -16 -18 Q -12 -22 -8 -18 Q -4 -22 0 -18 Q 4 -22 8 -18 Q 12 -22 16 -18", stroke: { tint: "baseShade" }, strokeWidth: 1.6, z: 8 }],
    plant: [{ bone: "body", d: "M -28 -10 C -20 -6 -14 -12 -8 -8 M -2 -16 C 6 -10 12 -18 20 -12 M -20 4 C -10 8 0 2 10 6", stroke: { tint: "baseShade" }, strokeWidth: 2, z: 8 },
      { bone: "body", d: "M -22 -24 C -18 -32 -10 -32 -8 -26 C -12 -28 -16 -27 -22 -24 Z M 2 -28 C 8 -36 18 -34 18 -27 C 13 -30 8 -30 2 -28 Z", fill: { tint: "accent" }, stroke: INK, strokeWidth: 1.4, z: 9.2 },
      { bone: "body", d: "M -24 9 C -12 14 12 14 24 8 L 24 12 C 12 18 -12 18 -24 13 Z", fill: { tint: "baseLight" }, z: 8 }],
    electric: [{ bone: "body", d: "M -20 -6 L 18 -6 L 22 8 L -22 8 Z", fill: { gradient: ["#D8DEE8", "#7D8798"], from: [0, -6], to: [0, 8] }, stroke: INK, strokeWidth: 1.6, z: 8 },
      { bone: "body", d: "M -30 -12 L 30 -12", stroke: { tint: "baseShade" }, strokeWidth: 2.2, z: 8 },
      { bone: "body", d: "M -12 -22 L -2 -26 L 8 -22 Z", fill: { tint: "accent" }, stroke: INK, strokeWidth: 1.2, z: 8.5, emissive: true }],
    crystal: [{ bone: "body", d: "M -26 -4 L -6 -27 L 4 0 Z M 4 0 L 16 -25 L 32 -14 Z", fill: { color: "#FFFFFF", alpha: 0.22 }, z: 8 },
      { bone: "body", d: ell(0, -4, 10, 8), fill: glow(0.6), blur: 6, z: 7.5, emissive: true }],
    shadow: [{ bone: "body", d: ell(-2, -2, 16, 10), fill: { tint: "accent", alpha: 0.35 }, blur: 6, z: 7.6, emissive: true },
      { bone: "body", d: "M -26 12 C -20 22 -14 14 -12 24 M 2 14 C 6 26 12 16 16 24", stroke: { tint: "base", alpha: 0.5 }, strokeWidth: 3, blur: 1.5, z: 6 }],
    water: [{ bone: "body", d: "M -24 6 C -10 13 10 13 26 5 L 27 9 C 10 17 -10 17 -25 10 Z", fill: { color: "#E6F6FF", alpha: 0.9 }, z: 8 },
      { bone: "body", d: "M -20 -14 Q -16 -18 -12 -14 Q -8 -18 -4 -14 M 4 -16 Q 8 -20 12 -16 Q 16 -20 20 -16", stroke: { tint: "baseLight" }, strokeWidth: 1.4, z: 8 },
      { bone: "body", d: "M -6 13 C -4 20 4 24 10 22 C 6 18 4 15 4 13 Z", fill: { tint: "accent", alpha: 0.8 }, stroke: INK, strokeWidth: 1.2, z: 5.5 }],
    plasma: [{ bone: "body", d: ell(2, -6, 12, 10), fill: { tint: "accent", alpha: 0.85 }, z: 7.8, emissive: true },
      { bone: "body", d: ell(2, -6, 16, 14), fill: glow(0.45), blur: 7, z: 7.7, emissive: true },
      { bone: "body", d: `${ell(-18, -10, 2.5, 2.5)} ${ell(20, 2, 2, 2)} ${ell(-10, 6, 1.6, 1.6)}`, fill: { color: "#FFFFFF", alpha: 0.6 }, z: 8 }],
    light: [{ bone: "body", d: "M 22 -6 C 30 0 30 10 22 14 C 26 8 24 2 18 -2 Z M 14 -2 C 22 4 22 14 14 16 C 17 10 16 5 10 2 Z", fill: { color: "#FFFFFF", alpha: 0.85 }, stroke: INK, strokeWidth: 1, z: 8.5 },
      { bone: "body", d: ell(0, -6, 22, 14), fill: glow(0.25), blur: 8, z: 6.5, emissive: true }],
  };
  out.push(...belly[f]);
  if (v === 1 && (f === "rock" || f === "fire" || f === "electric")) out.push({ bone: "body", d: "M -26 -22 L -22 -32 L -18 -23 M -10 -26 L -6 -36 L -2 -27 M 6 -26 L 10 -35 L 14 -25", fill: { tint: "baseShade" }, stroke: INK, strokeWidth: 1.6, z: 5.8 });
  return mk(`body_${f}_`, out);
}

// ── NECK + HEAD ──────────────────────────────────────────────────────────────
const NECK = "M -8 -9 C 0 -17 14 -17 19 -10 L 21 7 C 11 11 0 11 -9 7 Z";
const SKULL = "M -16 -9 C -14 -22 1 -26 13 -21 C 23 -17 31 -11 34 -3 C 36 3 31 8 23 8 L -3 10 C -14 11 -20 3 -16 -9 Z";
const SKULL_ROUND = "M -18 -6 C -18 -24 0 -30 14 -24 C 26 -19 33 -10 34 -2 C 35 4 30 8 23 8 L -3 10 C -15 11 -19 4 -18 -6 Z";
const SKULL_ANGLE = "M -16 -8 L -10 -22 L 10 -24 L 26 -14 L 35 -3 L 30 7 L 23 8 L -3 10 L -15 6 Z";

export function headParts(fIn: Fam, v: number): PartDef[] {
  const f = baseFam(fIn);
  const skull = f === "electric" || f === "crystal" ? SKULL_ANGLE : f === "plasma" || f === "shadow" || f === "plant" ? SKULL_ROUND : SKULL;
  const a = BODY_ALPHA[f] ?? 1;
  const out: P[] = [
    { bone: "neck", d: NECK, fill: { gradient: ["baseLight", "base"], from: [0, -16], to: [0, 8], alpha: a }, stroke: INK, strokeWidth: 2.4, z: 10 },
    { bone: "neck", d: "M 1 4 C 8 8 15 8 21 4 L 20 9 C 13 13 6 13 -1 9 Z", fill: { tint: "baseLight" }, z: 10 },
    { bone: "head", d: skull, stroke: INK, strokeWidth: 4.5, z: 12 },
    { bone: "head", d: skull, fill: { gradient: ["baseLight", "base"], from: [0, -26], to: [0, 10], alpha: a }, z: 13, sheen: f !== "plant" },
    { bone: "head", d: "M 6 4 C 16 6 26 6 33 0 C 34 4 30 8 23 8 L -3 10 C -2 6 2 4 6 4 Z", fill: { tint: "baseShade", alpha: 0.7 }, z: 14 },
  ];
  const orn: Record<BaseFam, P[][]> = {
    fire: [[{ bone: "horn", d: "M 0 0 C -6 -10 -2 -20 -10 -28 C -2 -26 6 -16 4 -2 Z", fill: { gradient: ["accentLight", "accent"], from: [0, -28], to: [0, 0] }, z: 11.8, emissive: true },
      { bone: "horn", d: "M 12 -2 C 10 -12 16 -18 12 -26 C 20 -20 22 -10 16 0 Z", fill: { gradient: ["accentLight", "accent"], from: [0, -26], to: [0, 0] }, z: 11.7, emissive: true }],
      [{ bone: "horn", d: "M 0 0 C -6 -6 -14 -9 -22 -9 C -15 -5 -9 -1 -6 4 Z", fill: { color: "#2A1820" }, stroke: INK, strokeWidth: 1.6, z: 11.8 },
        { bone: "head", d: "M -12 -6 Q -6 -12 2 -12 M 8 -18 Q 14 -16 20 -12", stroke: { tint: "accent" }, strokeWidth: 1.6, z: 14, emissive: true }]],
    rock: [[{ bone: "horn", d: "M 0 0 C -6 -6 -14 -9 -22 -9 C -15 -5 -9 -1 -6 4 Z", fill: { gradient: ["#3A2A20", "#7A5A44"], from: [-20, -8], to: [0, 4] }, stroke: INK, strokeWidth: 1.6, z: 11.8 },
      { bone: "horn", d: "M 6 -2 C 2 -8 -4 -12 -10 -12 C -5 -7 -2 -3 0 2 Z", fill: { color: "#7A5A44" }, stroke: INK, strokeWidth: 1.4, z: 11.7 }],
      [{ bone: "head", d: "M -14 -12 L -20 -18 L -12 -16 L -16 -24 L -8 -19 L -6 -26 L 0 -21", fill: { tint: "baseShade" }, stroke: INK, strokeWidth: 1.4, z: 11.9 }]],
    plant: [[{ bone: "horn", d: "M 2 0 L 0 -18 M 0 -10 L -8 -18 M 0 -18 L -4 -26 M 0 -16 L 6 -24", stroke: { color: "#6B4A2A" }, strokeWidth: 3, z: 11.8 },
      { bone: "horn", d: `${ell(-9, -20, 4, 2.5)} ${ell(7, -26, 4, 2.5)} ${ell(-5, -28, 3, 2)}`, fill: { tint: "accent" }, stroke: INK, strokeWidth: 1, z: 11.9 }],
      [{ bone: "head", d: "M -16 -14 C -14 -30 6 -34 16 -24 C 6 -26 -6 -24 -16 -14 Z", fill: { tint: "accent" }, stroke: INK, strokeWidth: 1.4, z: 14.1 },
        { bone: "head", d: `${ell(-4, -26, 2.5, 2.5)} ${ell(6, -28, 2, 2)}`, fill: { color: "#FF8FB1" }, z: 14.2 }]],
    electric: [[{ bone: "head", d: "M -16 -8 L -10 -22 L 10 -24 L 26 -14 L 20 -12 L 4 -18 L -8 -16 Z", fill: { gradient: ["#E3E8F0", "#8A94A6"], from: [0, -24], to: [0, -8] }, stroke: INK, strokeWidth: 1.6, z: 14.1, sheen: true },
      { bone: "head", d: `${ell(-6, -14, 1.6, 1.6)} ${ell(6, -18, 1.6, 1.6)}`, fill: { color: "#4A5262" }, z: 14.2 }],
      [{ bone: "horn", d: "M 0 4 L -4 -18 L 4 -18 L 4 4 Z", fill: { color: "#9AA4B6" }, stroke: INK, strokeWidth: 1.4, z: 11.8 },
        { bone: "horn", d: ell(0, -20, 4, 4), fill: { tint: "accent" }, stroke: INK, strokeWidth: 1.2, z: 11.9, emissive: true }]],
    crystal: [[{ bone: "horn", d: "M 0 2 L -10 -24 L 2 -14 L 6 -30 L 10 -6 Z", fill: { gradient: ["#FFFFFF", "accent"], from: [0, -30], to: [0, 2], alpha: 0.9 }, stroke: INK, strokeWidth: 1.4, z: 11.8, emissive: true }],
      [{ bone: "head", d: "M -6 -20 L -2 -32 L 4 -22 Z M 8 -20 L 14 -30 L 16 -18 Z", fill: { tint: "accent", alpha: 0.9 }, stroke: INK, strokeWidth: 1.2, z: 14.1, emissive: true }]],
    shadow: [[{ bone: "head", d: "M -20 6 C -26 -18 -10 -34 10 -30 C 24 -27 30 -18 32 -10 C 22 -18 6 -22 -6 -14 C -12 -8 -14 0 -20 6 Z", fill: { gradient: ["#1A1428", "base"], from: [0, -32], to: [0, 6], alpha: 0.95 }, stroke: INK, strokeWidth: 1.6, z: 14.1 }],
      [{ bone: "horn", d: "M 0 0 C -10 -6 -16 -18 -8 -28 C -8 -18 -2 -10 6 -6 Z", fill: { tint: "accent", alpha: 0.6 }, blur: 1.5, z: 11.8, emissive: true }]],
    water: [[{ bone: "head", d: "M -10 -4 C -22 -10 -26 -22 -20 -30 C -16 -22 -10 -16 -2 -14 Z", fill: { tint: "accent", alpha: 0.8 }, stroke: INK, strokeWidth: 1.4, z: 11.8 },
      { bone: "head", d: "M -18 -20 L -8 -14 M -21 -26 L -8 -16", stroke: INK, strokeWidth: 1, z: 11.9 }],
      [{ bone: "head", d: "M -12 -16 C -8 -30 2 -32 6 -24 C 2 -26 -4 -22 -12 -16 Z", fill: { tint: "accent", alpha: 0.85 }, stroke: INK, strokeWidth: 1.2, z: 14.1 }]],
    plasma: [[{ bone: "horn", d: "M 10 -6 C 8 -14 12 -20 8 -26", stroke: { tint: "base" }, strokeWidth: 3, z: 11.8 },
      { bone: "horn", d: ell(8, -29, 4.5, 4.5), fill: { tint: "accent" }, stroke: INK, strokeWidth: 1.2, z: 11.9, emissive: true }],
      [{ bone: "head", d: ell(-4, -22, 6, 5), fill: { tint: "baseLight", alpha: 0.8 }, stroke: INK, strokeWidth: 1.2, z: 14.1 }]],
    light: [[{ bone: "horn", d: "M 4 2 C -8 -6 -22 -16 -30 -32 C -16 -24 -4 -16 8 -4 Z", fill: { color: "#FFFFFF", alpha: 0.9 }, stroke: INK, strokeWidth: 1.2, z: 11.8 },
      { bone: "horn", d: "M 10 0 C 0 -10 -8 -22 -12 -36 C -2 -26 8 -14 14 -2 Z", fill: { tint: "baseLight" }, stroke: INK, strokeWidth: 1.2, z: 11.7 }],
      [{ bone: "head", d: ell(4, -30, 10, 3), stroke: glow(0.9), strokeWidth: 2.4, z: 14.1, emissive: true }]],
  };
  out.push(...orn[f][v % 2]!);
  return mk(`head_${f}_`, out);
}

// ── EYES ─────────────────────────────────────────────────────────────────────
const EYE_WHITE = "M 3 -8 C 7 -14 17 -14 21 -8 C 17 -4 8 -3 3 -8 Z";
const OPEN = { slot: "eyes" as const, states: ["open"] };
export function eyeParts(style: string): PartDef[] {
  const base: P[] = [{ bone: "eye", d: ell(12, -8, 11, 7), fill: { color: "#FFF0C8", alpha: 0.45 }, blur: 4, z: 14.5, emissive: true, face: OPEN }];
  const white: P = { bone: "eye", d: EYE_WHITE, fill: { color: "#FFF8EC" }, stroke: INK, strokeWidth: 1.6, z: 15, face: OPEN };
  const shine: P = { bone: "eye", d: ell(15.2, -10.4, 1.2, 1.2), fill: { color: "#FFFFFF" }, z: 18, face: OPEN };
  const styles: Record<string, P[]> = {
    slit: [white, { bone: "eye", d: ell(13, -8.6, 3.4, 4.2), fill: { gradient: ["accentLight", "eye"], from: [0, -13], to: [0, -4] }, z: 16, face: OPEN },
      { bone: "eye", d: "M 13 -12.2 C 14.2 -10 14.2 -7 13 -4.8 C 11.8 -7 11.8 -10 13 -12.2 Z", fill: { color: "#1A0C10" }, z: 17, face: OPEN }, shine],
    round: [white, { bone: "eye", d: ell(13, -8.6, 3.6, 3.8), fill: { tint: "eye" }, stroke: INK, strokeWidth: 0.8, z: 16, face: OPEN },
      { bone: "eye", d: ell(13.4, -8.4, 1.6, 1.6), fill: { color: "#140C18" }, z: 17, face: OPEN }, shine],
    ring: [white, { bone: "eye", d: ell(13, -8.6, 3.6, 3.8), stroke: { tint: "accent" }, strokeWidth: 1.6, z: 16, face: OPEN },
      { bone: "eye", d: ell(13, -8.6, 1, 1), fill: { color: "#140C18" }, z: 17, face: OPEN }, shine],
    glow: [{ bone: "eye", d: EYE_WHITE, fill: { gradient: ["#FFFFFF", "eye"], from: [0, -13], to: [0, -4] }, stroke: INK, strokeWidth: 1.6, z: 15, face: OPEN },
      { bone: "eye", d: EYE_WHITE, fill: glow(0.7), blur: 3, z: 15.5, emissive: true, face: OPEN }, shine],
    twin: [{ bone: "eye", d: "M 4 -7 C 7 -12 14 -12 17 -7 C 14 -4 8 -4 4 -7 Z", fill: { color: "#FFF8EC" }, stroke: INK, strokeWidth: 1.4, z: 15, face: OPEN },
      { bone: "eye", d: "M -2 -15 C 0 -18 5 -18 7 -15 C 5 -13 1 -13 -2 -15 Z", fill: { color: "#FFF8EC" }, stroke: INK, strokeWidth: 1.2, z: 15, face: OPEN },
      { bone: "eye", d: `${ell(11, -7.6, 1.6, 2.2)} ${ell(3, -15, 1, 1.3)}`, fill: { tint: "eye" }, z: 16, face: OPEN },
      { bone: "eye", d: `${ell(11, -7.6, 0.7, 1.4)} ${ell(3, -15, 0.5, 0.8)}`, fill: { color: "#140C18" }, z: 17, face: OPEN }],
    visor: [{ bone: "eye", d: "M 0 -11 L 24 -11 C 25 -8 24 -6 22 -5 L 2 -5 C 0 -6 -1 -8 0 -11 Z", fill: { color: "#141A26" }, stroke: INK, strokeWidth: 1.6, z: 15, face: OPEN },
      { bone: "eye", d: "M 3 -9 L 21 -9 L 20 -7 L 4 -7 Z", fill: { tint: "eye" }, z: 16, emissive: true, face: OPEN },
      { bone: "eye", d: "M 3 -9 L 21 -9 L 20 -7 L 4 -7 Z", fill: glow(0.8), blur: 2.5, z: 16.5, emissive: true, face: OPEN }],
  };
  return mk(`eye_${style}_`, [...base, ...(styles[style] ?? styles.slit!)]);
}

// ── LEGS ─────────────────────────────────────────────────────────────────────
const LEG = "M -10 -6 C -12 3 -7 9 -4 15 C -5 18 -7 21 -6 23.5 C -2 24.5 6 24.5 10 23.5 C 10 21 7 19 5 16 C 8 9 11 0 8 -7 C 3 -10 -6 -10 -10 -6 Z";
const LEG_ROOT = "M -9 -6 C -11 4 -8 12 -7 18 L -12 24 L -4 22 L 0 25 L 4 22 L 12 24 L 7 18 C 9 10 10 2 8 -7 C 2 -10 -5 -10 -9 -6 Z";
const LEG_ARMOR = "M -10 -6 L -9 8 L -6 10 L -6 20 L -9 24 L 11 24 L 8 20 L 7 10 L 9 8 L 9 -7 C 3 -10 -5 -10 -10 -6 Z";
const LEG_PILLAR = "M -8 -6 L -10 12 L -7 24 L 9 24 L 11 12 L 8 -7 C 3 -9 -4 -9 -8 -6 Z";
const LEG_FLIPPER = "M -8 -6 C -10 4 -6 10 -4 14 C -10 18 -14 22 -12 24 C -4 25 10 25 14 22 C 10 18 6 16 5 13 C 8 6 10 -1 8 -7 C 3 -9 -4 -9 -8 -6 Z";
const LEG_BLOB = "M -10 -4 C -14 10 -10 22 0 22 C 10 22 14 10 10 -4 C 4 -9 -4 -9 -10 -4 Z";
const WISP = "M -8 -4 C -6 8 2 12 -2 22 C 6 16 10 10 6 -4 Z";

export function legParts(fIn: Fam, v: number): { parts: PartDef[]; float: boolean } {
  const f = baseFam(fIn);
  const float = f === "shadow" || f === "light";
  const shape: Record<BaseFam, string> = { fire: LEG, rock: LEG, plant: LEG_ROOT, electric: LEG_ARMOR, crystal: LEG_PILLAR, shadow: WISP, water: LEG_FLIPPER, plasma: LEG_BLOB, light: WISP };
  const d = shape[f];
  const a = BODY_ALPHA[f] ?? 1;
  const out: P[] = [];
  for (const [bone, near] of [["legBF", false], ["legFF", false], ["legBN", true], ["legFN", true]] as const) {
    if (float) {
      out.push({ bone, d, fill: { tint: near ? (f === "light" ? "baseLight" : "base") : "baseShade", alpha: 0.55 }, blur: 1.2, z: near ? 5 : 1 });
      continue;
    }
    out.push({ bone, d, fill: near ? { gradient: ["base", "baseShade"], from: [0, -4], to: [0, 24], alpha: a } : { tint: "baseShade", alpha: a }, stroke: INK, strokeWidth: 2.4, z: near ? 20 : 1 });
    if (!near) continue;
    if (f === "fire" || f === "rock") out.push({ bone, d: "M 2 24 L 5 26.5 L 6.5 23.8 Z M 6.5 23.6 L 10 26 L 10.5 22.8 Z M -2 24 L 1 26.5 L 2.5 24 Z", fill: { color: "#F2E2C8" }, stroke: INK, strokeWidth: 0.8, z: 21 });
    if (f === "fire") out.push({ bone, d: "M -4 0 L 0 6 L -2 12", stroke: { tint: "accent" }, strokeWidth: 1.6, z: 21, emissive: true });
    if (f === "electric") out.push({ bone, d: `${ell(0, 9, 4, 3)}`, fill: { gradient: ["#E3E8F0", "#8A94A6"], from: [0, 6], to: [0, 12] }, stroke: INK, strokeWidth: 1, z: 21, sheen: true });
    if (f === "crystal") out.push({ bone, d: "M -6 2 L 0 -4 L 6 4 Z", fill: { color: "#FFFFFF", alpha: 0.4 }, z: 21 });
    if (f === "plant") out.push({ bone, d: "M -4 2 C -2 8 2 10 1 16", stroke: { tint: "baseShade" }, strokeWidth: 1.4, z: 21 });
    if (f === "water") out.push({ bone, d: "M -6 22 L -2 18 M 2 23 L 4 18 M 8 22 L 8 17", stroke: { tint: "baseLight" }, strokeWidth: 1, z: 21 });
    if (f === "plasma") out.push({ bone, d: ell(-2, 4, 2, 3), fill: { color: "#FFFFFF", alpha: 0.5 }, z: 21 });
  }
  if (v === 1 && !float) out.push({ bone: "legBN", d: ell(0, 6, 2.4, 1.8), fill: { tint: "accent" }, z: 21, emissive: true }, { bone: "legFN", d: ell(0, 7, 2.2, 1.6), fill: { tint: "accent" }, z: 21, emissive: true });
  return { parts: mk(`legs_${f}_`, out), float };
}

// ── TAIL ─────────────────────────────────────────────────────────────────────
const SEG = (l: number, w0: number, w1: number) => `M 4 ${-w0} L ${-l} ${-w1} C ${-l - 3} 0 ${-l - 3} 0 ${-l} ${w1} L 4 ${w0} C 7 0 7 0 4 ${-w0} Z`;
export function tailParts(fIn: Fam, v: number): PartDef[] {
  const f = baseFam(fIn);
  const thin = f === "light" || f === "shadow";
  const widths: [number, number, number][] = thin ? [[18, 7, 5], [16, 5, 3.5], [14, 3.5, 2.2]] : f === "plasma" ? [[16, 9, 8], [14, 8, 6], [12, 6, 4]] : [[18, 10, 8.5], [16, 8.5, 6.5], [14, 6.5, 4.5]];
  const out: P[] = [];
  const bones = ["tail1", "tail2", "tail3"] as const;
  bones.forEach((b, i) => {
    const [l, w0, w1] = widths[i]!;
    const alpha = f === "shadow" ? 0.85 - i * 0.22 : BODY_ALPHA[f] ?? 1;
    out.push({ bone: b, d: f === "plasma" ? ell(-l / 2, 0, l / 2 + 3, w0) : SEG(l, w0, w1), fill: { tint: "base", alpha }, stroke: f === "shadow" ? undefined : INK, strokeWidth: 2.2, z: 2 });
    if (f === "electric") out.push({ bone: b, d: `M -4 ${-w0 + 1} L -4 ${w0 - 1}`, stroke: { tint: "baseShade" }, strokeWidth: 2, z: 3 });
    if (f === "rock" || f === "fire") out.push({ bone: b, d: `M ${-l / 2} ${-w0} L ${-l / 2 - 3} ${-w0} L ${-l / 2 - 3} ${w0} L ${-l / 2} ${w0} Z`, fill: { tint: "ink", alpha: 0.8 }, z: 3 });
    if (f === "plant") out.push({ bone: b, d: `M 0 ${-w0} C -4 ${-w0 - 6} -10 ${-w0 - 4} -8 ${-w0}`, fill: { tint: "accent" }, stroke: INK, strokeWidth: 1, z: 3 });
  });
  const tip: Record<BaseFam, P[]> = {
    fire: [{ bone: "tail4", d: SEG(14, 4.5, 1.5), fill: { tint: "base" }, stroke: INK, strokeWidth: 2, z: 2 },
      { bone: "tail4", d: "M -9 -2.5 C -13 -6 -17 -3 -22 -6 C -19 -1 -18 3 -13 3 C -11 3 -9 1 -9 -2.5 Z", fill: { tint: "accent" }, z: 3, emissive: true },
      { bone: "tail4", d: ell(-14, 0, 9, 9), fill: glow(0.6), blur: 6, z: 0, emissive: true }],
    rock: [{ bone: "tail4", d: SEG(10, 4.5, 3), fill: { tint: "base" }, stroke: INK, strokeWidth: 2, z: 2 },
      { bone: "tail4", d: v ? "M -8 -6 L -22 0 L -8 6 L -12 0 Z" : ell(-12, 0, 7, 6), fill: { tint: "baseShade" }, stroke: INK, strokeWidth: 1.6, z: 3 }],
    plant: [{ bone: "tail4", d: "M 2 0 C -6 -10 -22 -10 -28 0 C -22 10 -6 10 2 0 Z", fill: { gradient: ["accentLight", "accent"], from: [-28, 0], to: [2, 0] }, stroke: INK, strokeWidth: 1.4, z: 3 },
      { bone: "tail4", d: "M 0 0 L -24 0 M -8 0 L -14 -5 M -14 0 L -20 4", stroke: { tint: "accentShade" }, strokeWidth: 1, z: 3.1 }],
    electric: [{ bone: "tail4", d: v ? "M 4 -4 L -24 0 L 4 4 Z" : `M 4 -3 L -8 -3 L -8 3 L 4 3 Z ${ell(-14, 0, 7, 7)}`, fill: { gradient: ["#E3E8F0", "#7D8798"], from: [0, -6], to: [0, 6] }, stroke: INK, strokeWidth: 1.6, z: 3, sheen: true }],
    crystal: [{ bone: "tail4", d: "M 4 -3 L -6 -8 L -26 0 L -6 8 L 4 3 Z", fill: { gradient: ["#FFFFFF", "accent"], from: [-26, 0], to: [4, 0], alpha: 0.9 }, stroke: INK, strokeWidth: 1.4, z: 3, emissive: true },
      { bone: "tail4", d: ell(-12, 0, 10, 8), fill: glow(0.4), blur: 6, z: 0, emissive: true }],
    shadow: [{ bone: "tail4", d: "M 4 -2 C -6 -6 -14 2 -24 -4 C -16 4 -6 6 4 2 Z", fill: { tint: "base", alpha: 0.3 }, blur: 1.5, z: 2 }],
    water: [{ bone: "tail4", d: SEG(8, 4.5, 3), fill: { tint: "base" }, stroke: INK, strokeWidth: 2, z: 2 },
      { bone: "tail4", d: "M -6 0 C -14 -4 -22 -14 -28 -16 C -24 -6 -24 6 -28 16 C -22 14 -14 4 -6 0 Z", fill: { tint: "accent", alpha: 0.85 }, stroke: INK, strokeWidth: 1.4, z: 3 },
      { bone: "tail4", d: "M -12 0 L -26 -10 M -12 0 L -26 10 M -12 0 L -27 0", stroke: { tint: "accentShade" }, strokeWidth: 0.9, z: 3.1 }],
    plasma: [{ bone: "tail4", d: ell(-6, 0, 7, 6), fill: { tint: "base", alpha: 0.78 }, stroke: INK, strokeWidth: 2, z: 2 },
      { bone: "tail4", d: ell(-6, 0, 3, 3), fill: { tint: "accent" }, z: 3, emissive: true }],
    light: [{ bone: "tail4", d: "M 4 0 C -6 -8 -18 -10 -30 -6 C -20 -2 -20 2 -30 6 C -18 10 -6 8 4 0 Z", fill: { color: "#FFFFFF", alpha: 0.9 }, stroke: INK, strokeWidth: 1.2, z: 3 },
      { bone: "tail4", d: ell(-16, 0, 12, 6), fill: glow(0.35), blur: 5, z: 0, emissive: true }],
  };
  out.push(...tip[f]);
  return mk(`tail_${f}_`, out);
}

// ── BACK APPENDAGE (crest1 head, crest2 neck, crest3 back) ───────────────────
const FLAME_A = "M 0 2 C -8 0 -12 -10 -6 -18 C -4 -24 -6 -28 -2 -34 C 2 -26 10 -22 9 -12 C 10 -4 6 2 0 2 Z";
const FLAME_IN = "M 0 0 C -4 -1 -6 -7 -3 -11 C -2 -14 -2 -17 0 -21 C 2 -16 5 -13 4 -7 C 5 -3 3 0 0 0 Z";
const LEAF = "M 0 2 C -10 -6 -10 -22 0 -32 C 10 -22 10 -6 0 2 Z";
const PLATE = "M -6 2 L -4 -22 L 6 -28 L 8 2 Z";
const SHARD = "M -4 2 L -6 -18 L 0 -34 L 6 -18 L 4 2 Z";
const SMOKE = "M 0 2 C -10 -4 -4 -14 -10 -22 C -2 -20 6 -28 2 -36 C 12 -28 12 -14 6 -6 C 8 -2 4 2 0 2 Z";
const SPIKE = "M -5 2 L 0 -20 L 5 2 Z";
const FEATHER = "M 0 2 C -6 -8 -6 -22 2 -32 C 4 -22 8 -10 0 2 Z";

export function backParts(fIn: Fam, v: number): PartDef[] {
  const f = baseFam(fIn);
  const out: P[] = [];
  const at = [["crest3", 3, 0.85], ["crest2", 4, 1], ["crest1", 5, 1.05]] as const;
  const scale = (d: string, k: number) => d.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(Number(n) * k * 10) / 10));
  for (const [bone, z, k] of at) {
    switch (f) {
      case "fire":
        out.push({ bone, d: scale(FLAME_A, k), fill: { gradient: ["accentLight", "accent"], from: [0, -32], to: [0, 2] }, z, emissive: true });
        out.push({ bone, d: scale(FLAME_IN, k), fill: { color: "#FFF1B8", alpha: 0.9 }, z: z + 0.1, emissive: true });
        break;
      case "plant":
        out.push({ bone, d: scale(LEAF, k), fill: { gradient: ["accentLight", "accent"], from: [0, -32], to: [0, 2] }, stroke: INK, strokeWidth: 1.4, z });
        out.push({ bone, d: scale("M 0 0 L 0 -28", k), stroke: { tint: "accentShade" }, strokeWidth: 1, z: z + 0.1 });
        break;
      case "electric":
        out.push({ bone, d: scale(PLATE, k), fill: { gradient: ["#E3E8F0", "#7D8798"], from: [0, -28], to: [0, 2] }, stroke: INK, strokeWidth: 1.6, z, sheen: true });
        out.push({ bone, d: ell(1, -8 * k, 1.6, 1.6), fill: { tint: "accent" }, z: z + 0.1, emissive: true });
        break;
      case "crystal":
        out.push({ bone, d: scale(SHARD, k), fill: { gradient: ["#FFFFFF", "accent"], from: [0, -34], to: [0, 2], alpha: 0.9 }, stroke: INK, strokeWidth: 1.4, z, emissive: true });
        out.push({ bone, d: scale("M 0 -32 L 0 0", k), stroke: { color: "#FFFFFF", alpha: 0.7 }, strokeWidth: 1, z: z + 0.1 });
        break;
      case "shadow":
        out.push({ bone, d: scale(SMOKE, k), fill: { tint: "accent", alpha: 0.55 }, blur: 1.5, z, emissive: true });
        break;
      case "water":
        if (bone === "crest1") break;
        out.push({ bone, d: scale("M -8 2 C -10 -16 0 -28 12 -30 C 6 -20 8 -8 12 2 Z", k), fill: { tint: "accent", alpha: 0.85 }, stroke: INK, strokeWidth: 1.4, z });
        out.push({ bone, d: scale("M -4 0 L 6 -24 M 2 0 L 9 -16", k), stroke: { tint: "accentShade" }, strokeWidth: 1, z: z + 0.1 });
        break;
      case "plasma":
        out.push({ bone, d: ell(0, -12 * k, 8 * k * (v ? 0.8 : 1), 8 * k * (v ? 0.8 : 1)), fill: { tint: "accent", alpha: 0.55 }, stroke: INK, strokeWidth: 1.2, z });
        out.push({ bone, d: ell(-3 * k, -15 * k, 2, 2), fill: { color: "#FFFFFF", alpha: 0.8 }, z: z + 0.1 });
        break;
      case "light":
        out.push({ bone, d: scale(FEATHER, k), fill: { color: "#FFFFFF", alpha: 0.95 }, stroke: INK, strokeWidth: 1.2, z });
        break;
      case "rock":
        out.push({ bone, d: scale(SPIKE, k), fill: { tint: "baseShade" }, stroke: INK, strokeWidth: 1.6, z });
        break;
    }
  }
  if (f === "light" || (f === "crystal" && v === 1) || (f === "electric" && v === 1)) {
    // Wings on the shoulders.
    const wing = f === "light" ? "M 0 0 C -10 -20 -36 -34 -50 -30 C -40 -22 -42 -14 -30 -10 C -40 -6 -38 0 -26 0 C -18 4 -8 4 0 0 Z" : "M 0 0 L -34 -30 L -26 -10 L -42 -14 L -22 2 Z";
    out.push({ bone: "crest3", d: wing, fill: f === "light" ? { color: "#FFFFFF", alpha: 0.92 } : { gradient: ["#FFFFFF", "accent"], from: [-40, -30], to: [0, 0], alpha: 0.85 }, stroke: INK, strokeWidth: 1.4, z: 2.5, emissive: f !== "light" });
  }
  if (f === "fire") out.push({ bone: "crest1", d: ell(-2, -14, 20, 22), fill: glow(0.4), blur: 12, z: 0, emissive: true });
  return mk(`back_${f}_`, out);
}

// ── PATTERNS ─────────────────────────────────────────────────────────────────
export function patternParts(p: string): PartDef[] {
  const map: Record<string, P[]> = {
    seams: [{ bone: "body", d: "M -26 -8 Q -17 -13 -9 -7 Q -1 -1 7 -9 M 6 -17 Q 14 -13 23 -15", stroke: glow(0.8), strokeWidth: 4, blur: 3, z: 8.8, emissive: true },
      { bone: "body", d: "M -26 -8 Q -17 -13 -9 -7 Q -1 -1 7 -9 M 6 -17 Q 14 -13 23 -15", stroke: { tint: "accent" }, strokeWidth: 1.6, z: 9, emissive: true }],
    spots: [{ bone: "body", d: `${ell(18, -3, 4.2, 3)} ${ell(25, 2, 2.4, 1.8)} ${ell(-21, -3, 4, 2.8)} ${ell(-14, 2, 2.2, 1.6)} ${ell(-4, -14, 3, 2)}`, fill: { tint: "accent" }, z: 9, emissive: true }],
    stripes: [{ bone: "body", d: "M -22 -20 L -18 4 M -10 -24 L -6 6 M 2 -24 L 6 6 M 14 -22 L 17 4", stroke: { tint: "baseShade" }, strokeWidth: 3, z: 8.9 }],
    veins: [{ bone: "body", d: "M -28 0 C -20 -4 -14 -2 -8 -8 C -4 -12 2 -12 6 -16 M -8 -8 C -6 -2 -2 2 4 2 M 6 -16 C 12 -18 18 -14 24 -16", stroke: { tint: "accent", alpha: 0.85 }, strokeWidth: 1.2, z: 9, emissive: true }],
    rings: [{ bone: "body", d: `${ell(-14, -8, 5, 4)} ${ell(8, -12, 4, 3)} ${ell(20, 0, 3, 2.4)}`, stroke: { tint: "accent", alpha: 0.9 }, strokeWidth: 1.4, z: 9, emissive: true }],
    facets: [{ bone: "body", d: "M -20 -6 L -10 -20 L -2 -6 Z M 6 -8 L 14 -20 L 22 -8 Z", fill: { tint: "baseLight", alpha: 0.6 }, stroke: { tint: "baseShade" }, strokeWidth: 0.8, z: 9 }],
    rivets: [{ bone: "body", d: `${ell(-24, -10, 1.6, 1.6)} ${ell(-14, -14, 1.6, 1.6)} ${ell(-4, -16, 1.6, 1.6)} ${ell(6, -16, 1.6, 1.6)} ${ell(16, -14, 1.6, 1.6)} ${ell(26, -10, 1.6, 1.6)}`, fill: { color: "#E3E8F0" }, stroke: INK, strokeWidth: 0.6, z: 9 }],
    none: [],
  };
  return mk(`pat_${p}_`, map[p] ?? []);
}
