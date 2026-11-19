import { Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2/800ExtraBold";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GameProvider } from "./src/game/GameProvider";
import { AppShell } from "./src/screens/AppShell";
import { LoadingScreen } from "./src/screens/LoadingScreen";
import { RigLabScreen } from "./src/screens/RigLabScreen";
import { Platform } from "react-native";

/** Dev tool on web: open with #riglab to inspect the creature rig and clips. */
const RIG_LAB = Platform.OS === "web" && typeof window !== "undefined" && window.location.hash === "#riglab";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Minimum time the branded loading screen stays visible (a brief brand flash, not a wait). */
const MIN_LOADING_MS = 400;

// Web: long-press must never select text or open the context menu (mobile browsers).
if (Platform.OS === "web" && typeof document !== "undefined") {
  const st = document.createElement("style");
  st.textContent = "*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}input,textarea,[data-selectable]{-webkit-user-select:text;user-select:text}";
  document.head.appendChild(st);
  document.addEventListener("contextmenu", (e) => {
    const el = e.target as HTMLElement | null;
    if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) e.preventDefault();
  });
}

export default function App() {
  const [fontsLoaded] = useFonts({ Baloo2_800ExtraBold, Inter_500Medium, Inter_700Bold });
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    // Native splash (launcher) → branded loading screen as soon as React is up.
    void SplashScreen.hideAsync().catch(() => undefined);
    const t = setTimeout(() => setMinElapsed(true), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  const loading = (progress: number, step: string) => <LoadingScreen progress={progress} step={step} />;

  if (RIG_LAB && fontsLoaded) return <SafeAreaProvider><RigLabScreen /></SafeAreaProvider>;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!fontsLoaded ? (
        loading(0.35, "Despertando el archipiélago…")
      ) : (
        <GameProvider fallback={loading(0.75, "Buscando tu partida…")}>
          {minElapsed ? <AppShell /> : loading(1, "¡Listo!")}
        </GameProvider>
      )}
    </SafeAreaProvider>
  );
}
