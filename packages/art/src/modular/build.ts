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
  fire: { bases: ["#7D2430", "#5A1E1A", "#9A3412"], accent: "#FF7A24", eye: "#FFC247", glow: "#FFB347", particle: { shape: "ember", color: "#FFD166" } },
  plant: { bases: ["#2F5D3A", "#4A6B2A", "#5B4632"], accent: "#9BE15D", eye: "#E8FFB0", glow: "#C8FF8A", particle: { shape: "crumb", color: "#9BE15D" } },
  metal: { bases: ["#4E5A6B", "#6B5A4A", "#3A4458"], accent: "#FFB547", eye: "#9FE8FF", glow: "#FFD27A", particle: { shape: "spark", color: "#FFD27A" } },
  crystal: { bases: ["#3B3A7A", "#2A5C7A", "#6A3A7A"], accent: "#7CF4FF", eye: "#FFFFFF", glow: "#B8F8FF", particle: { shape: "spark", color: "#B8F8FF" } },
  ghost: { bases: ["#2A2340", "#1E1B2E", "#3A2B4F"], accent: "#B983FF", eye: "#E9DDFF", glow: "#C9A2FF", particle: { shape: "bubble", color: "#8C6BC8" } },
  water: { bases: ["#1F4E79", "#16606A", "#2B3F86"], accent: "#4FE3FF", eye: "#E6FBFF", glow: "#8FF0FF", particle: { shape: "bubble", color: "#9FE6FF" } },
  gel: { bases: ["#3E8F7A", "#8A4F9E", "#B0603E"], accent: "#FFE08A", eye: "#FFFFFF", glow: "#FFF1B8", particle: { shape: "bubble", color: "#FFF1B8" } },
  ether: { bases: ["#5E6AA8", "#7A6AB8", "#4F7FA8"], accent: "#FFF3B0", eye: "#FFFFFF", glow: "#FFFBE0", particle: { shape: "spark", color: "#FFFBE0" } },
  reptile: { bases: ["#5C3A2E", "#3F5A3A", "#6B4A2A"], accent: "#E8B04A", eye: "#FFD580", glow: "#FFE0A0", particle: { shape: "crumb", color: "#C9A27A" } },
};

/** Parts shared by every form (mouth, brows, closed eyes, quality ornaments, props) — taken from Chispín v3. */
const SHARED = new Set([
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
    ...chispinRig.parts.filter((p) => SHARED.has(p.id)),
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
