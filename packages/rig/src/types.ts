/**
 * TamRig — data model.
 * Everything here is plain serialisable data (JSON-compatible) so rigs and clips
 * can be authored as files, versioned in git and shipped as content.
 */

/** Animatable channels of a bone. x/y/rot are additive offsets, sx/sy multiply the rest scale. */
export type Channel = "x" | "y" | "rot" | "sx" | "sy";
export const CHANNELS: readonly Channel[] = ["x", "y", "rot", "sx", "sy"];

export interface BoneDef {
  id: string;
  /** Parent bone id. Must be declared before this bone. `null` for the root. */
  parent: string | null;
  /** Rest transform relative to the parent (units = design px, y grows downwards). */
  x: number;
  y: number;
  /** Degrees. */
  rot?: number;
  sx?: number;
  sy?: number;
}

/**
 * Colour reference. Creatures are drawn in tint channels so genetics can recolour
 * them at runtime; fixed colours are used for things like eye highlights.
 */
export type TintKey =
  | "base"
  | "baseLight"
  | "baseShade"
  | "accent"
  | "accentLight"
  | "accentShade"
  | "ink"
  | "eye"
  | "glow";

export type PaintRef =
  | { tint: TintKey; alpha?: number }
  | { color: string; alpha?: number }
  /** Linear gradient in the part's local space (volume shading, ART_BIBLE §1). */
  | { gradient: (TintKey | string)[]; from: [number, number]; to: [number, number]; alpha?: number };

/** State slots: facial features and held props share the same visibility mechanism. */
export type FaceSlot = "eyes" | "mouth" | "brows" | "prop";

export interface PartDef {
  id: string;
  bone: string;
  /** SVG path data in the bone's local space. */
  d: string;
  fill?: PaintRef;
  stroke?: PaintRef;
  strokeWidth?: number;
  /** Draw order; lower is drawn first. */
  z: number;
  /** Only drawn when the face slot is in one of these states. */
  face?: { slot: FaceSlot; states: string[] };
  /** Gaussian blur sigma (soft glows). */
  blur?: number;
  /** Light-emitting part: glow and bloom scale with the creature's Lustre (ART_BIBLE §8). */
  emissive?: boolean;
  /** Receives the animated sheen sweep (ART_BIBLE §8). */
  sheen?: boolean;
  /** Only drawn for form-quality tiers in [min, max] (0 dull … 4 legendary). ART_BIBLE §8. */
  tiers?: [number, number];
}

/** Follow-through: a bone lags behind a driver bone's rotation (tails, flames, ears). */
export interface SecondaryDef {
  bone: string;
  driver: string;
  /** Seconds of lag. */
  lag: number;
  /** How much of the driver's recent rotation change is inherited (inverted). */
  gain: number;
  /** Reaction to horizontal root velocity (deg per unit/s). */
  velocityGain?: number;
  /** Idle sway. */
  sway?: { amp: number; freq: number };
  /** Flicker in scale (flames). */
  flicker?: { amp: number; freq: number };
}

export interface RigDef {
  id: string;
  bones: BoneDef[];
  parts: PartDef[];
  secondary?: SecondaryDef[];
  /** Bone that breathes (scaleY oscillation), usually the body. */
  breathBone?: string;
  /** Bones scaled on Y when blinking. */
  eyeBones?: string[];
}

export type Ease = "linear" | "in" | "out" | "inOut" | "step";

export interface Key {
  t: number;
  v: number;
  /** Easing used from this key to the next one. Default "inOut". */
  e?: Ease;
}

export interface FaceKey {
  t: number;
  v: string;
}

export interface ClipDef {
  id: string;
  duration: number;
  loop: boolean;
  tracks: Record<string, Partial<Record<Channel, Key[]>>>;
  face?: Partial<Record<FaceSlot, FaceKey[]>>;
  /** Procedural layer multipliers for this clip. */
  breath?: number;
  /** Breathing frequency in Hz (default 0.45). */
  breathRate?: number;
  blink?: boolean;
  /** Multiplier for flame/flicker style secondary motion. */
  flicker?: number;
}

export interface Palette {
  base: string;
  baseLight: string;
  baseShade: string;
  accent: string;
  accentLight: string;
  accentShade: string;
  ink: string;
  eye: string;
  glow: string;
}
