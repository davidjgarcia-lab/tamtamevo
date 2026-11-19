/**
 * The nine anatomical/elemental families. Every body part, palette and particle of a Tamtam comes
 * from one of them; an evolved Tamtam can mix parts of any family (CREATURE_FAMILIES_ANATOMY.md).
 */
export type FamilyId = "fire" | "plant" | "metal" | "crystal" | "ghost" | "water" | "gel" | "ether" | "reptile";
export const FAMILY_IDS: readonly FamilyId[] = ["fire", "plant", "metal", "crystal", "ghost", "water", "gel", "ether", "reptile"];

export interface FamilyDef {
  id: FamilyId;
  name: string; // family name shown to the player
  element: string;
  /** Base colour options (picked by the genome) and accent/eye/glow. */
  bases: string[];
  accent: string;
  eye: string;
  glow: string;
  /** Name fragments to build form names. */
  prefixes: string[];
  suffix: string;
  /** Arena stat multipliers contributed by each part of this family. */
  stats: { hp: number; str: number; def: number; spd: number; crit: number; skill: number };
  skill: string;
  /** Locomotion when this family provides the legs. */
  locomotion: "walk" | "float" | "swim" | "bounce";
}

export const FAMILIES: Record<FamilyId, FamilyDef> = {
  fire: { id: "fire", name: "Magmáridos", element: "Fuego / lava", bases: ["#7D2430", "#5A1E1A", "#9A3412"], accent: "#FF7A24", eye: "#FFC247", glow: "#FFB347", prefixes: ["Brasa", "Magma", "Ígni", "Tizo"], suffix: "ardo", stats: { hp: 1, str: 1.18, def: 0.95, spd: 1.02, crit: 1.08, skill: 1.05 }, skill: "Lluvia de Ascuas", locomotion: "walk" },
  plant: { id: "plant", name: "Silváridos", element: "Planta / árbol", bases: ["#2F5D3A", "#4A6B2A", "#5B4632"], accent: "#9BE15D", eye: "#E8FFB0", glow: "#C8FF8A", prefixes: ["Rama", "Musgo", "Sauce", "Brote"], suffix: "ollo", stats: { hp: 1.16, str: 0.95, def: 1.05, spd: 0.94, crit: 0.95, skill: 1.06 }, skill: "Abrazo de Raíces", locomotion: "walk" },
  metal: { id: "metal", name: "Ferrálidos", element: "Metal", bases: ["#4E5A6B", "#6B5A4A", "#3A4458"], accent: "#FFB547", eye: "#9FE8FF", glow: "#FFD27A", prefixes: ["Ferro", "Cobre", "Acero", "Remache"], suffix: "ón", stats: { hp: 1.05, str: 1.08, def: 1.2, spd: 0.9, crit: 0.96, skill: 0.98 }, skill: "Martillo de Forja", locomotion: "walk" },
  crystal: { id: "crystal", name: "Cristálidos", element: "Cristal", bases: ["#3B3A7A", "#2A5C7A", "#6A3A7A"], accent: "#7CF4FF", eye: "#FFFFFF", glow: "#B8F8FF", prefixes: ["Cuarzo", "Prisma", "Gema", "Facet"], suffix: "ino", stats: { hp: 0.94, str: 1, def: 1.06, spd: 1, crit: 1.15, skill: 1.18 }, skill: "Prisma Cortante", locomotion: "walk" },
  ghost: { id: "ghost", name: "Umbrálidos", element: "Fantasma / oscuridad", bases: ["#2A2340", "#1E1B2E", "#3A2B4F"], accent: "#B983FF", eye: "#E9DDFF", glow: "#C9A2FF", prefixes: ["Umbra", "Sombra", "Niebla", "Velo"], suffix: "ombra", stats: { hp: 0.92, str: 1, def: 0.92, spd: 1.16, crit: 1.14, skill: 1.1 }, skill: "Abrazo Umbrío", locomotion: "float" },
  water: { id: "water", name: "Mareálidos", element: "Agua", bases: ["#1F4E79", "#16606A", "#2B3F86"], accent: "#4FE3FF", eye: "#E6FBFF", glow: "#8FF0FF", prefixes: ["Marea", "Coral", "Ola", "Perla"], suffix: "ina", stats: { hp: 1.04, str: 0.98, def: 1, spd: 1.12, crit: 1, skill: 1.04 }, skill: "Torbellino", locomotion: "swim" },
  gel: { id: "gel", name: "Gelíferos", element: "Gelatina", bases: ["#3E8F7A", "#8A4F9E", "#B0603E"], accent: "#FFE08A", eye: "#FFFFFF", glow: "#FFF1B8", prefixes: ["Gela", "Mochi", "Flan", "Blub"], suffix: "uchi", stats: { hp: 1.2, str: 0.92, def: 1.1, spd: 0.92, crit: 0.92, skill: 1 }, skill: "Rebote Elástico", locomotion: "bounce" },
  ether: { id: "ether", name: "Etéridos", element: "Aire / espíritu", bases: ["#5E6AA8", "#7A6AB8", "#4F7FA8"], accent: "#FFF3B0", eye: "#FFFFFF", glow: "#FFFBE0", prefixes: ["Aura", "Céfiro", "Nimbo", "Brisa"], suffix: "iel", stats: { hp: 0.95, str: 0.96, def: 0.94, spd: 1.14, crit: 1.05, skill: 1.16 }, skill: "Viento Sagrado", locomotion: "float" },
  reptile: { id: "reptile", name: "Escamáridos", element: "Tierra / escama", bases: ["#5C3A2E", "#3F5A3A", "#6B4A2A"], accent: "#E8B04A", eye: "#FFD580", glow: "#FFE0A0", prefixes: ["Escama", "Draco", "Saurio", "Garra"], suffix: "ex", stats: { hp: 1.06, str: 1.08, def: 1.06, spd: 1.04, crit: 1.02, skill: 0.98 }, skill: "Mordisco Feroz", locomotion: "walk" },
};

export type EyeStyle = "slit" | "round" | "ring" | "glow" | "twin" | "visor";
export const EYE_STYLES: readonly EyeStyle[] = ["slit", "round", "ring", "glow", "twin", "visor"];
/** Eye styles each family tends to give (head family decides, with some chance of any). */
export const FAMILY_EYES: Record<FamilyId, EyeStyle[]> = {
  fire: ["slit", "glow"], plant: ["round", "ring"], metal: ["visor", "ring"], crystal: ["glow", "twin"], ghost: ["glow", "twin"],
  water: ["round", "ring"], gel: ["round", "twin"], ether: ["glow", "ring"], reptile: ["slit", "round"],
};

export type PatternId = "seams" | "spots" | "stripes" | "veins" | "rings" | "facets" | "rivets" | "none";
export const PATTERNS: readonly PatternId[] = ["seams", "spots", "stripes", "veins", "rings", "facets", "rivets", "none"];
export const FAMILY_PATTERNS: Record<FamilyId, PatternId[]> = {
  fire: ["seams", "spots"], plant: ["veins", "spots"], metal: ["rivets", "stripes"], crystal: ["facets", "veins"], ghost: ["rings", "none"],
  water: ["spots", "rings"], gel: ["spots", "none"], ether: ["rings", "stripes"], reptile: ["stripes", "spots"],
};

export type Mutation = "none" | "iridescent" | "melanic" | "albino" | "aurora";
export const MUTATIONS: readonly Mutation[] = ["none", "iridescent", "melanic", "albino", "aurora"];
