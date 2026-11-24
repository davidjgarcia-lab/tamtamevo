/**
 * The ten families (TamTam EVO art sheets 2026-11-24: Brasildo, Aqualin, Foliaris, Voltix, Rocanix, Umbrin, Lúmina, Diamor, Plasmax, Mistor). Every body part, palette and particle of a Tamtam comes
 * from one of them; an evolved Tamtam can mix parts of any family (CREATURE_FAMILIES_ANATOMY.md).
 */
export type FamilyId = "fire" | "plant" | "electric" | "crystal" | "shadow" | "water" | "plasma" | "light" | "rock" | "mystic";
export const FAMILY_IDS: readonly FamilyId[] = ["fire", "plant", "electric", "crystal", "shadow", "water", "plasma", "light", "rock", "mystic"];

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
  fire: { id: "fire", name: "Brasildo", element: "Fuego", bases: ["#8A2A22", "#6E1E1A", "#A8361E"], accent: "#FF8A2A", eye: "#FFC247", glow: "#FFB347", prefixes: ["Brasa", "Ígni", "Tizo", "Llama"], suffix: "ildo", stats: { hp: 1, str: 1.18, def: 0.95, spd: 1.02, crit: 1.08, skill: 1.05 }, skill: "Lluvia de Ascuas", locomotion: "walk" },
  water: { id: "water", name: "Aqualin", element: "Agua", bases: ["#2A6FD6", "#1E5AB8", "#3A86E8"], accent: "#5CE6FF", eye: "#E6FBFF", glow: "#9FF0FF", prefixes: ["Aqua", "Marea", "Ola", "Perla"], suffix: "alin", stats: { hp: 1.04, str: 0.98, def: 1, spd: 1.12, crit: 1, skill: 1.04 }, skill: "Torbellino", locomotion: "swim" },
  plant: { id: "plant", name: "Foliaris", element: "Planta", bases: ["#6E8F2E", "#4F7A2A", "#7A6A3A"], accent: "#B6E35D", eye: "#E8FFB0", glow: "#D4FF8A", prefixes: ["Folia", "Rama", "Musgo", "Brote"], suffix: "aris", stats: { hp: 1.16, str: 0.95, def: 1.05, spd: 0.94, crit: 0.95, skill: 1.06 }, skill: "Abrazo de Raíces", locomotion: "walk" },
  electric: { id: "electric", name: "Voltix", element: "Eléctrico", bases: ["#2B356B", "#232B5A", "#3A4488"], accent: "#FFD23F", eye: "#9FE8FF", glow: "#FFF07A", prefixes: ["Volt", "Rayo", "Chispa", "Trueno"], suffix: "ix", stats: { hp: 0.96, str: 1.06, def: 0.95, spd: 1.18, crit: 1.12, skill: 1.02 }, skill: "Descarga Rayo", locomotion: "walk" },
  rock: { id: "rock", name: "Rocanix", element: "Roca", bases: ["#6B5340", "#5A4A3C", "#7A5E44"], accent: "#FF8A2A", eye: "#FFD580", glow: "#FFB866", prefixes: ["Roca", "Pedra", "Basal", "Cantil"], suffix: "anix", stats: { hp: 1.12, str: 1.08, def: 1.2, spd: 0.88, crit: 0.96, skill: 0.98 }, skill: "Avalancha", locomotion: "walk" },
  shadow: { id: "shadow", name: "Umbrin", element: "Sombra", bases: ["#3A1F6B", "#2A1650", "#4B2A86"], accent: "#C77DFF", eye: "#F2E6FF", glow: "#D9A8FF", prefixes: ["Umbra", "Sombra", "Niebla", "Velo"], suffix: "rin", stats: { hp: 0.92, str: 1, def: 0.92, spd: 1.16, crit: 1.14, skill: 1.1 }, skill: "Abrazo Umbrío", locomotion: "float" },
  light: { id: "light", name: "Lúmina", element: "Luz", bases: ["#F1C6D4", "#F5D8B8", "#E9C0E6"], accent: "#FFD36E", eye: "#FFFFFF", glow: "#FFF3C4", prefixes: ["Lumi", "Aura", "Alba", "Halo"], suffix: "ina", stats: { hp: 0.95, str: 0.96, def: 0.94, spd: 1.14, crit: 1.05, skill: 1.16 }, skill: "Rayo Sagrado", locomotion: "float" },
  crystal: { id: "crystal", name: "Diamor", element: "Cristal", bases: ["#2C4E9A", "#3A5FB8", "#24407E"], accent: "#9FE4FF", eye: "#FFFFFF", glow: "#C8F4FF", prefixes: ["Diam", "Prisma", "Gema", "Cuarzo"], suffix: "or", stats: { hp: 0.94, str: 1, def: 1.1, spd: 1, crit: 1.15, skill: 1.14 }, skill: "Prisma Cortante", locomotion: "walk" },
  plasma: { id: "plasma", name: "Plasmax", element: "Plasma", bases: ["#6A2FB8", "#5226A0", "#7B3FD0"], accent: "#FF7BE0", eye: "#FFFFFF", glow: "#E3A6FF", prefixes: ["Plasma", "Nebu", "Orbi", "Cosmo"], suffix: "ax", stats: { hp: 1.2, str: 0.92, def: 1.06, spd: 0.92, crit: 0.94, skill: 1.08 }, skill: "Órbita Plasmática", locomotion: "bounce" },
  mystic: { id: "mystic", name: "Mistor", element: "Místico", bases: ["#2A2E7A", "#3B3F9A", "#4A3E8E"], accent: "#9EE8FF", eye: "#FFFFFF", glow: "#FFC2EC", prefixes: ["Misti", "Runa", "Arcan", "Sueño"], suffix: "or", stats: { hp: 1, str: 0.98, def: 0.98, spd: 1.06, crit: 1.06, skill: 1.18 }, skill: "Ilusión Arcana", locomotion: "walk" },
};

export type EyeStyle = "slit" | "round" | "ring" | "glow" | "twin" | "visor";
export const EYE_STYLES: readonly EyeStyle[] = ["slit", "round", "ring", "glow", "twin", "visor"];
/** Eye styles each family tends to give (head family decides, with some chance of any). */
export const FAMILY_EYES: Record<FamilyId, EyeStyle[]> = {
  fire: ["slit", "glow"], plant: ["round", "ring"], electric: ["visor", "ring"], crystal: ["glow", "twin"], shadow: ["glow", "twin"],
  water: ["round", "ring"], plasma: ["round", "twin"], light: ["glow", "ring"], rock: ["slit", "round"], mystic: ["glow", "twin"],
};

export type PatternId = "seams" | "spots" | "stripes" | "veins" | "rings" | "facets" | "rivets" | "none";
export const PATTERNS: readonly PatternId[] = ["seams", "spots", "stripes", "veins", "rings", "facets", "rivets", "none"];
export const FAMILY_PATTERNS: Record<FamilyId, PatternId[]> = {
  fire: ["seams", "spots"], plant: ["veins", "spots"], electric: ["rivets", "stripes"], crystal: ["facets", "veins"], shadow: ["rings", "none"],
  water: ["spots", "rings"], plasma: ["spots", "none"], light: ["rings", "stripes"], rock: ["stripes", "spots"], mystic: ["rings", "veins"],
};

export type Mutation = "none" | "iridescent" | "melanic" | "albino" | "aurora";
export const MUTATIONS: readonly Mutation[] = ["none", "iridescent", "melanic", "albino", "aurora"];
