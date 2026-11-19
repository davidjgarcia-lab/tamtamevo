import type { ClipDef, EmitterDef, PaletteGenes, PartDef, RigDef } from "@tamtam/rig";

/**
 * CHISPÍN v2 — fire_baby_chispin (Brasálidos, Bebé) · artStatus: "prototype"
 * Rediseño según ART_BIBLE.md y la hoja de concepto docs/media/concept/chispin-sheet.jpg:
 * mochi redondo, llama única, dos cuernitos de brasa, cejas expresivas, cola corta con ascua,
 * volumen por degradado + sombra + rim light, contorno de color.
 * Espacio local: origen en el suelo entre los pies; y hacia abajo; ~128 u de alto con la llama.
 */

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

const BODY =
  "M 0 -86 C 20 -86 42 -74 46 -50 C 50 -26 42 -4 24 -1 C 10 1 -10 1 -24 -1 C -42 -4 -50 -26 -46 -50 C -42 -74 -20 -86 0 -86 Z";
const BODY_SHADE =
  "M 46 -50 C 50 -26 42 -4 24 -1 C 10 1 -10 1 -24 -1 C -36 -3 -44 -12 -46 -24 C -30 -12 -4 -9 16 -17 C 34 -25 44 -36 46 -50 Z";
const BODY_RIM = "M -40 -62 C -34 -76 -20 -83 -5 -84 C -19 -80 -31 -72 -37 -58 Z";
const BELLY = "M -24 -16 C -24 -32 24 -32 24 -16 C 24 -6 14 -2 0 -2 C -14 -2 -24 -6 -24 -16 Z";

const FLAME_OUTER = "M 0 4 C -14 2 -17 -12 -9 -22 C -4 -28 -6 -34 0 -42 C 3 -31 13 -26 13 -14 C 14 -4 8 2 0 4 Z";
const FLAME_INNER = "M 0 2 C -7 1 -8 -8 -3 -14 C -1 -17 -1 -21 1 -25 C 3 -18 7 -14 6 -7 C 6 -2 3 1 0 2 Z";
const FLAME_TIP = "M 0 0 C -3 -4 -1 -8 1 -12 C 3 -8 4 -3 0 0 Z";
const HORN = "M -6 2 C -6 -4 -4 -10 1 -15 C 2 -10 6 -4 6 2 Z";
const TAIL = "M 0 0 C 10 -2 20 2 24 10 C 22 13 18 13 16 10 C 13 5 7 4 0 6 Z";

const PALETTE_MOUTH = "#5A1426";

const eyeParts = (bone: "eyeL" | "eyeR"): PartDef[] => [
  { id: `${bone}Ball`, bone, d: ellipse(0, 0, 8.5, 10.5), fill: { tint: "eye" }, z: 11, face: { slot: "eyes", states: ["open"] } },
  { id: `${bone}Iris`, bone, d: "M -7.2 4 C -5 10.5 5 10.5 7.2 4 C 4 7 -4 7 -7.2 4 Z", fill: { tint: "accent" }, z: 12, face: { slot: "eyes", states: ["open"] } },
  { id: `${bone}Shine`, bone, d: ellipse(-2.8, -4.2, 3.4, 3.6), fill: { color: "#FFFFFF" }, z: 13, face: { slot: "eyes", states: ["open"] } },
  { id: `${bone}Shine2`, bone, d: ellipse(3.2, 3, 1.5, 1.5), fill: { color: "#FFFFFF", alpha: 0.9 }, z: 13, face: { slot: "eyes", states: ["open"] } },
  { id: `${bone}Happy`, bone, d: "M -8 3 Q 0 -9 8 3", stroke: { tint: "ink" }, strokeWidth: 3.6, z: 11, face: { slot: "eyes", states: ["happy"] } },
  { id: `${bone}Closed`, bone, d: "M -8 -1 Q 0 6 8 -1", stroke: { tint: "ink" }, strokeWidth: 3.4, z: 11, face: { slot: "eyes", states: ["closed"] } },
];

/** Brows are drawn for the left eye and mirrored for the right one. */
const browParts = (bone: "browL" | "browR"): PartDef[] => {
  const m = bone === "browL" ? 1 : -1;
  const p = (pts: [number, number, number, number, number, number]) =>
    `M ${-6 * m + pts[0] * m} ${pts[1]} Q ${pts[2] * m} ${pts[3]} ${6 * m + pts[4] * m} ${pts[5]}`;
  return [
    { id: `${bone}Neutral`, bone, d: p([0, 1, 0, -2, 0, 1]), stroke: { tint: "ink" }, strokeWidth: 2.8, z: 12, face: { slot: "brows", states: ["neutral"] } },
    { id: `${bone}Happy`, bone, d: p([0, 0, 0, -4, 0, 0]), stroke: { tint: "ink" }, strokeWidth: 2.8, z: 12, face: { slot: "brows", states: ["happy"] } },
    // angry: inner end (towards the nose) goes down → V
    { id: `${bone}Angry`, bone, d: p([0, -2, 0, -1, 1, 4]), stroke: { tint: "ink" }, strokeWidth: 3.4, z: 12, face: { slot: "brows", states: ["angry", "determined"] } },
    // sad: inner end goes up → / \
    { id: `${bone}Sad`, bone, d: p([0, 3, 0, 0, 1, -3]), stroke: { tint: "ink" }, strokeWidth: 2.8, z: 12, face: { slot: "brows", states: ["sad"] } },
    { id: `${bone}Up`, bone, d: p([0, -3, 0, -8, 0, -3]), stroke: { tint: "ink" }, strokeWidth: 2.8, z: 12, face: { slot: "brows", states: ["surprised"] } },
  ];
};

export const chispinRig: RigDef = {
  id: "fire_baby_chispin",
  bones: [
    { id: "root", parent: null, x: 0, y: 0 },
    { id: "footL", parent: "root", x: -21, y: 1 },
    { id: "footR", parent: "root", x: 21, y: 1 },
    { id: "body", parent: "root", x: 0, y: 0 },
    { id: "tail", parent: "body", x: 36, y: -14 },
    { id: "tailTip", parent: "tail", x: 22, y: 10 },
    { id: "handL", parent: "body", x: -46, y: -30 },
    { id: "handR", parent: "body", x: 46, y: -30 },
    { id: "prop", parent: "body", x: 0, y: -30 },
    { id: "hornL", parent: "body", x: -20, y: -78, rot: -18 },
    { id: "hornR", parent: "body", x: 20, y: -78, rot: 18 },
    { id: "flame", parent: "body", x: 0, y: -82 },
    { id: "flameTip", parent: "flame", x: 0, y: -38 },
    { id: "face", parent: "body", x: 0, y: -46 },
    { id: "eyeL", parent: "face", x: -16, y: 0 },
    { id: "eyeR", parent: "face", x: 16, y: 0 },
    { id: "browL", parent: "face", x: -16, y: -15 },
    { id: "browR", parent: "face", x: 16, y: -15 },
    { id: "cheekL", parent: "face", x: -28, y: 11 },
    { id: "cheekR", parent: "face", x: 28, y: 11 },
    { id: "mouth", parent: "face", x: 0, y: 13 },
  ],
  breathBone: "body",
  eyeBones: ["eyeL", "eyeR"],
  secondary: [
    { bone: "flame", driver: "body", lag: 0.12, gain: 0.9, velocityGain: 0.06, sway: { amp: 3, freq: 0.7 }, flicker: { amp: 0.07, freq: 2.3 } },
    { bone: "flameTip", driver: "body", lag: 0.22, gain: 1.3, velocityGain: 0.1, sway: { amp: 6, freq: 1.1 }, flicker: { amp: 0.15, freq: 3.1 } },
    { bone: "tail", driver: "body", lag: 0.1, gain: 1.2, velocityGain: 0.05, sway: { amp: 5, freq: 0.5 } },
    { bone: "tailTip", driver: "body", lag: 0.18, gain: 1.6, velocityGain: 0.08, sway: { amp: 8, freq: 0.9 }, flicker: { amp: 0.12, freq: 2.7 } },
  ],
  parts: [
    { id: "flameGlow", bone: "flame", d: ellipse(0, -16, 24, 28), fill: { tint: "glow", alpha: 0.5 }, blur: 12, z: 0 },
    { id: "tailGlow", bone: "tailTip", d: ellipse(0, 0, 9, 9), fill: { tint: "glow", alpha: 0.7 }, blur: 6, z: 0 },
    // Tail behind the body.
    { id: "tail", bone: "tail", d: TAIL, fill: { tint: "baseShade" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 1 },
    { id: "tailEmber", bone: "tailTip", d: ellipse(0, 0, 5.5, 5.5), fill: { tint: "accent" }, z: 2 },
    { id: "tailEmberCore", bone: "tailTip", d: ellipse(-1, -1, 2.6, 2.6), fill: { tint: "accentLight" }, z: 2 },
    { id: "footL", bone: "footL", d: ellipse(0, 0, 11, 7), fill: { tint: "baseShade" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 1 },
    { id: "footR", bone: "footR", d: ellipse(0, 0, 11, 7), fill: { tint: "baseShade" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 1 },
    { id: "handL", bone: "handL", d: ellipse(0, 0, 7.5, 6.5), fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 2 },
    { id: "handR", bone: "handR", d: ellipse(0, 0, 7.5, 6.5), fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 3, z: 2 },
    { id: "hornL", bone: "hornL", d: HORN, fill: { gradient: ["accentShade", "baseShade"], from: [0, -15], to: [0, 2] }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 3 },
    { id: "hornR", bone: "hornR", d: HORN, fill: { gradient: ["accentShade", "baseShade"], from: [0, -15], to: [0, 2] }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 3 },
    { id: "flameOuter", bone: "flame", d: FLAME_OUTER, fill: { tint: "accent" }, z: 3 },
    { id: "flameTip", bone: "flameTip", d: FLAME_TIP, fill: { tint: "accent" }, z: 3 },
    { id: "flameInner", bone: "flame", d: FLAME_INNER, fill: { tint: "accentLight" }, z: 4 },
    { id: "bodyLine", bone: "body", d: BODY, stroke: { tint: "ink" }, strokeWidth: 7, z: 5 },
    { id: "body", bone: "body", d: BODY, fill: { gradient: ["baseLight", "base", "base"], from: [0, -86], to: [0, 0] }, z: 6 },
    { id: "bodyShade", bone: "body", d: BODY_SHADE, fill: { tint: "baseShade", alpha: 0.75 }, z: 7 },
    { id: "belly", bone: "body", d: BELLY, fill: { gradient: ["accentLight", "accent"], from: [0, -30], to: [0, 4], alpha: 0.85 }, z: 8 },
    { id: "bodyRim", bone: "body", d: BODY_RIM, fill: { tint: "baseLight" }, z: 8 },
    { id: "bodySpec", bone: "body", d: ellipse(-27, -66, 5.5, 3.4), fill: { color: "#FFFFFF", alpha: 0.75 }, z: 9 },
    { id: "cheekL", bone: "cheekL", d: ellipse(0, 0, 7, 4), fill: { color: "#FF3D6E", alpha: 0.38 }, blur: 1.5, z: 10 },
    { id: "cheekR", bone: "cheekR", d: ellipse(0, 0, 7, 4), fill: { color: "#FF3D6E", alpha: 0.38 }, blur: 1.5, z: 10 },
    ...eyeParts("eyeL"),
    ...eyeParts("eyeR"),
    ...browParts("browL"),
    ...browParts("browR"),
    // Mouths.
    { id: "mouthSmile", bone: "mouth", d: "M -6 -1 Q -3 3.5 0 -0.5 Q 3 3.5 6 -1", stroke: { tint: "ink" }, strokeWidth: 2.6, z: 11, face: { slot: "mouth", states: ["smile"] } },
    { id: "mouthOpen", bone: "mouth", d: "M -7.5 -1 Q 0 13 7.5 -1 Q 0 -4 -7.5 -1 Z", fill: { color: PALETTE_MOUTH }, stroke: { tint: "ink" }, strokeWidth: 2.2, z: 11, face: { slot: "mouth", states: ["open", "drool"] } },
    { id: "mouthTongue", bone: "mouth", d: "M -4 6 Q 0 2 4 6 Q 0 10 -4 6 Z", fill: { color: "#FF7A8A" }, z: 12, face: { slot: "mouth", states: ["open", "content", "drool"] } },
    { id: "mouthDrool", bone: "mouth", d: "M 5 4 C 7 8 8 11 6 13 C 4 14 3 11 4 8 Z", fill: { color: "#9FE6FF" }, stroke: { color: "#4FA3C7" }, strokeWidth: 1, z: 13, face: { slot: "mouth", states: ["drool"] } },
    { id: "mouthChew", bone: "mouth", d: "M -6 1 Q -3 -2 0 1 Q 3 -2 6 1", stroke: { tint: "ink" }, strokeWidth: 2.6, z: 11, face: { slot: "mouth", states: ["chew"] } },
    { id: "mouthContent", bone: "mouth", d: "M -8 -1.5 Q 0 10 8 -1.5 Q 0 2 -8 -1.5 Z", fill: { color: PALETTE_MOUTH }, stroke: { tint: "ink" }, strokeWidth: 2.2, z: 11, face: { slot: "mouth", states: ["content"] } },
    { id: "mouthO", bone: "mouth", d: ellipse(0, 2, 2.6, 2.2), fill: { color: PALETTE_MOUTH }, z: 11, face: { slot: "mouth", states: ["o"] } },
    { id: "mouthSad", bone: "mouth", d: "M -6 3 Q 0 -3 6 3", stroke: { tint: "ink" }, strokeWidth: 2.6, z: 11, face: { slot: "mouth", states: ["sad"] } },
    { id: "mouthAngry", bone: "mouth", d: "M -7 1 L 7 1", stroke: { tint: "ink" }, strokeWidth: 2.8, z: 11, face: { slot: "mouth", states: ["angry", "grit"] } },
    { id: "mouthFang", bone: "mouth", d: "M 2 1.5 L 4 6 L 6 1.5 Z", fill: { color: "#FFFFFF" }, stroke: { tint: "ink" }, strokeWidth: 1.2, z: 12, face: { slot: "mouth", states: ["angry", "grit"] } },
    // Props (shown by the "prop" slot).
    { id: "dumbbellBar", bone: "prop", d: "M -50 -2.5 L 50 -2.5 L 50 2.5 L -50 2.5 Z", fill: { color: "#6E6A78" }, stroke: { color: "#2A2238" }, strokeWidth: 2, z: 1, face: { slot: "prop", states: ["dumbbell"] } },
    { id: "dumbbellL", bone: "prop", d: "M -62 -11 L -52 -11 L -52 11 L -62 11 Z", fill: { gradient: ["#8B86A0", "#4A4558"], from: [0, -11], to: [0, 11] }, stroke: { color: "#2A2238" }, strokeWidth: 2, z: 1, face: { slot: "prop", states: ["dumbbell"] } },
    { id: "dumbbellR", bone: "prop", d: "M 52 -11 L 62 -11 L 62 11 L 52 11 Z", fill: { gradient: ["#8B86A0", "#4A4558"], from: [0, -11], to: [0, 11] }, stroke: { color: "#2A2238" }, strokeWidth: 2, z: 1, face: { slot: "prop", states: ["dumbbell"] } },
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
    brows: [{ t: 0, v: "surprised" }, { t: 0.32, v: "happy" }],
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
  face: { eyes: [{ t: 0, v: "happy" }], mouth: [{ t: 0, v: "content" }], brows: [{ t: 0, v: "happy" }] },
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
  face: { eyes: [{ t: 0, v: "closed" }], mouth: [{ t: 0, v: "o" }], brows: [{ t: 0, v: "happy" }] },
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

/** Jump of joy: anticipation squash → stretch in the air → squash landing. */
const celebrate: ClipDef = {
  id: "celebrate",
  duration: 1.1,
  loop: true,
  face: { eyes: [{ t: 0, v: "happy" }], mouth: [{ t: 0, v: "content" }], brows: [{ t: 0, v: "happy" }] },
  blink: false,
  flicker: 1.5,
  tracks: {
    body: {
      y: [{ t: 0, v: 0 }, { t: 0.15, v: 2, e: "out" }, { t: 0.45, v: -38, e: "in" }, { t: 0.75, v: 0 }, { t: 1.1, v: 0 }],
      sy: [{ t: 0, v: 1 }, { t: 0.15, v: 0.82, e: "out" }, { t: 0.3, v: 1.14 }, { t: 0.6, v: 1.0 }, { t: 0.75, v: 0.85, e: "out" }, { t: 0.9, v: 1.04 }, { t: 1.1, v: 1 }],
      sx: [{ t: 0, v: 1 }, { t: 0.15, v: 1.14 }, { t: 0.3, v: 0.9 }, { t: 0.6, v: 1 }, { t: 0.75, v: 1.12 }, { t: 0.9, v: 0.98 }, { t: 1.1, v: 1 }],
      rot: [{ t: 0, v: 0 }, { t: 0.45, v: -8 }, { t: 0.75, v: 0 }],
    },
    footL: { y: [{ t: 0, v: 0 }, { t: 0.2, v: 0 }, { t: 0.45, v: -30, e: "in" }, { t: 0.75, v: 0 }] },
    footR: { y: [{ t: 0, v: 0 }, { t: 0.22, v: 0 }, { t: 0.47, v: -30, e: "in" }, { t: 0.75, v: 0 }] },
    handL: { y: [{ t: 0, v: 0 }, { t: 0.3, v: -22 }, { t: 0.75, v: -4 }, { t: 1.1, v: 0 }], rot: [{ t: 0, v: 0 }, { t: 0.3, v: -35 }, { t: 0.75, v: 0 }] },
    handR: { y: [{ t: 0, v: 0 }, { t: 0.3, v: -22 }, { t: 0.75, v: -4 }, { t: 1.1, v: 0 }], rot: [{ t: 0, v: 0 }, { t: 0.3, v: 35 }, { t: 0.75, v: 0 }] },
  },
};

/** Gym: lift the dumbbell overhead with effort. */
const train: ClipDef = {
  id: "train",
  duration: 1.4,
  loop: true,
  face: {
    eyes: [{ t: 0, v: "open" }, { t: 0.35, v: "closed" }, { t: 0.9, v: "open" }],
    mouth: [{ t: 0, v: "smile" }, { t: 0.3, v: "grit" }, { t: 0.95, v: "o" }],
    brows: [{ t: 0, v: "neutral" }, { t: 0.25, v: "determined" }, { t: 1.0, v: "neutral" }],
    prop: [{ t: 0, v: "dumbbell" }],
  },
  blink: false,
  flicker: 1.3,
  tracks: {
    prop: { y: [{ t: 0, v: 8 }, { t: 0.25, v: 12, e: "out" }, { t: 0.65, v: -58, e: "in" }, { t: 0.85, v: -58 }, { t: 1.2, v: 8 }, { t: 1.4, v: 8 }] },
    handL: { x: [{ t: 0, v: -4 }], y: [{ t: 0, v: 8 }, { t: 0.25, v: 12, e: "out" }, { t: 0.65, v: -58, e: "in" }, { t: 0.85, v: -58 }, { t: 1.2, v: 8 }, { t: 1.4, v: 8 }] },
    handR: { x: [{ t: 0, v: 4 }], y: [{ t: 0, v: 8 }, { t: 0.25, v: 12, e: "out" }, { t: 0.65, v: -58, e: "in" }, { t: 0.85, v: -58 }, { t: 1.2, v: 8 }, { t: 1.4, v: 8 }] },
    body: {
      sy: [{ t: 0, v: 1 }, { t: 0.25, v: 0.88, e: "out" }, { t: 0.65, v: 1.08 }, { t: 0.85, v: 1.06 }, { t: 1.2, v: 0.95 }, { t: 1.4, v: 1 }],
      sx: [{ t: 0, v: 1 }, { t: 0.25, v: 1.08 }, { t: 0.65, v: 0.95 }, { t: 1.2, v: 1.03 }, { t: 1.4, v: 1 }],
    },
    face: { y: [{ t: 0, v: 0 }, { t: 0.65, v: -2 }, { t: 1.2, v: 0 }] },
  },
};

const bathe: ClipDef = {
  id: "bathe",
  duration: 1.2,
  loop: true,
  face: { eyes: [{ t: 0, v: "happy" }], mouth: [{ t: 0, v: "content" }], brows: [{ t: 0, v: "happy" }] },
  blink: false,
  flicker: 0.7,
  tracks: {
    body: {
      rot: [{ t: 0, v: -9 }, { t: 0.15, v: 9 }, { t: 0.3, v: -9 }, { t: 0.45, v: 9 }, { t: 0.6, v: 0 }, { t: 1.2, v: 0 }],
      sx: [{ t: 0, v: 1.04 }, { t: 0.6, v: 1.04 }, { t: 0.75, v: 0.97 }, { t: 1.2, v: 1 }],
    },
    cheekL: { sx: [{ t: 0, v: 1.3 }] },
    cheekR: { sx: [{ t: 0, v: 1.3 }] },
  },
};

const sad: ClipDef = {
  id: "sad",
  duration: 3.2,
  loop: true,
  breath: 0.6,
  breathRate: 0.3,
  flicker: 0.5,
  face: { brows: [{ t: 0, v: "sad" }], mouth: [{ t: 0, v: "sad" }] },
  tracks: {
    body: { sy: [{ t: 0, v: 0.95 }], rot: [{ t: 0, v: 3 }, { t: 1.6, v: 1 }, { t: 3.2, v: 3 }] },
    face: { y: [{ t: 0, v: 3 }], x: [{ t: 0, v: -2 }] },
    handL: { y: [{ t: 0, v: 3 }] },
    handR: { y: [{ t: 0, v: 3 }] },
    flame: { sy: [{ t: 0, v: 0.75 }] },
  },
};

const hungry: ClipDef = {
  id: "hungry",
  duration: 2.4,
  loop: true,
  face: { brows: [{ t: 0, v: "sad" }], mouth: [{ t: 0, v: "drool" }] },
  tracks: {
    body: { rot: [{ t: 0, v: -2 }, { t: 1.2, v: 2 }, { t: 2.4, v: -2 }], sy: [{ t: 0, v: 0.97 }] },
    handL: { x: [{ t: 0, v: 14 }], y: [{ t: 0, v: 14 }, { t: 0.6, v: 16 }, { t: 1.2, v: 14 }, { t: 1.8, v: 16 }, { t: 2.4, v: 14 }] },
    handR: { x: [{ t: 0, v: -14 }], y: [{ t: 0, v: 16 }, { t: 0.6, v: 14 }, { t: 1.2, v: 16 }, { t: 1.8, v: 14 }, { t: 2.4, v: 16 }] },
    face: { x: [{ t: 0, v: 3 }], y: [{ t: 0, v: 1 }] },
  },
};

const angry: ClipDef = {
  id: "angry",
  duration: 1.0,
  loop: true,
  blink: false,
  flicker: 1.8,
  face: { brows: [{ t: 0, v: "angry" }], mouth: [{ t: 0, v: "angry" }] },
  tracks: {
    body: {
      x: [{ t: 0, v: -2, e: "linear" }, { t: 0.05, v: 2, e: "linear" }, { t: 0.1, v: -2, e: "linear" }, { t: 0.15, v: 2, e: "linear" }, { t: 0.2, v: 0 }, { t: 1.0, v: 0 }],
      sy: [{ t: 0, v: 0.94 }, { t: 0.2, v: 1.04 }, { t: 0.5, v: 0.97 }, { t: 1.0, v: 0.94 }],
      rot: [{ t: 0, v: 4 }],
    },
    footL: { y: [{ t: 0.5, v: 0 }, { t: 0.62, v: -8 }, { t: 0.74, v: 0 }] },
    flame: { sy: [{ t: 0, v: 1.3 }], sx: [{ t: 0, v: 1.15 }] },
  },
};

export const chispinClips: ClipDef[] = [idle, walk, eat, pet, sleep, celebrate, train, bathe, sad, hungry, angry];
export type ChispinClipId = "idle" | "walk" | "eat" | "pet" | "sleep" | "celebrate" | "train" | "bathe" | "sad" | "hungry" | "angry";

const embers = (rate: number, extra: Partial<EmitterDef> = {}): EmitterDef => ({
  id: "embers", shape: "ember", rate, life: 1.5, x: 0, y: -122, spread: 8, vx: [-6, 6], vy: [-36, -20], gravity: 0, size: [1.6, 3], wobble: 5, color: "#FFD166", ...extra,
});

/** Particle emitters by clip (creature-local coordinates). */
export const chispinEmitters: Record<ChispinClipId, EmitterDef[]> = {
  idle: [embers(2.2)],
  walk: [
    embers(4, { life: 1.0, x: -6, y: -118, vx: [-30, -12], vy: [-26, -14] }),
    { id: "dust", shape: "bubble", rate: 3.6, life: 0.6, x: 0, y: -3, spread: 18, vx: [-24, -8], vy: [-10, -4], gravity: 0, size: [3, 5], color: "#E9C9A8", behind: true },
  ],
  eat: [
    { id: "crumbs", shape: "crumb", rate: 5, life: 0.75, x: 0, y: -32, spread: 6, vx: [-40, 40], vy: [-50, -20], gravity: 220, size: [2, 3.4], spin: 360, color: "#D9944A" },
    embers(3.5),
  ],
  pet: [
    { id: "hearts", shape: "heart", rate: 1.6, life: 1.7, x: 0, y: -100, spread: 30, vx: [-6, 6], vy: [-36, -24], gravity: 0, size: [4.5, 7], wobble: 6, color: "#FF5E7E" },
    embers(4, { color: "#FFE08A" }),
  ],
  sleep: [{ id: "zzz", shape: "z", rate: 0.55, life: 2.8, x: 30, y: -92, spread: 2, vx: [9, 14], vy: [-18, -13], gravity: 0, size: [3.2, 4.6], wobble: 3, color: "#FFF4DD" }],
  celebrate: [
    { id: "sparks", shape: "spark", rate: 8, life: 0.9, x: 0, y: -70, spread: 40, vx: [-60, 60], vy: [-80, -30], gravity: 120, size: [3, 6], spin: 200, color: "#FFE08A" },
    embers(6),
  ],
  train: [
    { id: "sweat", shape: "bubble", rate: 2, life: 0.7, x: 22, y: -80, spread: 14, vx: [10, 40], vy: [-40, -20], gravity: 200, size: [2, 3], color: "#9FE6FF" },
    embers(5),
  ],
  bathe: [
    { id: "bubbles", shape: "bubble", rate: 9, life: 1.4, x: 0, y: -40, spread: 46, vx: [-12, 12], vy: [-40, -16], gravity: 0, size: [3, 7], wobble: 6, color: "#DDF6FF" },
  ],
  sad: [embers(0.8, { color: "#C9A07A" })],
  hungry: [embers(1.5)],
  angry: [
    { id: "smoke", shape: "bubble", rate: 5, life: 1.2, x: 0, y: -120, spread: 10, vx: [-14, 14], vy: [-44, -30], gravity: 0, size: [5, 9], wobble: 4, color: "#6B5B5E" },
    embers(8, { vy: [-60, -30] }),
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
