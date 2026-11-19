import { Fredoka_600SemiBold } from "@expo-google-fonts/fredoka/600SemiBold";
import { Fredoka_700Bold } from "@expo-google-fonts/fredoka/700Bold";
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito/600SemiBold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RigLabScreen } from "./src/screens/RigLabScreen";
import { colors } from "./src/theme";

export default function App() {
  const [loaded] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Nunito_600SemiBold, Nunito_800ExtraBold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RigLabScreen />
    </SafeAreaProvider>
  );
}
