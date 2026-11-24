import { Skia, type SkCanvas, type SkImage, type SkPaint } from "@shopify/react-native-skia";
import { CHISPIN_PAINTED, type GenomeLike } from "@tamtam/art";
import type { Frame } from "@tamtam/rig";

/**
 * Evolved forms drawn with the PAINTED family art (TamTam EVO art sheets, 2026-11-24): 10 families × 3 stages.
 * The sprite follows the body bone of the shared skeleton, so the 14 clips (breath, walk, attack, eat, jump…),
 * props, dirt and accessories keep working. Source: tools/import-family-sheet.py (cut-out + EDSR ×4 upscale).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const FAMILY_SPRITES: Record<string, number> = {
  fire_initial: require("../../assets/creatures/families/fire_initial.webp"),
  fire_intermediate: require("../../assets/creatures/families/fire_intermediate.webp"),
  fire_final: require("../../assets/creatures/families/fire_final.webp"),
  water_initial: require("../../assets/creatures/families/water_initial.webp"),
  water_intermediate: require("../../assets/creatures/families/water_intermediate.webp"),
  water_final: require("../../assets/creatures/families/water_final.webp"),
  plant_initial: require("../../assets/creatures/families/plant_initial.webp"),
  plant_intermediate: require("../../assets/creatures/families/plant_intermediate.webp"),
  plant_final: require("../../assets/creatures/families/plant_final.webp"),
  electric_initial: require("../../assets/creatures/families/electric_initial.webp"),
  electric_intermediate: require("../../assets/creatures/families/electric_intermediate.webp"),
  electric_final: require("../../assets/creatures/families/electric_final.webp"),
  rock_initial: require("../../assets/creatures/families/rock_initial.webp"),
  rock_intermediate: require("../../assets/creatures/families/rock_intermediate.webp"),
  rock_final: require("../../assets/creatures/families/rock_final.webp"),
  shadow_initial: require("../../assets/creatures/families/shadow_initial.webp"),
  shadow_intermediate: require("../../assets/creatures/families/shadow_intermediate.webp"),
  shadow_final: require("../../assets/creatures/families/shadow_final.webp"),
  light_initial: require("../../assets/creatures/families/light_initial.webp"),
  light_intermediate: require("../../assets/creatures/families/light_intermediate.webp"),
  light_final: require("../../assets/creatures/families/light_final.webp"),
  crystal_initial: require("../../assets/creatures/families/crystal_initial.webp"),
  crystal_intermediate: require("../../assets/creatures/families/crystal_intermediate.webp"),
  crystal_final: require("../../assets/creatures/families/crystal_final.webp"),
  plasma_initial: require("../../assets/creatures/families/plasma_initial.webp"),
  plasma_intermediate: require("../../assets/creatures/families/plasma_intermediate.webp"),
  plasma_final: require("../../assets/creatures/families/plasma_final.webp"),
  mystic_initial: require("../../assets/creatures/families/mystic_initial.webp"),
  mystic_intermediate: require("../../assets/creatures/families/mystic_intermediate.webp"),
  mystic_final: require("../../assets/creatures/families/mystic_final.webp"),
};
/* eslint-enable @typescript-eslint/no-require-imports */

export type SpriteStage = "initial" | "intermediate" | "final";
/** Tamtam stage → art stage (the baby is the painted Chispín). */
export const ART_STAGE: Record<string, SpriteStage> = { baby: "initial", child: "initial", juvenile: "intermediate", adult: "final" };

/** Family that "shows": most parts; ties go to the back part (it also gives the skill and particles). */
export function dominantFamily(g: GenomeLike): string {
  const n: Record<string, number> = {};
  for (const s of ["body", "head", "legs", "tail", "back"] as const) n[g.parts[s]] = (n[g.parts[s]] ?? 0) + (s === "back" ? 1.1 : 1);
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]![0];
}
export const spriteKey = (g: GenomeLike, stage = "juvenile") => `${dominantFamily(g)}_${ART_STAGE[stage] ?? "intermediate"}`;

export interface SpriteRes {
  img: SkImage;
  rect: { x: number; y: number; w: number; h: number };
  paint: SkPaint;
  bone: number;
  /** Inverse of the body bone's rest world matrix [a, b, c, d, tx, ty]. */
  restInv: number[];
  lift: number;
}

const FLOATERS = new Set(["shadow", "light", "plasma"]);

/** Colour matrix for rare mutations (the painted art keeps its colours otherwise). */
function mutationFilter(m: string): number[] | null {
  if (m === "melanic") return [0.45, 0, 0, 0, 0, 0, 0.42, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 1, 0];
  if (m === "albino") return [0.35, 0.35, 0.3, 0, 0.32, 0.33, 0.35, 0.3, 0, 0.32, 0.33, 0.33, 0.34, 0, 0.34, 0, 0, 0, 1, 0];
  if (m === "aurora") return [0.4, 0.3, 0.3, 0, 0, 0.2, 0.9, 0.2, 0, 0.06, 0.25, 0.3, 0.7, 0, 0.06, 0, 0, 0, 1, 0];
  if (m === "iridescent") return [0.9, 0.1, 0.2, 0, 0.04, 0.05, 0.85, 0.15, 0, 0.02, 0.2, 0.05, 0.95, 0, 0.06, 0, 0, 0, 1, 0];
  return null;
}

export function buildSprite(img: SkImage, genome: GenomeLike, boneIndex: number): SpriteRes {
  const H = 118;
  const w = (img.width() / img.height()) * H;
  const fam = dominantFamily(genome);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  const f = mutationFilter(genome.mutation);
  if (f) paint.setColorFilter(Skia.ColorFilter.MakeMatrix(f));
  // Rest world of the body bone (bones have no rest rotation): sum of offsets along the chain.
  let x = 0, y = 0;
  let b: { id: string; parent: string | null; x: number; y: number } | undefined = CHISPIN_PAINTED.bones.find((q) => q.id === "body");
  while (b) {
    x += b.x;
    y += b.y;
    b = b.parent ? CHISPIN_PAINTED.bones.find((q) => q.id === b!.parent) : undefined;
  }
  return { img, rect: { x: 12 - w / 2, y: 12 - H, w, h: H }, paint, bone: boneIndex, restInv: [1, 0, 0, 1, -x, -y], lift: FLOATERS.has(fam) ? 8 : 0 };
}

/** Draws the sprite moved by the body bone: current world × inverse(rest). */
export function drawSprite(canvas: SkCanvas, s: SpriteRes, frame: Frame, t: number) {
  "worklet";
  const w = frame.world;
  const o = s.bone * 6;
  const a = w[o]!, b = w[o + 1]!, c = w[o + 2]!, d = w[o + 3]!, tx = w[o + 4]!, ty = w[o + 5]!;
  const r = s.restInv;
  // M = cur * restInv (2D affine)
  const A = a * r[0]! + c * r[1]!, B = b * r[0]! + d * r[1]!, C = a * r[2]! + c * r[3]!, D = b * r[2]! + d * r[3]!;
  const TX = a * r[4]! + c * r[5]! + tx, TY = b * r[4]! + d * r[5]! + ty;
  canvas.save();
  canvas.concat(Skia.Matrix([A, C, TX, B, D, TY - s.lift - (s.lift ? Math.sin(t * 2.2) * 3 : 0), 0, 0, 1]));
  canvas.drawImageRect(s.img, Skia.XYWHRect(0, 0, s.img.width(), s.img.height()), Skia.XYWHRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h), s.paint);
  canvas.restore();
}
