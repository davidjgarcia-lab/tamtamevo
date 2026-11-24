import { completeMinigame, MEDAL_NAMES, MINIGAMES, peekPlay, type MinigameId, type MinigameResult, type Metrics } from "@tamtam/core";
import { Portrait } from "../creature/Portrait";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { newId, useGame } from "../game/GameProvider";
import { NO_SELECT } from "../screens/GymPanel";
import { brand, colors, fonts } from "../theme";
import { Btn, Coin } from "../ui/kit";
import { Icon, type ICONS } from "../ui/icons";

/** Shared frame for every minigame: icon header (no names, D9), score, exit and the result card. */
export function GameFrame({ id, score, children, onExit, over, onReplay, extra, metrics, cheer }: {
  id: MinigameId; score: number; children: ReactNode; onExit: () => void; over: boolean; onReplay: () => void; extra?: ReactNode;
  metrics?: Metrics; cheer?: "happy" | "worried" | null;
}) {
  const { state, act, now, tzOffsetMin } = useGame();
  const [res, setRes] = useState<MinigameResult | null>(null);
  const runId = useRef(newId());
  useEffect(() => {
    // Record once per run (the rule is idempotent by runId as well).
    if (over && !res) setRes(act((s) => completeMinigame(s, { game: id, runId: runId.current, score, now: now(), tzOffsetMin, metrics })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);
  const best = state.records[id]?.best ?? 0;
  return (
    <View style={g.root}>
      <View style={g.head}>
        <Pressable onPress={onExit} style={g.round} accessibilityRole="button" accessibilityLabel="Salir del minijuego" testID="game-exit">
          <Icon name="back" size={22} />
        </Pressable>
        <View style={g.badge}>
          <Icon name={id as keyof typeof ICONS} size={30} accent={brand.cyan} />
        </View>
        <View style={{ flex: 1, alignItems: "center" }}>
          {state.tamtam && (
            <View style={g.mini} accessibilityLabel="Tu Tamtam te anima">
              <Portrait alleleId={state.alleleId} genome={state.tamtam.genome} size={56} clip={over ? (res && res.stars >= 2 ? "celebrate" : "sad") : cheer === "happy" ? "celebrate" : cheer === "worried" ? "hungry" : "idle"} />
            </View>
          )}
        </View>
        <View style={g.scoreBox} accessibilityLabel={`Puntos ${score}`}>
          <Icon name="trophy" size={18} color={brand.gold} accent={brand.gold} />
          <Text style={g.score}>{score}</Text>
          <Text style={g.best}>/ {Math.max(best, score)}</Text>
        </View>
      </View>
      <View style={[g.board, NO_SELECT]}>{children}</View>
      {extra}
      {over && (
        <View style={g.over}>
          <View style={g.card}>
            <Icon name={id as keyof typeof ICONS} size={56} accent={brand.cyan} />
            <Text style={g.big}>{score}</Text>
            {res && (
              <Text style={g.stars} accessibilityLabel={`${res.stars} estrellas`}>
                {"★".repeat(res.stars)}
                <Text style={g.starsOff}>{"★".repeat(3 - res.stars)}</Text>
              </Text>
            )}
            {res?.praise.map((p) => (
              <Text key={p} style={g.record}>{p}</Text>
            ))}
            {res && (
              <View style={g.row}>
                <Coin />
                <Text style={g.reward}>+{res.coins}</Text>
              </View>
            )}
            {res && <Text style={g.small}>Felicidad +{8 + 4 * res.stars} · Actividad +{12 + 4 * res.stars} · Medalla: {MEDAL_NAMES[res.medal]}</Text>}
            {res && (
              <Text style={g.streak}>
                Racha de juego: {res.streak} día{res.streak === 1 ? "" : "s"} · protecciones {peekPlay(state).streak.protections}
                {res.usedProtection ? " (¡protección usada!)" : ""}
              </Text>
            )}
            {res?.streakReward && <Text style={g.record}>Premio de racha: {res.streakReward}</Text>}
            {res?.album && <Text style={g.album}>Pieza {res.album.piece}/4 del álbum de paisajes{res.album.completed ? " · ¡cuadro completo para tu casa!" : ""}</Text>}
            <View style={g.row}>
              <Pressable onPress={() => { runId.current = newId(); setRes(null); onReplay(); }} style={g.round} accessibilityRole="button" accessibilityLabel="Jugar otra vez" testID="game-replay">
                <Icon name="replay" size={24} />
              </Pressable>
              <Btn label="Volver" tone="coral" onPress={onExit} testID="game-done" />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/** Direction pad (icons) for grid games. */
export function DPad({ onDir }: { onDir: (dx: number, dy: number) => void }) {
  const b = (icon: keyof typeof ICONS, dx: number, dy: number, label: string) => (
    <Pressable onPressIn={() => onDir(dx, dy)} style={({ pressed }) => [g.pad, NO_SELECT, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={label} testID={`pad-${label}`}>
      <Icon name={icon} size={28} />
    </Pressable>
  );
  return (
    <View style={g.dpad}>
      {b("left", -1, 0, "izquierda")}
      <View style={{ gap: 8 }}>
        {b("up", 0, -1, "arriba")}
        {b("down", 0, 1, "abajo")}
      </View>
      {b("right", 1, 0, "derecha")}
    </View>
  );
}

/** Swipe detection helper (returns a responder props object). */
export function useSwipe(onDir: (dx: number, dy: number) => void) {
  const start = useRef({ x: 0, y: 0 });
  return {
    onStartShouldSetResponder: () => true,
    onResponderGrant: (e: GestureResponderEvent) => {
      start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    },
    onResponderRelease: (e: GestureResponderEvent) => {
      const dx = e.nativeEvent.pageX - start.current.x;
      const dy = e.nativeEvent.pageY - start.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) onDir(Math.sign(dx), 0);
      else onDir(0, Math.sign(dy));
    },
  };
}

export const MAX_SCORE = (id: MinigameId) => MINIGAMES[id].scoreForMax;

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.core },
  head: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: brand.panelHi, borderWidth: 1.5, borderColor: brand.line, alignItems: "center", justifyContent: "center" },
  badge: { width: 52, height: 52, borderRadius: 16, backgroundColor: brand.violet, alignItems: "center", justifyContent: "center" },
  scoreBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: brand.panel, borderRadius: 999, paddingHorizontal: 14, height: 44 },
  score: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink, fontVariant: ["tabular-nums"] },
  best: { fontFamily: fonts.bodyBold, fontSize: 12, color: brand.textDim },
  board: { flex: 1, margin: 10, borderRadius: 22, overflow: "hidden", backgroundColor: brand.panel },
  over: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,7,24,0.7)", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: brand.panel, borderRadius: 24, padding: 22, alignItems: "center", gap: 8, minWidth: 260, maxWidth: 350, borderWidth: 1.5, borderColor: brand.line },
  big: { fontFamily: fonts.displayBold, fontSize: 52, color: brand.gold, lineHeight: 60 },
  record: { fontFamily: fonts.displayBold, fontSize: 18, color: brand.cyan },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  reward: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  mini: { width: 56, height: 56, borderRadius: 28, backgroundColor: brand.panel, overflow: "hidden" },
  stars: { fontSize: 34, color: brand.gold, letterSpacing: 4 },
  starsOff: { color: brand.line },
  streak: { fontFamily: fonts.bodyBold, fontSize: 12, color: brand.orange, textAlign: "center" },
  album: { fontFamily: fonts.bodyBold, fontSize: 12, color: brand.mint, textAlign: "center" },
  small: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  dpad: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingBottom: 12 },
  pad: { width: 64, height: 56, borderRadius: 16, backgroundColor: brand.panelHi, borderWidth: 1.5, borderBottomWidth: 4, borderColor: brand.line, alignItems: "center", justifyContent: "center" },
});
