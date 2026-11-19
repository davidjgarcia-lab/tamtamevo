import { registerRootComponent } from "expo";
import { Platform } from "react-native";

// On web, Skia runs on CanvasKit (WebAssembly), which must be loaded before any Skia code is imported.
if (Platform.OS === "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LoadSkiaWeb } = require("@shopify/react-native-skia/lib/module/web");
  // Relative path so the build also works when hosted under a sub-path (artifact, previews).
  LoadSkiaWeb({ locateFile: (file: string) => `./${file}` }).then(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    registerRootComponent(require("./App").default);
  });
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  registerRootComponent(require("./App").default);
}
