import type { EmitterDef, PaletteGenes, PartDef, RigDef } from "@tamtam/rig";
import { chispinEmitters, chispinRig, type ChispinClipId } from "../fire/chispin";
import { backParts, bodyParts, eyeParts, headParts, legParts, patternParts, tailParts, type Fam } from "./parts";

/** Structural copy of @tamtam/core's Genome (art does not depend on core). */
export interface GenomeLike {
  parts: Record<"body" | "head" | "legs" | "tail" | "back", Fam>;
  variant: Record<"body" | "head" | "legs" | "tail" | "back", number>;
  eyes: string;
  pattern: string;
  palette: { base: Fam; shade: number; accent: Fam };
  mutation: string;
}

/** Family colours (kept in sync with core/genetics/families.ts — checked by a test). */
export const FAMILY_COLORS: Record<Fam, { bases: string[]; accent: string; eye: string; glow: string; particle: { shape: EmitterDef["shape"]; color: string } }> = {
  fire: { bases: ["#8A2A22", "#6E1E1A", "#A8361E"], accent: "#FF8A2A", eye: "#FFC247", glow: "#FFB347", particle: { shape: "ember", color: "#FFD166" } },
  water: { bases: ["#2A6FD6", "#1E5AB8", "#3A86E8"], accent: "#5CE6FF", eye: "#E6FBFF", glow: "#9FF0FF", particle: { shape: "bubble", color: "#9FE6FF" } },
  plant: { bases: ["#6E8F2E", "#4F7A2A", "#7A6A3A"], accent: "#B6E35D", eye: "#E8FFB0", glow: "#D4FF8A", particle: { shape: "crumb", color: "#9BE15D" } },
  electric: { bases: ["#2B356B", "#232B5A", "#3A4488"], accent: "#FFD23F", eye: "#9FE8FF", glow: "#FFF07A", particle: { shape: "spark", color: "#FFE45C" } },
  rock: { bases: ["#6B5340", "#5A4A3C", "#7A5E44"], accent: "#FF8A2A", eye: "#FFD580", glow: "#FFB866", particle: { shape: "crumb", color: "#C9A27A" } },
  shadow: { bases: ["#3A1F6B", "#2A1650", "#4B2A86"], accent: "#C77DFF", eye: "#F2E6FF", glow: "#D9A8FF", particle: { shape: "bubble", color: "#9B6BE0" } },
  light: { bases: ["#F1C6D4", "#F5D8B8", "#E9C0E6"], accent: "#FFD36E", eye: "#FFFFFF", glow: "#FFF3C4", particle: { shape: "spark", color: "#FFF0B0" } },
  crystal: { bases: ["#2C4E9A", "#3A5FB8", "#24407E"], accent: "#9FE4FF", eye: "#FFFFFF", glow: "#C8F4FF", particle: { shape: "spark", color: "#C8F4FF" } },
  plasma: { bases: ["#6A2FB8", "#5226A0", "#7B3FD0"], accent: "#FF7BE0", eye: "#FFFFFF", glow: "#E3A6FF", particle: { shape: "bubble", color: "#E3A6FF" } },
  mystic: { bases: ["#2A2E7A", "#3B3F9A", "#4A3E8E"], accent: "#9EE8FF", eye: "#FFFFFF", glow: "#FFC2EC", particle: { shape: "spark", color: "#FFC2EC" } },
};

/** Parts shared by every form (mouth, brows, closed eyes, quality ornaments, props) — taken from Chispín v3. */
export const SHARED_PART_IDS = new Set([
  "jaw", "jawBelly", "mouthIn", "tongue", "teeth", "drool", "mouthLine", "mouthSmile", "fang", "nostril",
  "browN", "browH", "browA", "browS", "browU", "eyeClosed", "eyeHappy",
  "sootA", "sootB", "sootC", "goldSeam", "goldScaleA", "goldScaleB", "rune", "runeGlow", "crown0", "crown1", "crown2",
  "dumbbellBar", "dumbbellA", "dumbbellB",
]);

export function genomePalette(g: GenomeLike): PaletteGenes {
  const b = FAMILY_COLORS[g.palette.base];
  const a = FAMILY_COLORS[g.palette.accent];
  let base = b.bases[g.palette.shade % b.bases.length]!;
  let accent = a.accent;
  let eye = FAMILY_COLORS[g.parts.head].eye;
  let glow = a.glow;
  if (g.mutation === "melanic") base = "#1C1620";
  if (g.mutation === "albino") { base = "#E8E2EA"; eye = "#FF6F91"; }
  if (g.mutation === "aurora") { accent = "#7CFFCB"; glow = "#B8FFE6"; }
  if (g.mutation === "iridescent") { accent = "#FF8FE0"; glow = "#C8F4FF"; }
  return { base, accent, eye, glow };
}

/** Builds the rig of an evolved Tamtam from its genome (same skeleton and clips as Chispín v3). */
export function genomeRig(g: GenomeLike): { rig: RigDef; float: boolean } {
  const legs = legParts(g.parts.legs, g.variant.legs);
  const parts: PartDef[] = [
    ...chispinRig.parts.filter((p) => SHARED_PART_IDS.has(p.id)),
    ...bodyParts(g.parts.body, g.variant.body),
    ...headParts(g.parts.head, g.variant.head),
    ...eyeParts(g.eyes),
    ...legs.parts,
    ...tailParts(g.parts.tail, g.variant.tail),
    ...backParts(g.parts.back, g.variant.back),
    ...patternParts(g.pattern),
  ];
  // Unique ids (the compiler requires them).
  const seen = new Map<string, number>();
  const unique = parts.map((p) => {
    const n = seen.get(p.id) ?? 0;
    seen.set(p.id, n + 1);
    return n ? { ...p, id: `${p.id}_${n}` } : p;
  });
  // Floating families: the body hovers 14 u higher; wisps replace feet.
  const bones = chispinRig.bones.map((b) => (legs.float && b.id === "body" ? { ...b, y: b.y - 14 } : b));
  return { rig: { ...chispinRig, id: `genome`, bones, parts: unique }, float: legs.float };
}

/** Particles of an evolved form: the back appendage's family replaces Chispín's embers. */
export function genomeEmitters(g: GenomeLike): Record<ChispinClipId, EmitterDef[]> {
  const pt = FAMILY_COLORS[g.parts.back].particle;
  const out = {} as Record<ChispinClipId, EmitterDef[]>;
  for (const [k, list] of Object.entries(chispinEmitters) as [ChispinClipId, EmitterDef[]][]) {
    out[k] = list.map((e) => (e.id === "embers" ? { ...e, shape: pt.shape, color: pt.color, ...(pt.shape === "crumb" ? { gravity: -10, spin: 120 } : {}) } : e));
  }
  return out;
}
