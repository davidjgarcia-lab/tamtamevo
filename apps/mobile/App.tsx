import { Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2/800ExtraBold";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GameProvider, useGame } from "./src/game/GameProvider";
import { EggScreen, NamingScreen } from "./src/screens/BirthScreens";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoadingScreen } from "./src/screens/LoadingScreen";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Minimum time the branded loading screen stays visible (a short brand moment, not a wait). */
const MIN_LOADING_MS = 1600;

function Router() {
  const { state } = useGame();
  if (state.phase === "egg") return <EggScreen />;
  if (state.phase === "naming") return <NamingScreen />;
  return <HomeScreen />;
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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!fontsLoaded ? (
        loading(0.35, "Despertando el archipiélago…")
      ) : (
        <GameProvider fallback={loading(0.75, "Buscando tu partida…")}>
          {minElapsed ? <Router /> : loading(1, "¡Listo!")}
        </GameProvider>
      )}
    </SafeAreaProvider>
  );
}
