import { LOOK, TIER_INDEX, type LustreTier } from "@tamtam/core";
import type { Look } from "./resources";

/**
 * Final look = engraved form quality (ornaments, halo, sheen, emissive) — recorded at the
 * last Ritual — combined with the live state: a currently neglected Tamtam loses colour
 * and particles until it is cared for again. A baby (no Ritual yet) uses its live tier.
 */
export function composeLook(formTier: LustreTier, liveTier: LustreTier): Look {
  const f = LOOK[formTier];
  const l = LOOK[liveTier];
  return {
    ...f,
    saturation: Math.min(f.saturation, l.saturation),
    particles: Math.min(f.particles, l.particles),
    emissive: Math.min(f.emissive, Math.max(l.emissive, f.emissive * 0.7)),
    tier: TIER_INDEX[formTier],
  };
}
