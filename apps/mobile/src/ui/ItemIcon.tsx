import { SLICE_CATALOG } from "@tamtam/core";
import { Skia } from "@shopify/react-native-skia";
import { drawFloor, drawFurniture, drawWall } from "../home/roomArt";
import { FoodIcon } from "./FoodIcon";
import { Image } from "react-native";
import { PROP_SRC } from "../home/props";
import { Snapshot } from "./snapshot";

/** Thumbnail of any catalog item (same vector art used in the room). */
export function ItemIcon({ id, size = 56 }: { id: string; size?: number }) {
  const item = SLICE_CATALOG.get(id);
  if (item?.category === "food") return <FoodIcon id={id} size={size} />;
  if (item?.category === "surfaces") {
    return (
      <Snapshot
        id={`finish:${id}`}
        w={size}
        h={size}
        draw={(c) => {
          c.clipRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, size, size), 10, 10), 1, true);
          c.save();
          c.scale(0.5, 0.5);
          if (id.startsWith("wall_")) drawWall(c, id, size * 2, 0, size * 2);
          else drawFloor(c, id, size * 2, 0, size * 2);
          c.restore();
        }}
      />
    );
  }
  const f = item?.furniture;
  if (PROP_SRC[id]) {
    return <Image source={PROP_SRC[id]} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />;
  }
  return (
    <Snapshot
      id={`item:${id}`}
      w={size}
      h={size}
      draw={(c) => {
        if (!f) return;
        const u = f.layer === "wall" ? (size * 0.95) / Math.max(f.w, f.h) : size / Math.max(f.w, f.h + 1.6, 2.2);
        const w = f.w * u;
        const h = f.layer === "wall" ? f.h * u : u * 0.6;
        drawFurniture(c, id, { x: (size - w) / 2, y: f.layer === "wall" ? (size - h) / 2 : size - h - 4, w, h }, false, undefined, u);
      }}
    />
  );
}
