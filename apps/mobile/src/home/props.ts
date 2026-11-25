import { useImage, type SkImage } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";

/** Painted props (user asset sheet, cut out and upscaled ×4): furniture drawn from PNG art instead of vectors. */
/* eslint-disable @typescript-eslint/no-require-imports */
export const PROP_SRC: Record<string, number> = {
  prop_banner_royal: require("../../assets/props/prop_banner_royal.webp"),
  prop_barrel: require("../../assets/props/prop_barrel.webp"),
  prop_crate: require("../../assets/props/prop_crate.webp"),
  prop_crystal_amber: require("../../assets/props/prop_crystal_amber.webp"),
  prop_crystal_blue: require("../../assets/props/prop_crystal_blue.webp"),
  prop_crystal_purple: require("../../assets/props/prop_crystal_purple.webp"),
  prop_fence: require("../../assets/props/prop_fence.webp"),
  prop_lantern: require("../../assets/props/prop_lantern.webp"),
  prop_log: require("../../assets/props/prop_log.webp"),
  prop_mushroom_cyan: require("../../assets/props/prop_mushroom_cyan.webp"),
  prop_mushroom_red: require("../../assets/props/prop_mushroom_red.webp"),
  prop_pond: require("../../assets/props/prop_pond.webp"),
  prop_rock_moss: require("../../assets/props/prop_rock_moss.webp"),
  prop_stump: require("../../assets/props/prop_stump.webp"),
  prop_tree_orange: require("../../assets/props/prop_tree_orange.webp"),
  prop_tree_pink: require("../../assets/props/prop_tree_pink.webp"),
  prop_waterfall: require("../../assets/props/prop_waterfall.webp"),
};
/* eslint-enable @typescript-eslint/no-require-imports */
const IDS = Object.keys(PROP_SRC);

/** Loaded images (filled by usePropImages; read by drawFurniture). */
export const PROP_IMAGES: Record<string, SkImage> = {};

/** Loads every prop image once; returns how many are ready (use it as a memo dependency). */
export function usePropImages(): number {
  const imgs = IDS.map((id) => useImage(PROP_SRC[id]!)); // eslint-disable-line react-hooks/rules-of-hooks
  const [n, setN] = useState(0);
  const ready = imgs.filter(Boolean).length;
  useEffect(() => {
    IDS.forEach((id, i) => {
      if (imgs[i]) PROP_IMAGES[id] = imgs[i]!;
    });
    setN(ready);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return n;
}
