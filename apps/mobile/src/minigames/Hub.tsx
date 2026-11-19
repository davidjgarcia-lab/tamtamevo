import type { MinigameId } from "@tamtam/core";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../game/GameProvider";
import { NO_SELECT } from "../screens/GymPanel";
import { brand, fonts } from "../theme";
import { Icon } from "../ui/icons";
import { BricksGame } from "./Bricks";
import { GridGame } from "./Grid";
import { MazeGame } from "./Maze";
import { TrailGame } from "./Trail";

const TILES: { id: MinigameId; color: string }[] = [
  { id: "maze", color: brand.violet },
  { id: "bricks", color: brand.pink },
  { id: "grid", color: brand.blue },
  { id: "trail", color: brand.orange },
];

/** "Jugar": the four minigames, identified only by icons (decision D9). */
export function MinigameHub({ onClose }: { onClose: () => void }) {
  const { state } = useGame();
  const [game, setGame] = useState<MinigameId | null>(null);
  const exit = () => setGame(null);
  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      {game === "maze" && <MazeGame onExit={exit} />}
      {game === "bricks" && <BricksGame onExit={exit} />}
      {game === "grid" && <GridGame onExit={exit} />}
      {game === "trail" && <TrailGame onExit={exit} />}
      {!game && (
        <View style={{ flex: 1 }}>
          <View style={s.head}>
            <Pressable onPress={onClose} style={s.round} accessibilityRole="button" accessibilityLabel="Volver a casa" testID="hub-close">
              <Icon name="back" size={22} />
            </Pressable>
            <Icon name="play" size={36} accent={brand.gold} />
          </View>
          <View style={s.grid}>
            {TILES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setGame(t.id)}
                style={({ pressed }) => [s.tile, NO_SELECT, { borderColor: t.color }, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Minijuego ${TILES.indexOf(t) + 1}`}
                testID={`game-${t.id}`}
              >
                <View style={[s.iconBg, { backgroundColor: t.color }]}>
                  <Icon name={t.id} size={64} color={brand.core} accent={brand.cloud} stroke={2.2} />
                </View>
                <View style={s.best}>
                  <Icon name="trophy" size={16} color={brand.gold} accent={brand.gold} />
                  <Text style={s.bestText}>{state.records[t.id]?.best ?? 0}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <View style={s.foot}>
            <Icon name="heart" size={20} accent={brand.pink} />
            <Text style={s.footText}>{Math.round(state.care.needs.happiness)}</Text>
            <Icon name="nap" size={20} accent={brand.violet} />
            <Text style={s.footText}>{Math.round(state.care.needs.energy)}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: brand.core },
  head: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12 },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: brand.panelHi, borderWidth: 1.5, borderColor: brand.line, alignItems: "center", justifyContent: "center" },
  grid: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 14, alignContent: "center", justifyContent: "center" },
  tile: { width: "44%", aspectRatio: 0.9, borderRadius: 24, backgroundColor: brand.panel, borderWidth: 2, borderBottomWidth: 6, alignItems: "center", justifyContent: "center", gap: 10 },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 3 },
  iconBg: { width: 104, height: 104, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  best: { flexDirection: "row", alignItems: "center", gap: 4 },
  bestText: { fontFamily: fonts.bodyBold, fontSize: 14, color: brand.cloud },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 14 },
  footText: { fontFamily: fonts.bodyBold, fontSize: 14, color: brand.cloud, marginRight: 10 },
});
