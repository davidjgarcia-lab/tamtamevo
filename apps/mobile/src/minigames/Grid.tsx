import { Skia } from "@shopify/react-native-skia";
import { generateRegions, isFirstPlayToday, type RegionPuzzle } from "@tamtam/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useGame } from "../game/GameProvider";
import { NO_SELECT } from "../screens/GymPanel";
import { brand, fonts } from "../theme";
import { Btn } from "../ui/kit";
import { Snapshot } from "../ui/snapshot";
import { GameFrame } from "./common";

const REGION_COLORS = ["#FF8A5B", "#4FD8B4", "#7C9BFF", "#FFD166", "#C58BFF", "#5BD1FF", "#FF7FB6", "#9BE15D"];

/** Tamtam token: a little flame with an eye (drawn once to an image). */
function Token({ size }: { size: number }) {
  return (
    <Snapshot
      id="grid-token"
      w={size}
      h={size}
      draw={(c) => {
        const k = size / 40;
        c.scale(k, k);
        const p = Skia.Paint();
        p.setAntiAlias(true);
        p.setColor(Skia.Color("#7D2430"));
        c.drawPath(Skia.Path.MakeFromSVGString("M20 4 C28 12 34 18 34 26 C34 33 28 38 20 38 C12 38 6 33 6 26 C6 18 12 12 20 4 Z")!, p);
        p.setColor(Skia.Color("#FF8A00"));
        c.drawPath(Skia.Path.MakeFromSVGString("M20 4 C24 10 26 14 24 18 C22 14 18 12 20 4 Z M14 10 C16 14 16 18 14 20 C12 17 12 13 14 10 Z")!, p);
        p.setColor(Skia.Color("#FFF8EC"));
        c.drawOval(Skia.XYWHRect(18, 22, 10, 7), p);
        p.setColor(Skia.Color("#1A0C10"));
        c.drawOval(Skia.XYWHRect(22, 22.5, 2.4, 6), p);
      }}
    />
  );
}

type Mark = 0 | 1 | 2; // empty, ✕, Tamtam

export function GridGame({ onExit }: { onExit: () => void }) {
  const { state, now } = useGame();
  const plays = state.records.grid?.plays ?? 0;
  const first = isFirstPlayToday(state, "grid", now());
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const n = first ? 5 : Math.min(8, 5 + Math.floor(plays / 2));
  const puzzle: RegionPuzzle = useMemo(() => generateRegions(n, seed), [n, seed]);
  const [marks, setMarks] = useState<Mark[]>(() => new Array(n * n).fill(0));
  const [lives, setLives] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const start = useRef(Date.now());
  const { width } = useWindowDimensions();
  const cell = Math.floor(Math.min(width - 40, 420) / n);

  useEffect(() => {
    setMarks(new Array(n * n).fill(0));
  }, [n, seed]);

  const placed = marks.filter((m) => m === 2).length;
  const finish = (won: boolean, mk: number) => {
    const secs = (Date.now() - start.current) / 1000;
    const base = won ? Math.max(200, 1000 - secs * 5 - mk * 120) : placed * 60;
    setScore(Math.round(base * (0.8 + n * 0.05)));
    setOver(true);
  };
  const tap = (i: number) => {
    if (over) return;
    const cur = marks[i]!;
    const next: Mark = cur === 0 ? 1 : cur === 1 ? 2 : 0;
    if (next === 2) {
      const row = Math.floor(i / n), col = i % n;
      if (puzzle.solution[row] !== col) {
        // Misplaced: the Tamtam jumps off and you lose a life (references: lives + misplace reaction).
        setWrong(i);
        setTimeout(() => setWrong(null), 600);
        const l = lives - 1;
        const mk = mistakes + 1;
        setLives(l);
        setMistakes(mk);
        setMarks((m) => m.map((v, j) => (j === i ? 1 : v)));
        if (l <= 0) finish(false, mk);
        return;
      }
    }
    commit(i, next);
  };
  const commit = (i: number, next: Mark) => {
    const nm = marks.map((v, j) => (j === i ? next : v));
    // Auto-mark the row/column/region/neighbours of a correct Tamtam with ✕ (comfort feature).
    if (next === 2) {
      const row = Math.floor(i / n), col = i % n;
      for (let j = 0; j < n * n; j++) {
        if (j === i || nm[j] !== 0) continue;
        const r2 = Math.floor(j / n), c2 = j % n;
        if (r2 === row || c2 === col || puzzle.regions[j] === puzzle.regions[i] || (Math.abs(r2 - row) <= 1 && Math.abs(c2 - col) <= 1)) nm[j] = 1;
      }
    }
    setMarks(nm);
    if (nm.filter((m) => m === 2).length === n) finish(true, mistakes);
  };
  const hint = () => {
    if (hintUsed || over) return;
    const row = puzzle.solution.findIndex((c, r) => marks[r * n + c] !== 2);
    if (row < 0) return;
    setHintUsed(true);
    commit(row * n + puzzle.solution[row]!, 2);
  };
  const reset = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setLives(3); setMistakes(0); setHintUsed(false); setOver(false); setScore(0); start.current = Date.now();
  };

  return (
    <GameFrame id="grid" score={score} over={over} onExit={onExit} onReplay={reset} metrics={{ mistakes, seconds: (Date.now() - start.current) / 1000 }} cheer={lives === 1 ? "worried" : placed >= n - 1 ? "happy" : null}>
      <View style={s.wrap}>
        <Text style={s.rule}>Un Tamtam por fila, columna y color. Sin tocarse, ni en diagonal.</Text>
        <View style={s.bar}>
          <Text style={s.lives}>{"♥".repeat(lives)}<Text style={{ color: brand.line }}>{"♥".repeat(3 - lives)}</Text></Text>
          <Text style={s.count}>{placed}/{n}</Text>
          <Btn small label={hintUsed ? "Pista usada" : "Pista"} disabled={hintUsed} onPress={hint} testID="grid-hint" />
        </View>
        <View style={{ width: cell * n + 4, flexDirection: "row", flexWrap: "wrap", borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: brand.core }}>
          {marks.map((m, i) => {
            const r = Math.floor(i / n), c = i % n;
            const reg = puzzle.regions[i]!;
            const bR = c < n - 1 && puzzle.regions[i + 1] !== reg ? 3 : 0.5;
            const bB = r < n - 1 && puzzle.regions[i + n] !== reg ? 3 : 0.5;
            return (
              <Pressable
                key={i}
                onPress={() => tap(i)}
                style={[{ width: cell, height: cell, backgroundColor: REGION_COLORS[reg % REGION_COLORS.length], borderRightWidth: bR, borderBottomWidth: bB, borderColor: "#2A1A3E", alignItems: "center", justifyContent: "center" }, NO_SELECT, wrong === i && { backgroundColor: brand.pink }]}
                accessibilityRole="button"
                accessibilityLabel={`Fila ${r + 1}, columna ${c + 1}${m === 2 ? ", Tamtam" : m === 1 ? ", marcada" : ""}`}
                testID={`cell-${i}`}
              >
                {m === 1 && <Text style={s.x}>✕</Text>}
                {m === 2 && <Token size={cell * 0.78} />}
              </Pressable>
            );
          })}
        </View>
        <Text style={s.help}>Toca una vez para marcar ✕, dos veces para poner un Tamtam.</Text>
      </View>
    </GameFrame>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 8 },
  rule: { fontFamily: fonts.bodyBold, fontSize: 13, color: brand.cloud, textAlign: "center" },
  bar: { flexDirection: "row", alignItems: "center", gap: 14 },
  lives: { fontSize: 22, color: brand.pink },
  count: { fontFamily: fonts.displayBold, fontSize: 18, color: brand.cloud },
  x: { fontFamily: fonts.bodyBold, fontSize: 16, color: "rgba(42,26,62,0.55)" },
  help: { fontFamily: fonts.body, fontSize: 12, color: brand.textDim },
});
