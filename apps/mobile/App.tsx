import { Fredoka_600SemiBold } from "@expo-google-fonts/fredoka/600SemiBold";
import { Fredoka_700Bold } from "@expo-google-fonts/fredoka/700Bold";
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito/600SemiBold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GameProvider, useGame } from "./src/game/GameProvider";
import { EggScreen, NamingScreen } from "./src/screens/BirthScreens";
import { HomeScreen } from "./src/screens/HomeScreen";
import { colors } from "./src/theme";

function Router() {
  const { state } = useGame();
  if (state.phase === "egg") return <EggScreen />;
  if (state.phase === "naming") return <NamingScreen />;
  return <HomeScreen />;
}

export default function App() {
  const [loaded] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Nunito_600SemiBold, Nunito_800ExtraBold });
  const blank = <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  if (!loaded) return blank;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <GameProvider fallback={blank}>
        <Router />
      </GameProvider>
    </SafeAreaProvider>
  );
}
