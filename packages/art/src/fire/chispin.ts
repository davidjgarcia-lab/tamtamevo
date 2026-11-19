import type { ClipDef, EmitterDef, PaletteGenes, RigDef } from "@tamtam/rig";

/**
 * CHISPÍN — fire_baby_chispin (Brasálidos, Bebé)
 * Silueta: bolita blanda con una única llama en la cabeza y dos patitas.
 * Espacio local: origen en el suelo, entre los pies; y crece hacia abajo; ~125 u de alto con la llama.
 * Todas las partes usan canales de tinte → los alelos de color recolorean en runtime.
 */

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

const BODY =
  "M 0 -86 C 18 -86 40 -74 44 -50 C 48 -26 40 -4 22 -1 C 10 1 -10 1 -22 -1 C -40 -4 -48 -26 -44 -50 C -40 -74 -18 -86 0 -86 Z";
const BODY_SHADE =
  "M 44 -50 C 48 -26 40 -4 22 -1 C 10 1 -10 1 -22 -1 C -34 -3 -42 -12 -44 -24 C -30 -10 -6 -8 14 -16 C 32 -24 42 -36 44 -50 Z";
const BODY_RIM = "M -38 -62 C -32 -76 -18 -83 -4 -84 C -18 -80 -30 -72 -36 -58 Z";

const FLAME_OUTER =
  "M 0 4 C -14 2 -17 -12 -9 -22 C -4 -28 -6 -34 0 -42 C 3 -31 13 -26 13 -14 C 14 -4 8 2 0 4 Z";
const FLAME_INNER =
  "M 0 2 C -7 1 -8 -8 -3 -14 C -1 -17 -1 -21 1 -25 C 3 -18 7 -14 6 -7 C 6 -2 3 1 0 2 Z";
const FLAME_TIP = "M 0 0 C -3 -4 -1 -8 1 -12 C 3 -8 4 -3 0 0 Z";

export const chispinRig: RigDef = {
  id: "fire_baby_chispin",
  bones: [
    { id: "root", parent: null, x: 0, y: 0 },
    { id: "footL", parent: "root", x: -20, y: 1 },
    { id: "footR", parent: "root", x: 20, y: 1 },
    { id: "body", parent: "root", x: 0, y: 0 },
    { id: "handL", parent: "body", x: -44, y: -30 },
    { id: "handR", parent: "body", x: 44, y: -30 },
    { id: "flame", parent: "body", x: 0, y: -82 },
    { id: "flameTip", parent: "flame", x: 0, y: -38 },
    { id: "face", parent: "body", x: 0, y: -46 },
    { id: "eyeL", parent: "face", x: -16, y: 0 },
    { id: "eyeR", parent: "face", x: 16, y: 0 },
    { id: "cheekL", parent: "face", x: -27, y: 11 },
    { id: "cheekR", parent: "face", x: 27, y: 11 },
    { id: "mouth", parent: "face", x: 0, y: 13 },
  ],
  breathBone: "body",
  eyeBones: ["eyeL", "eyeR"],
  secondary: [
    { bone: "flame", driver: "body", lag: 0.12, gain: 0.9, velocityGain: 0.06, sway: { amp: 3, freq: 0.7 }, flicker: { amp: 0.07, freq: 2.3 } },
    { bone: "flameTip", driver: "body", lag: 0.22, gain: 1.3, velocityGain: 0.1, sway: { amp: 6, freq: 1.1 }, flicker: { amp: 0.15, freq: 3.1 } },
  ],
  parts: [
    // Glow behind everything (warm light the flame casts).
    { id: "flameGlow", bone: "flame", d: ellipse(0, -16, 24, 28), fill: { tint: "glow", alpha: 0.55 }, blur: 12, z: 0 },
    // Feet and hands peek out from behind the body.
    { id: "footL", bone: "footL", d: ellipse(0, 0, 11, 7), fill: { tint: "baseShade" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 1 },
    { id: "footR", bone: "footR", d: ellipse(0, 0, 11, 7), fill: { tint: "baseShade" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 1 },
    { id: "handL", bone: "handL", d: ellipse(0, 0, 7.5, 6.5), fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 2 },
    { id: "handR", bone: "handR", d: ellipse(0, 0, 7.5, 6.5), fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 2 },
    // Flame grows from the top of the head (drawn before the body so the base tucks in).
    { id: "flameOuter", bone: "flame", d: FLAME_OUTER, fill: { tint: "accent" }, z: 3 },
    { id: "flameTip", bone: "flameTip", d: FLAME_TIP, fill: { tint: "accent" }, z: 3 },
    { id: "flameInner", bone: "flame", d: FLAME_INNER, fill: { tint: "accentLight" }, z: 4 },
    // Body: outline is a thick stroke under the fill so only the outer half shows.
    { id: "bodyLine", bone: "body", d: BODY, stroke: { tint: "ink" }, strokeWidth: 7, z: 5 },
    { id: "body", bone: "body", d: BODY, fill: { tint: "base" }, z: 6 },
    { id: "bodyShade", bone: "body", d: BODY_SHADE, fill: { tint: "baseShade", alpha: 0.85 }, z: 7 },
    { id: "belly", bone: "body", d: ellipse(0, -20, 22, 14), fill: { tint: "accentLight", alpha: 0.9 }, z: 8 },
    { id: "bodyRim", bone: "body", d: BODY_RIM, fill: { tint: "baseLight" }, z: 8 },
    { id: "bodySpec", bone: "body", d: ellipse(-26, -66, 5, 3.2), fill: { color: "#FFFFFF", alpha: 0.75 }, z: 9 },
    // Cheeks (blush).
    { id: "cheekL", bone: "cheekL", d: ellipse(0, 0, 7, 4), fill: { color: "#FF3D6E", alpha: 0.38 }, blur: 1.5, z: 10 },
    { id: "cheekR", bone: "cheekR", d: ellipse(0, 0, 7, 4), fill: { color: "#FF3D6E", alpha: 0.38 }, blur: 1.5, z: 10 },
    // Eyes — open.
    ...(["eyeL", "eyeR"] as const).flatMap((bone) => [
      { id: `${bone}Ball`, bone, d: ellipse(0, 0, 8.5, 10.5), fill: { tint: "eye" as const }, z: 11, face: { slot: "eyes" as const, states: ["open"] } },
      { id: `${bone}Iris`, bone, d: "M -7.2 4 C -5 10.5 5 10.5 7.2 4 C 4 7 -4 7 -7.2 4 Z", fill: { tint: "accent" as const }, z: 12, face: { slot: "eyes" as const, states: ["open"] } },
      { id: `${bone}Shine`, bone, d: ellipse(-2.8, -4.2, 3.4, 3.6), fill: { color: "#FFFFFF" }, z: 13, face: { slot: "eyes" as const, states: ["open"] } },
      { id: `${bone}Shine2`, bone, d: ellipse(3.2, 3, 1.5, 1.5), fill: { color: "#FFFFFF", alpha: 0.9 }, z: 13, face: { slot: "eyes" as const, states: ["open"] } },
      // Happy ^ ^
      { id: `${bone}Happy`, bone, d: "M -8 3 Q 0 -9 8 3", stroke: { tint: "ink" as const }, strokeWidth: 3.6, z: 11, face: { slot: "eyes" as const, states: ["happy"] } },
      // Asleep — soft downward lids with lashes.
      { id: `${bone}Closed`, bone, d: "M -8 -1 Q 0 6 8 -1", stroke: { tint: "ink" as const }, strokeWidth: 3.4, z: 11, face: { slot: "eyes" as const, states: ["closed"] } },
    ]),
    // Mouths.
    { id: "mouthSmile", bone: "mouth", d: "M -6 -1 Q -3 3.5 0 -0.5 Q 3 3.5 6 -1", stroke: { tint: "ink" }, strokeWidth: 2.6, z: 11, face: { slot: "mouth", states: ["smile"] } },
    { id: "mouthOpen", bone: "mouth", d: "M -7.5 -1 Q 0 13 7.5 -1 Q 0 -4 -7.5 -1 Z", fill: { color: "#5A1426" }, stroke: { tint: "ink" }, strokeWidth: 2.2, z: 11, face: { slot: "mouth", states: ["open"] } },
    { id: "mouthTongue", bone: "mouth", d: "M -4 6 Q 0 2 4 6 Q 0 10 -4 6 Z", fill: { color: "#FF7A8A" }, z: 12, face: { slot: "mouth", states: ["open", "content"] } },
    { id: "mouthChew", bone: "mouth", d: "M -6 1 Q -3 -2 0 1 Q 3 -2 6 1", stroke: { tint: "ink" }, strokeWidth: 2.6, z: 11, face: { slot: "mouth", states: ["chew"] } },
    { id: "mouthContent", bone: "mouth", d: "M -8 -1.5 Q 0 10 8 -1.5 Q 0 2 -8 -1.5 Z", fill: { color: "#5A1426" }, stroke: { tint: "ink" }, strokeWidth: 2.2, z: 11, face: { slot: "mouth", states: ["content"] } },
    { id: "mouthO", bone: "mouth", d: ellipse(0, 2, 2.6, 2.2), fill: { color: "#5A1426" }, z: 11, face: { slot: "mouth", states: ["o"] } },
  ],
};

// ── Clips ────────────────────────────────────────────────────────────────────

const idle: ClipDef = {
  id: "idle",
  duration: 2.4,
  loop: true,
  tracks: {
    body: { rot: [{ t: 0, v: -1.5 }, { t: 1.2, v: 1.5 }, { t: 2.4, v: -1.5 }] },
    face: { x: [{ t: 0, v: 0 }, { t: 1.05, v: 0 }, { t: 1.25, v: 3.5 }, { t: 1.9, v: 3.5 }, { t: 2.1, v: 0 }, { t: 2.4, v: 0 }] },
    handL: { y: [{ t: 0, v: 0 }, { t: 1.2, v: -1.5 }, { t: 2.4, v: 0 }] },
    handR: { y: [{ t: 0, v: -1.5 }, { t: 1.2, v: 0 }, { t: 2.4, v: -1.5 }] },
  },
};

const step = 0.28;
const walk: ClipDef = {
  id: "walk",
  duration: step * 2,
  loop: true,
  breath: 0.3,
  tracks: {
    body: {
      y: [{ t: 0, v: 0, e: "out" }, { t: step / 2, v: -7, e: "in" }, { t: step, v: 0, e: "out" }, { t: step * 1.5, v: -7, e: "in" }, { t: step * 2, v: 0 }],
      rot: [{ t: 0, v: -4 }, { t: step, v: 4 }, { t: step * 2, v: -4 }],
      sy: [{ t: 0, v: 0.93 }, { t: 0.07, v: 1.05 }, { t: step / 2, v: 1.02 }, { t: step, v: 0.93 }, { t: step + 0.07, v: 1.05 }, { t: step * 1.5, v: 1.02 }, { t: step * 2, v: 0.93 }],
      sx: [{ t: 0, v: 1.05 }, { t: 0.07, v: 0.97 }, { t: step, v: 1.05 }, { t: step + 0.07, v: 0.97 }, { t: step * 2, v: 1.05 }],
    },
    footL: {
      x: [{ t: 0, v: 6, e: "linear" }, { t: step, v: -6 }, { t: step * 2, v: 6 }],
      y: [{ t: 0, v: 0 }, { t: step, v: 0, e: "out" }, { t: step * 1.5, v: -9, e: "in" }, { t: step * 2, v: 0 }],
    },
    footR: {
      x: [{ t: 0, v: -6 }, { t: step, v: 6, e: "linear" }, { t: step * 2, v: -6 }],
      y: [{ t: 0, v: 0, e: "out" }, { t: step / 2, v: -9, e: "in" }, { t: step, v: 0 }, { t: step * 2, v: 0 }],
    },
    handL: { rot: [{ t: 0, v: -18 }, { t: step, v: 18 }, { t: step * 2, v: -18 }] },
    handR: { rot: [{ t: 0, v: -18 }, { t: step, v: 18 }, { t: step * 2, v: -18 }] },
    face: { x: [{ t: 0, v: 3 }] },
  },
};

const eat: ClipDef = {
  id: "eat",
  duration: 2.2,
  loop: true,
  face: {
    mouth: [
      { t: 0, v: "smile" }, { t: 0.1, v: "open" }, { t: 0.32, v: "chew" }, { t: 0.52, v: "smile" }, { t: 0.72, v: "chew" },
      { t: 0.92, v: "smile" }, { t: 1.12, v: "chew" }, { t: 1.32, v: "smile" }, { t: 1.52, v: "chew" }, { t: 1.75, v: "content" },
    ],
    eyes: [{ t: 0, v: "open" }, { t: 0.32, v: "happy" }, { t: 1.45, v: "open" }, { t: 1.75, v: "happy" }],
  },
  tracks: {
    body: {
      sy: [
        { t: 0, v: 1 }, { t: 0.12, v: 1.07, e: "out" }, { t: 0.32, v: 0.9, e: "out" }, { t: 0.45, v: 1 },
        { t: 0.62, v: 0.96 }, { t: 0.82, v: 1 }, { t: 1.02, v: 0.96 }, { t: 1.22, v: 1 }, { t: 1.42, v: 0.96 }, { t: 1.62, v: 1 },
        { t: 1.8, v: 1.04 }, { t: 2.2, v: 1 },
      ],
      sx: [{ t: 0, v: 1 }, { t: 0.12, v: 0.96 }, { t: 0.32, v: 1.07 }, { t: 0.45, v: 1 }, { t: 2.2, v: 1 }],
      rot: [{ t: 0, v: 0 }, { t: 0.12, v: -3 }, { t: 0.32, v: 2 }, { t: 1.8, v: 0 }, { t: 2.0, v: 3 }, { t: 2.2, v: 0 }],
    },
    face: { y: [{ t: 0, v: 0 }, { t: 0.12, v: -2.5 }, { t: 0.32, v: 2 }, { t: 0.5, v: 0 }, { t: 2.2, v: 0 }] },
    cheekL: { sx: [{ t: 0, v: 1 }, { t: 0.35, v: 1.45 }, { t: 1.6, v: 1.45 }, { t: 1.85, v: 1 }], sy: [{ t: 0, v: 1 }, { t: 0.35, v: 1.6 }, { t: 1.6, v: 1.6 }, { t: 1.85, v: 1 }] },
    cheekR: { sx: [{ t: 0, v: 1 }, { t: 0.35, v: 1.45 }, { t: 1.6, v: 1.45 }, { t: 1.85, v: 1 }], sy: [{ t: 0, v: 1 }, { t: 0.35, v: 1.6 }, { t: 1.6, v: 1.6 }, { t: 1.85, v: 1 }] },
    handL: { y: [{ t: 0, v: 0 }, { t: 0.15, v: -10 }, { t: 0.35, v: -4 }, { t: 1.7, v: -4 }, { t: 1.9, v: 0 }], x: [{ t: 0, v: 0 }, { t: 0.15, v: 8 }, { t: 1.7, v: 8 }, { t: 1.9, v: 0 }] },
    handR: { y: [{ t: 0, v: 0 }, { t: 0.15, v: -10 }, { t: 0.35, v: -4 }, { t: 1.7, v: -4 }, { t: 1.9, v: 0 }], x: [{ t: 0, v: 0 }, { t: 0.15, v: -8 }, { t: 1.7, v: -8 }, { t: 1.9, v: 0 }] },
  },
  flicker: 1.25,
};

const pet: ClipDef = {
  id: "pet",
  duration: 1.6,
  loop: true,
  face: { eyes: [{ t: 0, v: "happy" }], mouth: [{ t: 0, v: "content" }] },
  tracks: {
    body: {
      rot: [{ t: 0, v: -6 }, { t: 0.8, v: 6 }, { t: 1.6, v: -6 }],
      sy: [{ t: 0, v: 1 }, { t: 0.4, v: 0.95 }, { t: 0.8, v: 1 }, { t: 1.2, v: 0.95 }, { t: 1.6, v: 1 }],
      sx: [{ t: 0, v: 1 }, { t: 0.4, v: 1.03 }, { t: 0.8, v: 1 }, { t: 1.2, v: 1.03 }, { t: 1.6, v: 1 }],
    },
    face: { y: [{ t: 0, v: 1 }] },
    cheekL: { sx: [{ t: 0, v: 1.4 }], sy: [{ t: 0, v: 1.4 }] },
    cheekR: { sx: [{ t: 0, v: 1.4 }], sy: [{ t: 0, v: 1.4 }] },
    handL: { y: [{ t: 0, v: -6 }, { t: 0.4, v: -9 }, { t: 0.8, v: -6 }, { t: 1.2, v: -9 }, { t: 1.6, v: -6 }], rot: [{ t: 0, v: -20 }] },
    handR: { y: [{ t: 0, v: -9 }, { t: 0.4, v: -6 }, { t: 0.8, v: -9 }, { t: 1.2, v: -6 }, { t: 1.6, v: -9 }], rot: [{ t: 0, v: 20 }] },
    flame: { sy: [{ t: 0, v: 1.15 }], sx: [{ t: 0, v: 1.08 }] },
  },
  blink: false,
  flicker: 1.4,
};

const sleep: ClipDef = {
  id: "sleep",
  duration: 3.6,
  loop: true,
  face: { eyes: [{ t: 0, v: "closed" }], mouth: [{ t: 0, v: "o" }] },
  breath: 2.6,
  breathRate: 0.28,
  blink: false,
  flicker: 0.35,
  tracks: {
    body: { rot: [{ t: 0, v: 7 }], sy: [{ t: 0, v: 0.9 }], sx: [{ t: 0, v: 1.06 }] },
    face: { y: [{ t: 0, v: 4 }], x: [{ t: 0, v: 2 }] },
    handL: { y: [{ t: 0, v: 6 }], x: [{ t: 0, v: 3 }] },
    handR: { y: [{ t: 0, v: 6 }], x: [{ t: 0, v: -3 }] },
    flame: { sy: [{ t: 0, v: 0.62 }], sx: [{ t: 0, v: 0.85 }], rot: [{ t: 0, v: 14 }] },
    cheekL: { sx: [{ t: 0, v: 1.15 }] },
    cheekR: { sx: [{ t: 0, v: 1.15 }] },
  },
};

export const chispinClips: ClipDef[] = [idle, walk, eat, pet, sleep];
export type ChispinClipId = "idle" | "walk" | "eat" | "pet" | "sleep";

/** Particle emitters by clip (creature-local coordinates). */
export const chispinEmitters: Record<ChispinClipId, EmitterDef[]> = {
  idle: [
    { id: "embers", shape: "ember", rate: 2.2, life: 1.6, x: 0, y: -122, spread: 8, vx: [-6, 6], vy: [-34, -20], gravity: 0, size: [1.6, 3], wobble: 5, color: "#FFD166" },
  ],
  walk: [
    { id: "embers", shape: "ember", rate: 4, life: 1.0, x: -6, y: -118, spread: 6, vx: [-30, -12], vy: [-26, -14], gravity: 0, size: [1.6, 2.8], wobble: 3, color: "#FFD166" },
    { id: "dust", shape: "bubble", rate: 3.6, life: 0.6, x: 0, y: -3, spread: 18, vx: [-24, -8], vy: [-10, -4], gravity: 0, size: [3, 5], color: "#E9C9A8", behind: true },
  ],
  eat: [
    { id: "crumbs", shape: "crumb", rate: 5, life: 0.75, x: 0, y: -32, spread: 6, vx: [-40, 40], vy: [-50, -20], gravity: 220, size: [2, 3.4], spin: 360, color: "#D9944A" },
    { id: "embers", shape: "ember", rate: 3.5, life: 1.3, x: 0, y: -124, spread: 9, vx: [-8, 8], vy: [-40, -24], gravity: 0, size: [1.8, 3.2], wobble: 5, color: "#FFD166" },
  ],
  pet: [
    { id: "hearts", shape: "heart", rate: 1.6, life: 1.7, x: 0, y: -100, spread: 30, vx: [-6, 6], vy: [-36, -24], gravity: 0, size: [4.5, 7], wobble: 6, color: "#FF5E7E" },
    { id: "embers", shape: "ember", rate: 4, life: 1.4, x: 0, y: -126, spread: 10, vx: [-8, 8], vy: [-42, -26], gravity: 0, size: [1.8, 3.4], wobble: 6, color: "#FFE08A" },
  ],
  sleep: [
    { id: "zzz", shape: "z", rate: 0.55, life: 2.8, x: 30, y: -92, spread: 2, vx: [9, 14], vy: [-18, -13], gravity: 0, size: [3.2, 4.6], wobble: 3, color: "#FFF4DD" },
  ],
};

/** Base-colour alleles of the Fire family (EVOLUTION_SYSTEM §6.2). */
export const fireColorAlleles: { id: string; name: string; rank: "D" | "I" | "R"; genes: PaletteGenes }[] = [
  { id: "brasa", name: "Brasa", rank: "D", genes: { base: "#FF6B35", accent: "#FFB627", eye: "#2A1430" } },
  { id: "ceniza", name: "Ceniza", rank: "I", genes: { base: "#8F8794", accent: "#FF8C42", eye: "#1E1A2A" } },
  { id: "oro", name: "Oro Fundido", rank: "I", genes: { base: "#FFB000", accent: "#FF6F3C", eye: "#3A1A10" } },
  { id: "rubi", name: "Rubí Profundo", rank: "R", genes: { base: "#C81D4E", accent: "#FF9F59", eye: "#26101C" } },
  { id: "azul", name: "Azul Llama", rank: "R", genes: { base: "#3A6FE0", accent: "#7FE3FF", eye: "#101A3A", glow: "#9FEFFF" } },
];
