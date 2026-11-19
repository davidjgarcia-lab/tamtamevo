import { SLICE_CATALOG } from "@tamtam/core";
import { drawFurniture } from "../home/roomArt";
import { FoodIcon } from "./FoodIcon";
import { Snapshot } from "./snapshot";

/** Thumbnail of any catalog item (same vector art used in the room). */
export function ItemIcon({ id, size = 56 }: { id: string; size?: number }) {
  const item = SLICE_CATALOG.get(id);
  if (item?.category === "food") return <FoodIcon id={id} size={size} />;
  const f = item?.furniture;
  return (
    <Snapshot
      id={`item:${id}`}
      w={size}
      h={size}
      draw={(c) => {
        if (!f) return;
        const u = size / Math.max(f.w, f.h + 1.6, 2.2);
        const w = f.w * u;
        const h = f.layer === "wall" ? f.h * u : u * 0.6;
        drawFurniture(c, id, { x: (size - w) / 2, y: f.layer === "wall" ? (size - h) / 2 : size - h - 4, w, h }, false, undefined, u);
      }}
    />
  );
}
