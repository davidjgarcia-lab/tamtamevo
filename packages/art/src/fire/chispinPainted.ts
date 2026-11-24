import type { RigDef } from "@tamtam/rig";
import { chispinRig } from "./chispin";
import { CHISPIN_PAINTED } from "./chispinPainted.data";

/**
 * CHISPÍN PAINTED — the AI-painted illustration made in the Unity project (PaintedChispinBuilder.cs),
 * as a skinned mesh for the app. Same bone ids and order as chispinRig, so the 14 clips, the procedural
 * layers (breath, blink, tail/flame follow-through) and the props work unchanged.
 * Bones carry no rest rotation; the mesh is skinned on the CPU at draw time (apps/mobile/src/creature/painted.ts).
 */
export const chispinPaintedRig: RigDef = {
  id: "fire_baby_chispin_painted",
  bones: CHISPIN_PAINTED.bones.map((b) => ({ id: b.id, parent: b.parent, x: b.x, y: b.y })),
  breathBone: "body",
  eyeBones: ["eye"],
  secondary: chispinRig.secondary,
  parts: [],
};

export { CHISPIN_PAINTED };
