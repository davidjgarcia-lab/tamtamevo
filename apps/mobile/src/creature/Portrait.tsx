import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import type { ChispinClipId } from "@tamtam/art";
import { useEffect } from "react";
import { View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { drawTamtam, useCreature } from "./useCreature";
import type { Look } from "./resources";

/** Live animated portrait of a Tamtam (used in Granja, Arena and the header). */
export function Portrait({ alleleId, size = 96, clip = "idle", dir = 1, look }: { alleleId: string; size?: number; clip?: ChispinClipId; dir?: number; look?: Look }) {
  const c = useCreature(alleleId, look);
  useEffect(() => c.play(clip), [clip, c.play]);
  const { res, clock, playback, emitters } = c;
  const scale = size / 215;
  const pic = useDerivedValue(() => {
    const t = clock.value;
    return createPicture((cv) => {
      drawTamtam(cv, res, playback.value, emitters.value, t, { x: size / 2 + 4 * scale * dir, y: size * 0.8, scale, dir }, 0);
    }, Skia.XYWHRect(0, 0, size, size));
  }, [res, size, dir]);
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Canvas style={{ width: size, height: size }}>
        <Picture picture={pic} />
      </Canvas>
    </View>
  );
}
