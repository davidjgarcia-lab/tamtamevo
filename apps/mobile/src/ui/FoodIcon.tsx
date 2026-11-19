import { foodPicture } from "../creature/props";
import { Snapshot } from "./snapshot";

/** Food illustration (vector, same art used when the Tamtam eats it in the room). */
export function FoodIcon({ id, size = 48 }: { id: string; size?: number }) {
  return (
    <Snapshot
      id={`food:${id}`}
      w={size}
      h={size}
      draw={(c) => {
        c.translate(size / 2, size / 2);
        c.scale((size / 60) * 1.3, (size / 60) * 1.3);
        c.drawPicture(foodPicture(id));
      }}
    />
  );
}
