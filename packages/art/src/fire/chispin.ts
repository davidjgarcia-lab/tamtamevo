import type { ClipDef, EmitterDef, PaletteGenes, PartDef, RigDef } from "@tamtam/rig";

/**
 * CHISPÍN v3 — fire_baby_chispin (Brasálidos, Bebé) · locomotion: REPTILIAN quadruped · artStatus: "prototype"
 * Concept: docs/media/concept/chispin-v3-reptil.jpg. Young fire reptile seen in 3/4 profile, facing right:
 * wedge head with short snout, almond luminous eyes with slit pupils, flame crest from forehead to
 * shoulders, charcoal-wine scales with magma seams, cream segmented belly, four legs with claws,
 * long tail with ember bands and a glowing tip.
 * Space: origin on the ground under the body; y grows downwards; ~95 u tall, ~180 u long with tail.
 */

const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

// ── Shapes (bone-local) ──────────────────────────────────────────────────────
const TORSO = "M -34 -6 C -36 -19 -22 -25 -4 -25 C 14 -25 30 -21 34 -8 C 37 4 28 14 10 15 L -18 15 C -30 14 -35 6 -34 -6 Z";
const BELLY = "M -26 7 C -12 15 12 15 27 6 L 28 11 C 12 19 -12 19 -27 12 Z";
const BELLY_LINES = "M -16 11 L -15 16 M -6 13 L -6 18 M 4 13 L 4 18 M 14 11 L 15 16";
const NECK = "M -8 -9 C 0 -17 14 -17 19 -10 L 21 7 C 11 11 0 11 -9 7 Z";
const NECK_BELLY = "M 1 4 C 8 8 15 8 21 4 L 20 9 C 13 13 6 13 -1 9 Z";
const SKULL = "M -16 -9 C -14 -22 1 -26 13 -21 C 23 -17 31 -11 34 -3 C 36 3 31 8 23 8 L -3 10 C -14 11 -20 3 -16 -9 Z";
const SNOUT_SHADE = "M 6 4 C 16 6 26 6 33 0 C 34 4 30 8 23 8 L -3 10 C -2 6 2 4 6 4 Z";
const JAW = "M -8 5 L 26 6 C 29 10 23 15 14 15 L -2 15 C -10 14 -12 9 -8 5 Z";
const MOUTH_IN = "M -4 7 L 24 7 C 22 11 17 13 12 13 L 0 13 C -4 12 -5 10 -4 7 Z";
const TONGUE = "M 4 10 C 9 8 15 9 18 11 C 14 13 8 13 4 10 Z";
const TEETH = "M 18 7 L 20 11 L 22 7 Z M 10 7 L 12 10 L 14 7 Z";
const HORN = "M 0 0 C -6 -6 -14 -9 -22 -9 C -15 -5 -9 -1 -6 4 Z";
const HORN2 = "M 0 0 C -4 -5 -10 -8 -16 -8 C -11 -4 -7 0 -5 4 Z";
const FLAME_A = "M 0 2 C -8 0 -12 -10 -6 -18 C -4 -24 -6 -28 -2 -34 C 2 -26 10 -22 9 -12 C 10 -4 6 2 0 2 Z";
const FLAME_A_IN = "M 0 0 C -4 -1 -6 -7 -3 -11 C -2 -14 -2 -17 0 -21 C 2 -16 5 -13 4 -7 C 5 -3 3 0 0 0 Z";
const FLAME_B = "M 0 2 C -7 1 -10 -7 -6 -13 C -4 -17 -5 -20 -2 -25 C 1 -19 7 -16 7 -9 C 7 -3 4 2 0 2 Z";
const EYE_WHITE = "M 3 -8 C 7 -14 17 -14 21 -8 C 17 -4 8 -3 3 -8 Z";
// Muscular thigh → narrow ankle → wide paw (reads as a reptile limb, not a column).
const LEG_NEAR = "M -10 -6 C -12 3 -7 9 -4 15 C -5 18 -7 21 -6 23.5 C -2 24.5 6 24.5 10 23.5 C 10 21 7 19 5 16 C 8 9 11 0 8 -7 C 3 -10 -6 -10 -10 -6 Z";
const LEG_FAR = "M -8 -6 C -10 3 -6 9 -3 15 C -4 18 -6 21 -5 23.5 C -1 24.5 5 24.5 8 23.5 C 8 21 6 19 4 16 C 7 9 9 0 7 -7 C 2 -9 -5 -9 -8 -6 Z";
const CLAWS = "M 2 24 L 5 26.5 L 6.5 23.8 Z M 6.5 23.6 L 10 26 L 10.5 22.8 Z M -2 24 L 1 26.5 L 2.5 24 Z";
const TAIL_SEG = (l: number, w0: number, w1: number) => `M 4 ${-w0} L ${-l} ${-w1} C ${-l - 3} 0 ${-l - 3} 0 ${-l} ${w1} L 4 ${w0} C 7 0 7 0 4 ${-w0} Z`;
const TAIL_TIP = "M 4 -4 L -14 -1.5 C -18 0 -18 0 -14 1.5 L 4 4 C 7 0 7 0 4 -4 Z";

const glow = (alpha: number) => ({ tint: "glow" as const, alpha });

export const chispinRig: RigDef = {
  id: "fire_baby_chispin",
  bones: [
    { id: "root", parent: null, x: 0, y: 0 },
    { id: "body", parent: "root", x: 0, y: -36 },
    { id: "legBF", parent: "body", x: -14, y: 14 },
    { id: "legFF", parent: "body", x: 28, y: 12 },
    { id: "tail1", parent: "body", x: -30, y: -2, rot: 8 },
    { id: "tail2", parent: "tail1", x: -18, y: 0, rot: 6 },
    { id: "tail3", parent: "tail2", x: -16, y: 0, rot: -6 },
    { id: "tail4", parent: "tail3", x: -14, y: 0, rot: -10 },
    { id: "crest3", parent: "body", x: 14, y: -21 },
    { id: "neck", parent: "body", x: 26, y: -10 },
    { id: "crest2", parent: "neck", x: 2, y: -13 },
    { id: "head", parent: "neck", x: 16, y: -14 },
    { id: "jaw", parent: "head", x: 0, y: 0 },
    { id: "crest1", parent: "head", x: 0, y: -20 },
    { id: "horn", parent: "head", x: -10, y: -14 },
    { id: "eye", parent: "head", x: 0, y: 0 },
    { id: "brow", parent: "head", x: 12, y: -15 },
    { id: "legBN", parent: "body", x: -20, y: 14 },
    { id: "legFN", parent: "body", x: 22, y: 14 },
    { id: "prop", parent: "body", x: 30, y: -2 },
  ],
  breathBone: "body",
  eyeBones: ["eye"],
  secondary: [
    { bone: "tail1", driver: "body", lag: 0.08, gain: 0.8, velocityGain: 0.05, sway: { amp: 3, freq: 0.45 } },
    { bone: "tail2", driver: "body", lag: 0.14, gain: 1.1, velocityGain: 0.06, sway: { amp: 4, freq: 0.5 } },
    { bone: "tail3", driver: "body", lag: 0.2, gain: 1.3, velocityGain: 0.08, sway: { amp: 5, freq: 0.55 } },
    { bone: "tail4", driver: "body", lag: 0.26, gain: 1.6, velocityGain: 0.1, sway: { amp: 7, freq: 0.6 }, flicker: { amp: 0.08, freq: 2.4 } },
    { bone: "crest1", driver: "head", lag: 0.12, gain: 0.9, velocityGain: 0.08, sway: { amp: 3, freq: 0.8 }, flicker: { amp: 0.1, freq: 2.6 } },
    { bone: "crest2", driver: "neck", lag: 0.16, gain: 1.0, velocityGain: 0.1, sway: { amp: 4, freq: 0.9 }, flicker: { amp: 0.12, freq: 3.0 } },
    { bone: "crest3", driver: "body", lag: 0.2, gain: 1.2, velocityGain: 0.12, sway: { amp: 4, freq: 1.0 }, flicker: { amp: 0.12, freq: 2.8 } },
  ],
  parts: [
    // ── Emissive glows (behind everything) ──
    { id: "crestGlow", bone: "crest1", d: ell(-2, -14, 20, 22), fill: glow(0.42), blur: 12, z: 0, emissive: true },
    { id: "tailGlow", bone: "tail4", d: ell(-14, 0, 9, 9), fill: glow(0.6), blur: 6, z: 0, emissive: true },
    // ── Far side (darker) ──
    { id: "legBF", bone: "legBF", d: LEG_FAR, fill: { tint: "baseShade" }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 1 },
    { id: "legFF", bone: "legFF", d: LEG_FAR, fill: { tint: "baseShade" }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 1 },
    // ── Tail with ember bands and glowing tip ──
    { id: "tail1", bone: "tail1", d: TAIL_SEG(18, 10, 8.5), fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 2 },
    { id: "tail2", bone: "tail2", d: TAIL_SEG(16, 8.5, 6.5), fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 2 },
    { id: "tail3", bone: "tail3", d: TAIL_SEG(14, 6.5, 4.5), fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 2.2, z: 2 },
    { id: "tail4", bone: "tail4", d: TAIL_TIP, fill: { tint: "base" }, stroke: { tint: "ink" }, strokeWidth: 2, z: 2 },
    { id: "band1", bone: "tail1", d: "M -8 -9 L -11 -8.5 L -11 8.5 L -8 9 Z", fill: { tint: "ink", alpha: 0.85 }, z: 3 },
    { id: "band2", bone: "tail2", d: "M -7 -7.5 L -10 -7 L -10 7 L -7 7.5 Z", fill: { tint: "ink", alpha: 0.85 }, z: 3 },
    { id: "band3", bone: "tail3", d: "M -6 -5.5 L -9 -5 L -9 5 L -6 5.5 Z", fill: { tint: "ink", alpha: 0.85 }, z: 3 },
    { id: "tailEmber", bone: "tail4", d: "M -9 -2.5 C -13 -6 -17 -3 -22 -6 C -19 -1 -18 3 -13 3 C -11 3 -9 1 -9 -2.5 Z", fill: { tint: "accent" }, z: 3, emissive: true },
    // ── Crest flames (behind the head and neck) ──
    { id: "crest3", bone: "crest3", d: FLAME_B, fill: { gradient: ["accentLight", "accent"], from: [0, -24], to: [0, 2] }, z: 3, emissive: true },
    { id: "crest2", bone: "crest2", d: FLAME_A, fill: { gradient: ["accentLight", "accent"], from: [0, -32], to: [0, 2] }, z: 4, emissive: true },
    { id: "crest1", bone: "crest1", d: FLAME_A, fill: { gradient: ["accentLight", "accent"], from: [0, -32], to: [0, 2] }, z: 5, emissive: true },
    { id: "crest1In", bone: "crest1", d: FLAME_A_IN, fill: { color: "#FFF1B8", alpha: 0.95 }, z: 5, emissive: true },
    { id: "crest2In", bone: "crest2", d: FLAME_A_IN, fill: { color: "#FFF1B8", alpha: 0.9 }, z: 4, emissive: true },
    // ── Body ──
    { id: "torsoLine", bone: "body", d: TORSO, stroke: { tint: "ink" }, strokeWidth: 5, z: 6 },
    { id: "torso", bone: "body", d: TORSO, fill: { gradient: ["baseLight", "base", "baseShade"], from: [0, -25], to: [0, 15] }, z: 7, sheen: true },
    { id: "scalesTop", bone: "body", d: "M -24 -18 Q -20 -22 -16 -18 Q -12 -22 -8 -18 Q -4 -22 0 -18 Q 4 -22 8 -18 Q 12 -22 16 -18", stroke: { tint: "baseShade", alpha: 0.9 }, strokeWidth: 1.6, z: 8 },
    { id: "belly", bone: "body", d: BELLY, fill: { gradient: ["#F4DDB8", "#D9B48A"], from: [0, 6], to: [0, 18] }, stroke: { tint: "ink", alpha: 0.7 }, strokeWidth: 1.6, z: 8 },
    { id: "bellyLines", bone: "body", d: BELLY_LINES, stroke: { color: "#B48A62", alpha: 0.9 }, strokeWidth: 1.2, z: 8 },
    { id: "seamGlow", bone: "body", d: "M -26 -8 Q -17 -13 -9 -7 Q -1 -1 7 -9 M 6 -17 Q 14 -13 23 -15", stroke: glow(0.8), strokeWidth: 4, blur: 3, z: 8, emissive: true },
    { id: "seam", bone: "body", d: "M -26 -8 Q -17 -13 -9 -7 Q -1 -1 7 -9 M 6 -17 Q 14 -13 23 -15", stroke: { tint: "accent" }, strokeWidth: 1.6, z: 9, emissive: true },
    { id: "spotA", bone: "body", d: ell(18, -3, 4.2, 3), fill: { tint: "accent" }, z: 9, emissive: true },
    { id: "spotB", bone: "body", d: ell(25, 2, 2.4, 1.8), fill: { tint: "accent" }, z: 9, emissive: true },
    { id: "spotC", bone: "body", d: ell(-21, -3, 4, 2.8), fill: { tint: "accent" }, z: 9, emissive: true },
    { id: "spotD", bone: "body", d: ell(-14, 2, 2.2, 1.6), fill: { tint: "accent" }, z: 9, emissive: true },
    { id: "rim", bone: "body", d: "M -30 -14 C -24 -22 -10 -25 4 -25 C -10 -23 -22 -20 -28 -11 Z", fill: { tint: "baseLight", alpha: 0.9 }, z: 9 },
    // ── Neck and head ──
    { id: "neck", bone: "neck", d: NECK, fill: { gradient: ["baseLight", "base"], from: [0, -16], to: [0, 8] }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 10 },
    { id: "neckBelly", bone: "neck", d: NECK_BELLY, fill: { color: "#EFD3AC" }, z: 10 },
    { id: "jaw", bone: "jaw", d: JAW, fill: { gradient: ["base", "baseShade"], from: [0, 5], to: [0, 15] }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 11 },
    { id: "jawBelly", bone: "jaw", d: "M 0 12 C 8 14 16 14 22 11 L 21 14 C 15 16 7 16 1 15 Z", fill: { color: "#EFD3AC" }, z: 11 },
    { id: "mouthIn", bone: "head", d: MOUTH_IN, fill: { color: "#3A0E18" }, z: 11.5, face: { slot: "mouth", states: ["open", "grit", "drool", "content"] } },
    { id: "tongue", bone: "head", d: TONGUE, fill: { color: "#E2566A" }, z: 11.6, face: { slot: "mouth", states: ["open", "drool", "content"] } },
    { id: "teeth", bone: "head", d: TEETH, fill: { color: "#FFF6E8" }, z: 11.7, face: { slot: "mouth", states: ["open", "grit", "content", "drool"] } },
    { id: "drool", bone: "jaw", d: "M 20 13 C 21 18 22 22 20 24 C 18 25 17 21 18 17 Z", fill: { color: "#9FE6FF", alpha: 0.9 }, z: 12, face: { slot: "mouth", states: ["drool"] } },
    { id: "horn", bone: "horn", d: HORN, fill: { gradient: ["#2A1820", "#5A3A44"], from: [-20, -8], to: [0, 4] }, stroke: { tint: "ink" }, strokeWidth: 1.6, z: 11.8 },
    { id: "horn2", bone: "horn", d: HORN2, fill: { gradient: ["#2A1820", "#5A3A44"], from: [-16, -8], to: [0, 4] }, stroke: { tint: "ink" }, strokeWidth: 1.4, z: 11.8 },
    { id: "skullLine", bone: "head", d: SKULL, stroke: { tint: "ink" }, strokeWidth: 4.5, z: 12 },
    { id: "skull", bone: "head", d: SKULL, fill: { gradient: ["baseLight", "base"], from: [0, -24], to: [0, 10] }, z: 13, sheen: true },
    { id: "snoutShade", bone: "head", d: SNOUT_SHADE, fill: { tint: "baseShade", alpha: 0.75 }, z: 14 },
    { id: "headSeam", bone: "head", d: "M -12 -6 Q -6 -12 2 -12", stroke: { tint: "accent" }, strokeWidth: 1.4, z: 14, emissive: true },
    { id: "headScales", bone: "head", d: "M -10 -16 Q -6 -19 -2 -16 Q 2 -19 6 -17", stroke: { tint: "baseShade" }, strokeWidth: 1.3, z: 14 },
    { id: "nostril", bone: "head", d: ell(28, -5, 1.4, 1), fill: { tint: "ink" }, z: 14 },
    { id: "mouthLine", bone: "head", d: "M 6 6 Q 16 7 30 3", stroke: { tint: "ink" }, strokeWidth: 1.8, z: 14, face: { slot: "mouth", states: ["smile", "chew", "o", "sad", "angry"] } },
    { id: "mouthSmile", bone: "head", d: "M 4 5 Q 6 8 9 6", stroke: { tint: "ink" }, strokeWidth: 1.8, z: 14, face: { slot: "mouth", states: ["smile", "chew"] } },
    { id: "fang", bone: "head", d: "M 22 5 L 23.5 9.5 L 25 5 Z", fill: { color: "#FFF6E8" }, stroke: { tint: "ink" }, strokeWidth: 0.8, z: 14, face: { slot: "mouth", states: ["smile", "angry"] } },
    // ── Eye: luminous almond, amber slit pupil (no giant cartoon eyes) ──
    { id: "eyeGlow", bone: "eye", d: ell(12, -8, 11, 7), fill: { color: "#FFF0C8", alpha: 0.55 }, blur: 4, z: 14.5, emissive: true, face: { slot: "eyes", states: ["open"] } },
    { id: "eyeWhite", bone: "eye", d: EYE_WHITE, fill: { color: "#FFF8EC" }, stroke: { tint: "ink" }, strokeWidth: 1.6, z: 15, face: { slot: "eyes", states: ["open"] } },
    { id: "iris", bone: "eye", d: ell(13, -8.6, 3.4, 4.2), fill: { gradient: ["accentLight", "eye"], from: [0, -13], to: [0, -4] }, z: 16, face: { slot: "eyes", states: ["open"] } },
    { id: "pupil", bone: "eye", d: "M 13 -12.2 C 14.2 -10 14.2 -7 13 -4.8 C 11.8 -7 11.8 -10 13 -12.2 Z", fill: { color: "#1A0C10" }, z: 17, face: { slot: "eyes", states: ["open"] } },
    { id: "eyeShine", bone: "eye", d: ell(15.2, -10.4, 1.2, 1.2), fill: { color: "#FFFFFF" }, z: 18, face: { slot: "eyes", states: ["open"] } },
    { id: "eyeClosed", bone: "eye", d: "M 3 -8 Q 12 -4 21 -8", stroke: { tint: "ink" }, strokeWidth: 2.2, z: 15, face: { slot: "eyes", states: ["closed"] } },
    { id: "eyeHappy", bone: "eye", d: "M 3 -7 Q 12 -14 21 -7", stroke: { tint: "ink" }, strokeWidth: 2.2, z: 15, face: { slot: "eyes", states: ["happy"] } },
    // Brow ridge (motor of the expression)
    { id: "browN", bone: "brow", d: "M -10 0 Q 0 -4 10 -1", stroke: { tint: "ink" }, strokeWidth: 2.6, z: 19, face: { slot: "brows", states: ["neutral"] } },
    { id: "browH", bone: "brow", d: "M -10 0 Q 0 -6 10 -2", stroke: { tint: "ink" }, strokeWidth: 2.4, z: 19, face: { slot: "brows", states: ["happy"] } },
    { id: "browA", bone: "brow", d: "M -10 -3 Q 0 -2 10 4", stroke: { tint: "ink" }, strokeWidth: 3, z: 19, face: { slot: "brows", states: ["angry", "determined"] } },
    { id: "browS", bone: "brow", d: "M -10 3 Q 0 -2 10 -4", stroke: { tint: "ink" }, strokeWidth: 2.4, z: 19, face: { slot: "brows", states: ["sad"] } },
    { id: "browU", bone: "brow", d: "M -10 -3 Q 0 -9 10 -4", stroke: { tint: "ink" }, strokeWidth: 2.4, z: 19, face: { slot: "brows", states: ["surprised"] } },
    // ── Near legs (in front of the body) ──
    { id: "legBN", bone: "legBN", d: LEG_NEAR, fill: { gradient: ["base", "baseShade"], from: [0, -4], to: [0, 24] }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 20 },
    { id: "legFN", bone: "legFN", d: LEG_NEAR, fill: { gradient: ["base", "baseShade"], from: [0, -4], to: [0, 24] }, stroke: { tint: "ink" }, strokeWidth: 2.4, z: 20 },
    { id: "kneeB", bone: "legBN", d: "M -6 8 Q 0 12 6 8", stroke: { tint: "baseShade" }, strokeWidth: 1.4, z: 20.5 },
    { id: "kneeF", bone: "legFN", d: "M -6 8 Q 0 12 6 8", stroke: { tint: "baseShade" }, strokeWidth: 1.4, z: 20.5 },
    { id: "clawsB", bone: "legBN", d: CLAWS, fill: { color: "#F2E2C8" }, stroke: { tint: "ink" }, strokeWidth: 0.8, z: 21 },
    { id: "clawsF", bone: "legFN", d: CLAWS, fill: { color: "#F2E2C8" }, stroke: { tint: "ink" }, strokeWidth: 0.8, z: 21 },
    { id: "legSpotB", bone: "legBN", d: ell(0, 6, 2.4, 1.8), fill: { tint: "accent" }, z: 21, emissive: true },
    { id: "legSpotF", bone: "legFN", d: ell(0, 7, 2.2, 1.6), fill: { tint: "accent" }, z: 21, emissive: true },
    // ── Form-quality ornaments (ART_BIBLE §8) ──
    { id: "sootA", bone: "body", d: ell(-12, -12, 8, 4), fill: { color: "#2B2226", alpha: 0.55 }, blur: 2, z: 9.5, tiers: [0, 1] },
    { id: "sootB", bone: "body", d: ell(12, 4, 6, 3), fill: { color: "#2B2226", alpha: 0.5 }, blur: 2, z: 9.5, tiers: [0, 1] },
    { id: "sootC", bone: "head", d: ell(4, -4, 5, 3), fill: { color: "#2B2226", alpha: 0.45 }, blur: 1.5, z: 14.2, tiers: [0, 0] },
    { id: "goldSeam", bone: "body", d: "M -20 6 Q -8 2 4 6 Q 14 9 24 4", stroke: { color: "#FFE9A8" }, strokeWidth: 1.4, z: 9, tiers: [3, 4], emissive: true },
    { id: "goldScaleA", bone: "head", d: ell(-6, -10, 1.6, 1.2), fill: { color: "#FFE9A8" }, z: 14.3, tiers: [3, 4], emissive: true },
    { id: "goldScaleB", bone: "head", d: ell(-2, -14, 1.3, 1), fill: { color: "#FFE9A8" }, z: 14.3, tiers: [3, 4], emissive: true },
    { id: "rune", bone: "body", d: "M -4 -6 C 2 -6 4 -11 0 -13 C -5 -15 -10 -10 -8 -4 C -6 2 4 3 8 -3", stroke: glow(0.95), strokeWidth: 1.8, z: 9.6, tiers: [4, 4], emissive: true },
    { id: "runeGlow", bone: "body", d: ell(-1, -6, 11, 8), fill: glow(0.4), blur: 6, z: 8.5, tiers: [4, 4], emissive: true },
    ...[[-6, -30], [6, -36], [16, -30]].map(([x, y], i): PartDef => ({ id: `crown${i}`, bone: "crest1", d: ell(x!, y!, 2.2, 2.2), fill: { color: "#FFF4C2" }, z: 5.5, tiers: [4, 4], emissive: true })),
    // ── Props ──
    { id: "dumbbellBar", bone: "prop", d: "M -2 -16 L 2 -16 L 2 16 L -2 16 Z", fill: { color: "#6E6A78" }, stroke: { color: "#1C1530" }, strokeWidth: 1.6, z: 22, face: { slot: "prop", states: ["dumbbell"] } },
    { id: "dumbbellA", bone: "prop", d: "M -7 -24 L 7 -24 L 7 -16 L -7 -16 Z", fill: { gradient: ["#9A94B0", "#4A4558"], from: [-7, 0], to: [7, 0] }, stroke: { color: "#1C1530" }, strokeWidth: 1.6, z: 22, face: { slot: "prop", states: ["dumbbell"] } },
    { id: "dumbbellB", bone: "prop", d: "M -7 16 L 7 16 L 7 24 L -7 24 Z", fill: { gradient: ["#9A94B0", "#4A4558"], from: [-7, 0], to: [7, 0] }, stroke: { color: "#1C1530" }, strokeWidth: 1.6, z: 22, face: { slot: "prop", states: ["dumbbell"] } },
  ],
};

// ── Clips (reptilian quadruped locomotion) ───────────────────────────────────
type T = ClipDef["tracks"];
const loopK = (vals: number[], dur: number) => vals.map((v, i) => ({ t: (dur * i) / (vals.length - 1), v }));

const idle: ClipDef = {
  id: "idle", duration: 2.8, loop: true,
  tracks: {
    neck: { rot: loopK([0, -3, 0, 2, 0], 2.8) },
    head: { rot: [{ t: 0, v: 0 }, { t: 1.0, v: 0 }, { t: 1.2, v: -6 }, { t: 1.9, v: -6 }, { t: 2.1, v: 0 }, { t: 2.8, v: 0 }] },
    tail1: { rot: loopK([8, 14, 8, 2, 8], 2.8) },
  },
};

const S = 0.3; // half gait cycle
const gait = (phase: 0 | 1): T[string] => ({
  rot: phase === 0 ? [{ t: 0, v: -18 }, { t: S, v: 18, e: "linear" }, { t: 2 * S, v: -18 }] : [{ t: 0, v: 18, e: "linear" }, { t: S, v: -18 }, { t: 2 * S, v: 18 }],
  y: phase === 0 ? [{ t: 0, v: 0 }, { t: S, v: 0 }, { t: 1.5 * S, v: -4 }, { t: 2 * S, v: 0 }] : [{ t: 0, v: 0 }, { t: 0.5 * S, v: -4 }, { t: S, v: 0 }, { t: 2 * S, v: 0 }],
});
const walk: ClipDef = {
  id: "walk", duration: 2 * S, loop: true, breath: 0.3,
  tracks: {
    legFN: gait(0), legBF: gait(0), legFF: gait(1), legBN: gait(1),
    body: { y: loopK([0, -2.5, 0, -2.5, 0], 2 * S), rot: loopK([-1.5, 1.5, -1.5], 2 * S) },
    neck: { rot: loopK([-2, 2, -2, 2, -2], 2 * S) },
    tail1: { rot: loopK([4, 12, 4], 2 * S) },
  },
};

const R = 0.18;
const run: ClipDef = {
  id: "run", duration: 2 * R, loop: true, breath: 0.2, flicker: 1.4,
  tracks: {
    legFN: { rot: [{ t: 0, v: -35 }, { t: R, v: 35 }, { t: 2 * R, v: -35 }] },
    legFF: { rot: [{ t: 0, v: -25 }, { t: R, v: 40 }, { t: 2 * R, v: -25 }] },
    legBN: { rot: [{ t: 0, v: 35 }, { t: R, v: -35 }, { t: 2 * R, v: 35 }] },
    legBF: { rot: [{ t: 0, v: 40 }, { t: R, v: -25 }, { t: 2 * R, v: 40 }] },
    body: { y: loopK([0, -7, 0], 2 * R), rot: loopK([-4, 3, -4], 2 * R) },
    neck: { rot: [{ t: 0, v: 8 }] },
    tail1: { rot: [{ t: 0, v: -6 }] },
  },
  face: { brows: [{ t: 0, v: "determined" }] },
};

const eat: ClipDef = {
  id: "eat", duration: 2.2, loop: true, flicker: 1.2,
  face: {
    mouth: [{ t: 0, v: "smile" }, { t: 0.25, v: "open" }, { t: 0.5, v: "chew" }, { t: 0.7, v: "open" }, { t: 0.9, v: "chew" }, { t: 1.1, v: "open" }, { t: 1.3, v: "chew" }, { t: 1.8, v: "content" }],
    eyes: [{ t: 0, v: "open" }, { t: 0.5, v: "happy" }, { t: 1.6, v: "open" }, { t: 1.8, v: "happy" }],
    brows: [{ t: 0, v: "happy" }],
  },
  tracks: {
    neck: { rot: [{ t: 0, v: 0 }, { t: 0.25, v: 32, e: "out" }, { t: 1.4, v: 30 }, { t: 1.7, v: -4 }, { t: 2.2, v: 0 }] },
    head: { rot: [{ t: 0, v: 0 }, { t: 0.25, v: 18 }, { t: 1.4, v: 16 }, { t: 1.7, v: -8 }, { t: 2.2, v: 0 }] },
    jaw: { rot: [{ t: 0, v: 0 }, { t: 0.25, v: 22 }, { t: 0.5, v: 2 }, { t: 0.7, v: 18 }, { t: 0.9, v: 2 }, { t: 1.1, v: 18 }, { t: 1.3, v: 2 }, { t: 1.8, v: 8 }, { t: 2.2, v: 0 }] },
    body: { sy: [{ t: 0, v: 1 }, { t: 0.25, v: 0.97 }, { t: 1.6, v: 1 }] },
    tail1: { rot: loopK([8, 18, 8, 18, 8], 2.2) },
  },
};

const pet: ClipDef = {
  id: "pet", duration: 1.6, loop: true, blink: false, flicker: 1.4,
  face: { eyes: [{ t: 0, v: "happy" }], mouth: [{ t: 0, v: "content" }], brows: [{ t: 0, v: "happy" }] },
  tracks: {
    neck: { rot: [{ t: 0, v: -14 }] },
    head: { rot: loopK([-14, -6, -14], 1.6) },
    jaw: { rot: [{ t: 0, v: 8 }] },
    body: { rot: loopK([-2, 2, -2], 1.6), sy: loopK([1, 0.97, 1, 0.97, 1], 1.6) },
    tail1: { rot: loopK([0, 26, 0, 26, 0], 1.6) },
    tail2: { rot: loopK([6, -10, 6, -10, 6], 1.6) },
  },
};

const sleep: ClipDef = {
  id: "sleep", duration: 3.6, loop: true, breath: 2.4, breathRate: 0.28, blink: false, flicker: 0.35,
  face: { eyes: [{ t: 0, v: "closed" }], mouth: [{ t: 0, v: "smile" }], brows: [{ t: 0, v: "happy" }] },
  tracks: {
    body: { y: [{ t: 0, v: 11 }], sy: [{ t: 0, v: 0.94 }] },
    legFN: { rot: [{ t: 0, v: -75 }], sy: [{ t: 0, v: 0.55 }] },
    legFF: { rot: [{ t: 0, v: -75 }], sy: [{ t: 0, v: 0.55 }] },
    legBN: { rot: [{ t: 0, v: 70 }], sy: [{ t: 0, v: 0.55 }] },
    legBF: { rot: [{ t: 0, v: 70 }], sy: [{ t: 0, v: 0.55 }] },
    neck: { rot: [{ t: 0, v: 38 }] },
    head: { rot: [{ t: 0, v: 14 }] },
    tail1: { rot: [{ t: 0, v: 20 }] }, tail2: { rot: [{ t: 0, v: 26 }] }, tail3: { rot: [{ t: 0, v: 30 }] }, tail4: { rot: [{ t: 0, v: 30 }] },
    crest1: { sy: [{ t: 0, v: 0.6 }] }, crest2: { sy: [{ t: 0, v: 0.6 }] }, crest3: { sy: [{ t: 0, v: 0.6 }] },
  },
};

const celebrate: ClipDef = {
  id: "celebrate", duration: 1.1, loop: true, blink: false, flicker: 1.6,
  face: { eyes: [{ t: 0, v: "happy" }], mouth: [{ t: 0, v: "content" }], brows: [{ t: 0, v: "happy" }] },
  tracks: {
    body: {
      y: [{ t: 0, v: 0 }, { t: 0.15, v: 3, e: "out" }, { t: 0.45, v: -24, e: "in" }, { t: 0.75, v: 0 }, { t: 1.1, v: 0 }],
      rot: [{ t: 0, v: 0 }, { t: 0.15, v: 4 }, { t: 0.45, v: -10 }, { t: 0.75, v: 2 }, { t: 1.1, v: 0 }],
      sy: [{ t: 0, v: 1 }, { t: 0.15, v: 0.9, e: "out" }, { t: 0.3, v: 1.06 }, { t: 0.75, v: 0.92 }, { t: 0.9, v: 1.02 }, { t: 1.1, v: 1 }],
    },
    legFN: { rot: [{ t: 0.2, v: 0 }, { t: 0.45, v: -40 }, { t: 0.75, v: 0 }] },
    legFF: { rot: [{ t: 0.2, v: 0 }, { t: 0.45, v: -35 }, { t: 0.75, v: 0 }] },
    legBN: { rot: [{ t: 0.2, v: 0 }, { t: 0.45, v: 40 }, { t: 0.75, v: 0 }] },
    legBF: { rot: [{ t: 0.2, v: 0 }, { t: 0.45, v: 35 }, { t: 0.75, v: 0 }] },
    neck: { rot: [{ t: 0, v: 0 }, { t: 0.45, v: -18 }, { t: 0.9, v: 0 }] },
    jaw: { rot: [{ t: 0, v: 4 }, { t: 0.45, v: 16 }, { t: 0.9, v: 6 }] },
    tail1: { rot: [{ t: 0, v: 8 }, { t: 0.45, v: -20 }, { t: 0.9, v: 8 }] },
  },
};

/** Gym: rears up on the hind legs and lifts the dumbbell with the forelegs. */
const train: ClipDef = {
  id: "train", duration: 1.4, loop: true, blink: false, flicker: 1.3,
  face: {
    eyes: [{ t: 0, v: "open" }, { t: 0.4, v: "closed" }, { t: 0.95, v: "open" }],
    mouth: [{ t: 0, v: "smile" }, { t: 0.3, v: "grit" }, { t: 1.0, v: "smile" }],
    brows: [{ t: 0, v: "determined" }],
    prop: [{ t: 0, v: "dumbbell" }],
  },
  tracks: {
    body: { rot: [{ t: 0, v: -32 }], y: [{ t: 0, v: -6 }] },
    legBN: { rot: [{ t: 0, v: 32 }] },
    legBF: { rot: [{ t: 0, v: 32 }] },
    legFN: { rot: [{ t: 0, v: -40 }, { t: 0.65, v: -95, e: "in" }, { t: 0.85, v: -95 }, { t: 1.2, v: -40 }, { t: 1.4, v: -40 }] },
    legFF: { rot: [{ t: 0, v: -36 }, { t: 0.65, v: -90, e: "in" }, { t: 0.85, v: -90 }, { t: 1.2, v: -36 }, { t: 1.4, v: -36 }] },
    prop: { x: [{ t: 0, v: 6 }, { t: 0.65, v: 14 }, { t: 0.85, v: 14 }, { t: 1.2, v: 6 }, { t: 1.4, v: 6 }], y: [{ t: 0, v: 10 }, { t: 0.65, v: -26, e: "in" }, { t: 0.85, v: -26 }, { t: 1.2, v: 10 }, { t: 1.4, v: 10 }], rot: [{ t: 0, v: 32 }] },
    neck: { rot: [{ t: 0, v: 26 }] },
    head: { rot: [{ t: 0, v: 8 }] },
    tail1: { rot: [{ t: 0, v: 30 }] },
  },
};

/** Bath: under the shower, then shakes the water off from nose to tail. */
const bathe: ClipDef = {
  id: "bathe", duration: 1.4, loop: true, blink: false, flicker: 0.6,
  face: { eyes: [{ t: 0, v: "closed" }, { t: 0.7, v: "happy" }], mouth: [{ t: 0, v: "content" }], brows: [{ t: 0, v: "happy" }] },
  tracks: {
    body: { rot: [{ t: 0, v: 0 }, { t: 0.7, v: 0 }, { t: 0.8, v: -7 }, { t: 0.9, v: 7 }, { t: 1.0, v: -7 }, { t: 1.1, v: 7 }, { t: 1.2, v: 0 }, { t: 1.4, v: 0 }] },
    neck: { rot: [{ t: 0, v: -16 }, { t: 0.7, v: -16 }, { t: 0.8, v: 12 }, { t: 0.9, v: -12 }, { t: 1.0, v: 12 }, { t: 1.1, v: -12 }, { t: 1.2, v: -4 }, { t: 1.4, v: -16 }] },
    jaw: { rot: [{ t: 0, v: 10 }] },
    tail1: { rot: [{ t: 0, v: 10 }, { t: 0.85, v: 30 }, { t: 1.0, v: -10 }, { t: 1.15, v: 30 }, { t: 1.4, v: 10 }] },
  },
};

const sad: ClipDef = {
  id: "sad", duration: 3.2, loop: true, breath: 0.6, breathRate: 0.3, flicker: 0.45,
  face: { brows: [{ t: 0, v: "sad" }], mouth: [{ t: 0, v: "sad" }] },
  tracks: {
    neck: { rot: [{ t: 0, v: 22 }] }, head: { rot: loopK([12, 16, 12], 3.2) },
    body: { y: [{ t: 0, v: 3 }] },
    tail1: { rot: [{ t: 0, v: 22 }] }, tail2: { rot: [{ t: 0, v: 14 }] },
    crest1: { sy: [{ t: 0, v: 0.7 }] }, crest2: { sy: [{ t: 0, v: 0.7 }] }, crest3: { sy: [{ t: 0, v: 0.7 }] },
  },
};

const hungry: ClipDef = {
  id: "hungry", duration: 2.4, loop: true,
  face: { brows: [{ t: 0, v: "sad" }], mouth: [{ t: 0, v: "drool" }] },
  tracks: {
    neck: { rot: loopK([20, 28, 20, 28, 20], 2.4) },
    head: { rot: [{ t: 0, v: 10 }] },
    jaw: { rot: [{ t: 0, v: 12 }] },
    tail1: { rot: [{ t: 0, v: 16 }] },
  },
};

const angry: ClipDef = {
  id: "angry", duration: 1.0, loop: true, blink: false, flicker: 1.9,
  face: { brows: [{ t: 0, v: "angry" }], mouth: [{ t: 0, v: "grit" }] },
  tracks: {
    body: { y: [{ t: 0, v: 3 }], sy: [{ t: 0, v: 0.95 }], x: [{ t: 0, v: -1.5, e: "linear" }, { t: 0.05, v: 1.5, e: "linear" }, { t: 0.1, v: -1.5, e: "linear" }, { t: 0.15, v: 0 }, { t: 1, v: 0 }] },
    neck: { rot: [{ t: 0, v: 10 }] }, head: { rot: [{ t: 0, v: -4 }] },
    jaw: { rot: [{ t: 0, v: 14 }] },
    crest1: { sx: [{ t: 0, v: 1.25 }], sy: [{ t: 0, v: 1.3 }] }, crest2: { sy: [{ t: 0, v: 1.3 }] }, crest3: { sy: [{ t: 0, v: 1.3 }] },
    tail1: { rot: loopK([-10, 4, -10], 1.0) },
  },
};

/** Arena: anticipation crouch → lunge bite → recover. */
const attack: ClipDef = {
  id: "attack", duration: 0.8, loop: false, blink: false, flicker: 1.8,
  face: { brows: [{ t: 0, v: "angry" }], mouth: [{ t: 0, v: "grit" }, { t: 0.3, v: "open" }, { t: 0.55, v: "grit" }] },
  tracks: {
    body: { x: [{ t: 0, v: 0 }, { t: 0.25, v: -8, e: "out" }, { t: 0.4, v: 22, e: "in" }, { t: 0.8, v: 0 }], sy: [{ t: 0, v: 1 }, { t: 0.25, v: 0.9 }, { t: 0.4, v: 1.05 }, { t: 0.8, v: 1 }] },
    neck: { rot: [{ t: 0, v: 0 }, { t: 0.25, v: -12 }, { t: 0.4, v: 14 }, { t: 0.8, v: 0 }] },
    jaw: { rot: [{ t: 0, v: 4 }, { t: 0.3, v: 28 }, { t: 0.42, v: 0 }, { t: 0.8, v: 4 }] },
  },
};

const hit: ClipDef = {
  id: "hit", duration: 0.5, loop: false, blink: false,
  face: { eyes: [{ t: 0, v: "closed" }, { t: 0.3, v: "open" }], brows: [{ t: 0, v: "sad" }], mouth: [{ t: 0, v: "grit" }] },
  tracks: { body: { x: [{ t: 0, v: 0 }, { t: 0.08, v: -10, e: "out" }, { t: 0.5, v: 0 }], rot: [{ t: 0, v: 0 }, { t: 0.08, v: -6 }, { t: 0.5, v: 0 }] }, neck: { rot: [{ t: 0, v: 0 }, { t: 0.08, v: -18 }, { t: 0.5, v: 0 }] } },
};

export const chispinClips: ClipDef[] = [idle, walk, run, eat, pet, sleep, celebrate, train, bathe, sad, hungry, angry, attack, hit];
export type ChispinClipId = "idle" | "walk" | "run" | "eat" | "pet" | "sleep" | "celebrate" | "train" | "bathe" | "sad" | "hungry" | "angry" | "attack" | "hit";

const CREST = { x: 46, y: -96 };
const embers = (rate: number, extra: Partial<EmitterDef> = {}): EmitterDef => ({
  id: "embers", shape: "ember", rate, life: 1.5, x: CREST.x, y: CREST.y, spread: 10, vx: [-10, 4], vy: [-36, -20], gravity: 0, size: [1.6, 3], wobble: 5, color: "#FFD166", ...extra,
});

/** Particle emitters by clip (creature-local coordinates). */
export const chispinEmitters: Record<ChispinClipId, EmitterDef[]> = {
  idle: [embers(2.4)],
  walk: [embers(4, { life: 1.0, vx: [-30, -12] }), { id: "dust", shape: "bubble", rate: 4, life: 0.6, x: -10, y: -2, spread: 30, vx: [-24, -8], vy: [-10, -4], gravity: 0, size: [3, 5], color: "#8C7BB0", behind: true }],
  run: [embers(7, { life: 0.8, vx: [-60, -30] }), { id: "dust", shape: "bubble", rate: 8, life: 0.5, x: -10, y: -2, spread: 30, vx: [-50, -20], vy: [-14, -4], gravity: 0, size: [3, 6], color: "#8C7BB0", behind: true }],
  eat: [{ id: "crumbs", shape: "crumb", rate: 5, life: 0.75, x: 74, y: -14, spread: 6, vx: [-20, 40], vy: [-40, -14], gravity: 220, size: [2, 3.4], spin: 360, color: "#D9944A" }, embers(3)],
  pet: [{ id: "hearts", shape: "heart", rate: 1.6, life: 1.7, x: 30, y: -96, spread: 30, vx: [-6, 6], vy: [-36, -24], gravity: 0, size: [4.5, 7], wobble: 6, color: "#FF4F9A" }, embers(4, { color: "#FFE08A" })],
  sleep: [{ id: "zzz", shape: "z", rate: 0.55, life: 2.8, x: 70, y: -54, spread: 2, vx: [9, 14], vy: [-18, -13], gravity: 0, size: [3.2, 4.6], wobble: 3, color: "#E6DCFF" }],
  celebrate: [{ id: "sparks", shape: "spark", rate: 8, life: 0.9, x: 10, y: -60, spread: 50, vx: [-60, 60], vy: [-80, -30], gravity: 120, size: [3, 6], spin: 200, color: "#FFE08A" }, embers(6)],
  train: [{ id: "sweat", shape: "bubble", rate: 2, life: 0.7, x: 52, y: -96, spread: 10, vx: [10, 40], vy: [-40, -20], gravity: 200, size: [2, 3], color: "#9FE6FF" }, embers(5)],
  bathe: [{ id: "drops", shape: "bubble", rate: 14, life: 0.8, x: 10, y: -70, spread: 60, vx: [-50, 50], vy: [-40, 10], gravity: 260, size: [1.6, 3], color: "#9FE6FF" }, { id: "foam", shape: "bubble", rate: 6, life: 1.3, x: 0, y: -50, spread: 40, vx: [-10, 10], vy: [-30, -12], gravity: 0, size: [3, 6], wobble: 5, color: "#E8F8FF" }],
  sad: [embers(0.7, { color: "#C9A07A" })],
  hungry: [embers(1.4)],
  angry: [{ id: "smoke", shape: "bubble", rate: 5, life: 1.2, x: CREST.x, y: CREST.y + 6, spread: 10, vx: [-14, 14], vy: [-44, -30], gravity: 0, size: [5, 9], wobble: 4, color: "#4A3E50" }, embers(9, { vy: [-60, -30] })],
  attack: [embers(10, { vx: [-20, 20] })],
  hit: [{ id: "sparks", shape: "spark", rate: 20, life: 0.4, x: 60, y: -60, spread: 10, vx: [-40, 40], vy: [-60, 0], gravity: 100, size: [3, 5], color: "#FFFFFF" }],
};

/**
 * Base-colour alleles of the Fire family. Production palette (Art Direction §03):
 * #F04432 #FF7A24 #FFC247 #7D2430 #351D2B — charcoal-wine scales, orange/yellow fire.
 */
export const fireColorAlleles: { id: string; name: string; rank: "D" | "I" | "R"; genes: PaletteGenes }[] = [
  { id: "brasa", name: "Brasa", rank: "D", genes: { base: "#7D2430", accent: "#FF7A24", eye: "#FFC247", glow: "#FFB347" } },
  { id: "ceniza", name: "Ceniza", rank: "I", genes: { base: "#5E5866", accent: "#FF7A24", eye: "#FFC247", glow: "#FFB347" } },
  { id: "oro", name: "Oro Fundido", rank: "I", genes: { base: "#9A5A16", accent: "#FFC247", eye: "#FFE08A", glow: "#FFE08A" } },
  { id: "rubi", name: "Rubí Profundo", rank: "R", genes: { base: "#A3123A", accent: "#FF9F59", eye: "#FFD1A0", glow: "#FFB38A" } },
  { id: "azul", name: "Azul Llama", rank: "R", genes: { base: "#1F3E7A", accent: "#4FE3FF", eye: "#B8F6FF", glow: "#8FF0FF" } },
];
