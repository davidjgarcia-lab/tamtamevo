import { Skia, type SkCanvas } from "@shopify/react-native-skia";
import { Image, PixelRatio, View } from "react-native";

/**
 * Static vector art (icons, food, furniture thumbnails) is rendered ONCE to a PNG and shown as an
 * Image. On the web every Skia <Canvas> is a WebGL context and browsers only keep ~16 alive, so
 * dozens of tiny canvases would make older ones go blank. Cached by key.
 */
const cache = new Map<string, string>();

export function snapshotUri(key: string, w: number, h: number, draw: (c: SkCanvas) => void): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const k = Math.max(2, Math.min(3, PixelRatio.get()));
  const surf = Skia.Surface.Make(Math.ceil(w * k), Math.ceil(h * k));
  if (!surf) return "";
  const c = surf.getCanvas();
  c.scale(k, k);
  draw(c);
  surf.flush();
  const uri = `data:image/png;base64,${surf.makeImageSnapshot().encodeToBase64()}`;
  cache.set(key, uri);
  return uri;
}

export function Snapshot({ id, w, h, draw }: { id: string; w: number; h: number; draw: (c: SkCanvas) => void }) {
  const uri = snapshotUri(`${id}|${w}x${h}`, w, h, draw);
  return (
    <View style={{ width: w, height: h }} pointerEvents="none">
      {uri ? <Image source={{ uri }} style={{ width: w, height: h }} /> : null}
    </View>
  );
}
