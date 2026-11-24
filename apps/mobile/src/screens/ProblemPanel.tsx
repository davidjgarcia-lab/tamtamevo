import { PROBLEMS, type ProblemId } from "@tamtam/core";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { brand, colors, fonts } from "../theme";
import { Btn } from "../ui/kit";
import { NO_SELECT } from "./GymPanel";

const INGREDIENTS = [
  { id: "ember", color: "#FF8A00", label: "Ascua" },
  { id: "dew", color: "#00D4FF", label: "Rocío" },
  { id: "leaf", color: "#4FD8B4", label: "Hoja" },
  { id: "honey", color: "#FFD166", label: "Miel" },
  { id: "moon", color: "#B983FF", label: "Polvo lunar" },
];

/** Short tactile challenge that solves a Tamtam problem. Calls onSolved(quality 0–1). */
export function ProblemPanel({ id, minutesLeft, onSolved, onClose }: { id: ProblemId; minutesLeft: number; onSolved: (q: number) => void; onClose: () => void }) {
  const p = PROBLEMS[id];
  const [progress, setProgress] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const start = useRef(Date.now());
  const g = useRef({ x: 0, y: 0, sx: 0, sy: 0, dist: 0, dirX: 0, turns: 0 });
  // Potion recipe.
  const [recipe] = useState(() => [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5).slice(0, 3));
  const [showRecipe, setShowRecipe] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => {
    if (id !== "cold") return;
    const tm = setTimeout(() => setShowRecipe(false), 2600);
    return () => clearTimeout(tm);
  }, [id]);

  const done = useRef(false);
  const finish = (extra = 0) => {
    if (done.current) return;
    done.current = true;
    const secs = (Date.now() - start.current) / 1000;
    const q = Math.max(0.3, Math.min(1, 1.15 - secs / 30 - (mistakes + extra) * 0.15));
    setTimeout(() => onSolved(q), 350);
  };
  const bump = (v: number) => {
    setProgress((old) => {
      const n = Math.min(1, old + v);
      if (n >= 1) finish();
      return n;
    });
  };

  const grant = (e: GestureResponderEvent) => {
    const { pageX: x, pageY: y } = e.nativeEvent;
    Object.assign(g.current, { x, y, sx: x, sy: y, dist: 0, dirX: 0, turns: 0 });
  };
  const moveH = (e: GestureResponderEvent) => {
    const { pageX: x, pageY: y } = e.nativeEvent;
    const dx = x - g.current.x, dy = y - g.current.y;
    const d = Math.hypot(dx, dy);
    g.current.x = x;
    g.current.y = y;
    if (id === "thorn") setProgress(Math.min(1, Math.max(0, (g.current.sy - y) / 140)));
    if (id === "ash") bump(d / 900);
    if (id === "tangle") {
      const sgn = Math.sign(dx);
      if (Math.abs(dx) > 2 && sgn !== 0 && sgn !== g.current.dirX) {
        if (g.current.dirX !== 0) bump(1 / 9);
        g.current.dirX = sgn;
      }
    }
  };
  const release = () => {
    if (id === "thorn") {
      if (progress >= 0.98) finish();
      else {
        setProgress(0);
        setMistakes((m) => m + 1);
      }
    }
  };

  const pick = (i: number) => {
    if (showRecipe || done.current) return;
    const next = [...picked, i];
    if (recipe[next.length - 1] !== i) {
      setMistakes((m) => m + 1);
      setPicked([]);
      return;
    }
    setPicked(next);
    setProgress(next.length / 3);
    if (next.length === 3) finish();
  };

  return (
    <View style={s.root}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>Problema · quedan {minutesLeft} min</Text>
          <Text style={s.title}>{p.name}</Text>
        </View>
        <Btn small label="Luego" onPress={onClose} testID="problem-later" />
      </View>
      <Text style={s.hint}>{p.hint}</Text>
      {id === "cold" ? (
        <View style={{ gap: 10 }}>
          <View style={s.recipe}>
            {recipe.map((r, k) => (
              <View key={k} style={[s.slot, { backgroundColor: showRecipe || picked.length > k ? INGREDIENTS[r]!.color : brand.core }]} />
            ))}
          </View>
          <View style={s.row}>
            {INGREDIENTS.map((ing, i) => (
              <Pressable key={ing.id} onPress={() => pick(i)} style={({ pressed }) => [s.ing, NO_SELECT, { borderColor: ing.color }, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={ing.label} testID={`ing-${i}`}>
                <View style={[s.dot, { backgroundColor: ing.color }]} />
                <Text style={s.ingText}>{ing.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View
          style={[s.pad, NO_SELECT]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={grant}
          onResponderMove={moveH}
          onResponderRelease={release}
          testID="problem-pad"
        >
          {id === "thorn" && (
            <>
              <View style={[s.paw]} />
              <View style={[s.thorn, { transform: [{ translateY: -progress * 120 }] }]} />
              <Text style={s.padText}>↑ tira hacia arriba sin soltar</Text>
            </>
          )}
          {id === "ash" && (
            <>
              <View style={[s.crest, { opacity: 0.35 + 0.65 * progress }]} />
              {Array.from({ length: 14 }, (_, i) => (
                <View key={i} style={[s.ashDot, { left: `${10 + ((i * 37) % 80)}%`, top: `${15 + ((i * 53) % 60)}%`, opacity: 1 - progress }]} />
              ))}
              <Text style={s.padText}>frota la cresta</Text>
            </>
          )}
          {id === "tangle" && (
            <>
              <View style={[s.vine, { opacity: 1 - progress * 0.8, transform: [{ rotate: `${progress * 40}deg` }] }]} />
              <Text style={s.padText}>⟷ desliza de lado a lado</Text>
            </>
          )}
        </View>
      )}
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: brand.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 14, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 12, color: brand.pink },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: brand.cloud, lineHeight: 28 },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  pad: { height: 150, borderRadius: 18, backgroundColor: brand.core, borderWidth: 1.5, borderColor: brand.line, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  padText: { position: "absolute", bottom: 8, fontFamily: fonts.bodyBold, fontSize: 12, color: brand.textDim },
  paw: { position: "absolute", bottom: 26, width: 110, height: 60, borderRadius: 30, backgroundColor: "#7D2430", borderWidth: 2, borderColor: "#2A1A3E" },
  thorn: { position: "absolute", bottom: 60, width: 10, height: 46, borderRadius: 4, backgroundColor: "#4E7A30", borderWidth: 2, borderColor: "#2A1A3E" },
  crest: { width: 120, height: 80, borderRadius: 40, backgroundColor: "#FF8A00" },
  ashDot: { position: "absolute", width: 14, height: 10, borderRadius: 6, backgroundColor: "#4A4558" },
  vine: { width: 160, height: 26, borderRadius: 13, backgroundColor: "#4E7A30", borderWidth: 2, borderColor: "#2A1A3E" },
  recipe: { flexDirection: "row", gap: 8, justifyContent: "center" },
  slot: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: brand.line },
  row: { flexDirection: "row", gap: 6, justifyContent: "center", flexWrap: "wrap" },
  ing: { width: 64, paddingVertical: 8, borderRadius: 14, borderWidth: 2, backgroundColor: brand.panelHi, alignItems: "center", gap: 4 },
  dot: { width: 26, height: 26, borderRadius: 13 },
  ingText: { fontFamily: fonts.bodyBold, fontSize: 10, color: brand.cloud },
  track: { height: 10, borderRadius: 5, backgroundColor: brand.core, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5, backgroundColor: brand.mint },
});
