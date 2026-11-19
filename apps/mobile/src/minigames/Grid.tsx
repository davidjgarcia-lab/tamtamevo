import { PaintStyle, Skia } from "@shopify/react-native-skia";
import { Snapshot } from "../ui/snapshot";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { NO_SELECT } from "../screens/GymPanel";
import { brand } from "../theme";
import { GameFrame } from "./common";

/** Four elemental emblems instead of numbers. */
const EMBLEMS: { d: string; color: string }[] = [
  { d: "M12 3 C16 8 18 11 18 14.5 C18 18 15.5 21 12 21 C8.5 21 6 18 6 14.5 C6 11.5 8 9.5 9.5 8 C9.5 10.5 10.5 12 12 12 C11 9 11 6 12 3 Z", color: "#FF8A00" },
  { d: "M12 3 C15 8 18 11.5 18 15 C18 18.5 15.3 21 12 21 C8.7 21 6 18.5 6 15 C6 11.5 9 8 12 3 Z", color: "#00D4FF" },
  { d: "M5 19 C5 10 10 5 20 4 C19 14 14 19 5 19 Z M5 19 L13 11", color: "#4FD8B4" },
  { d: "M12 3 L14.6 9 L21 9.6 L16.2 13.8 L17.6 20.2 L12 16.9 L6.4 20.2 L7.8 13.8 L3 9.6 L9.4 9 Z", color: "#FFD166" },
];

function makePuzzle() {
  // Valid 4×4 Latin square with 2×2 boxes, then shuffle symbols, rows within bands and columns within stacks.
  const base = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
  const sym = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
  const sw = () => (Math.random() < 0.5 ? [0, 1] : [1, 0]);
  const [r0, r1] = [sw(), sw()];
  const rows = Math.random() < 0.5 ? [r0[0]!, r0[1]!, 2 + r1[0]!, 2 + r1[1]!] : [2 + r1[0]!, 2 + r1[1]!, r0[0]!, r0[1]!];
  const [c0, c1] = [sw(), sw()];
  const cols = [c0[0]!, c0[1]!, 2 + c1[0]!, 2 + c1[1]!];
  const sol = rows.flatMap((r) => cols.map((c) => sym[base[r]![c]!]!));
  const givens = new Set<number>();
  while (givens.size < 6) givens.add(Math.floor(Math.random() * 16));
  return { sol, givens, board: sol.map((v, i) => (givens.has(i) ? v : -1)) };
}

function conflicts(b: number[]): Set<number> {
  const bad = new Set<number>();
  const groups: number[][] = [];
  for (let i = 0; i < 4; i++) {
    groups.push([0, 1, 2, 3].map((j) => i * 4 + j), [0, 1, 2, 3].map((j) => j * 4 + i));
    const br = Math.floor(i / 2) * 2, bc = (i % 2) * 2;
    groups.push([br * 4 + bc, br * 4 + bc + 1, (br + 1) * 4 + bc, (br + 1) * 4 + bc + 1]);
  }
  for (const g of groups) {
    for (const a of g) for (const b2 of g) if (a !== b2 && b[a]! >= 0 && b[a] === b[b2]) bad.add(a);
  }
  return bad;
}

export function GridGame({ onExit }: { onExit: () => void }) {
  const [p, setP] = useState(makePuzzle);
  const [board, setBoard] = useState(p.board);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const started = useRef(Date.now());
  const bad = conflicts(board);

  useEffect(() => {
    if (!over && board.every((v) => v >= 0) && bad.size === 0) {
      const secs = (Date.now() - started.current) / 1000;
      setScore(Math.max(200, Math.round(1000 - secs * 6)));
      setOver(true);
    }
  }, [board, bad.size, over]);

  const reset = () => {
    const n = makePuzzle();
    setP(n); setBoard(n.board); setOver(false); setScore(0); started.current = Date.now();
  };
  const tap = (i: number) => {
    if (p.givens.has(i) || over) return;
    setBoard((b) => b.map((v, j) => (j === i ? (v + 2) % 5 - 1 : v)));
  };

  return (
    <GameFrame id="grid" score={score} over={over} onExit={onExit} onReplay={reset}>
      <View style={s.wrap}>
        <View style={s.grid}>
          {board.map((v, i) => {
            const r = Math.floor(i / 4), c = i % 4;
            return (
              <Pressable
                key={i}
                onPress={() => tap(i)}
                style={[s.cell, NO_SELECT, p.givens.has(i) && s.given, bad.has(i) && s.bad, { marginRight: c === 1 ? 8 : 0, marginBottom: r === 1 ? 8 : 0 }]}
                accessibilityRole="button"
                accessibilityLabel={`Casilla ${r + 1}, ${c + 1}${v >= 0 ? `, emblema ${v + 1}` : ", vacía"}`}
                testID={`cell-${i}`}
              >
                {v >= 0 && (
                  <Snapshot
                    id={`emblem:${v}`}
                    w={48}
                    h={48}
                    draw={(c) => {
                      const p = Skia.Paint();
                      p.setAntiAlias(true);
                      p.setColor(Skia.Color(EMBLEMS[v]!.color));
                      if (v === 2) {
                        p.setStyle(PaintStyle.Stroke);
                        p.setStrokeWidth(2.4);
                      }
                      c.scale(2, 2);
                      c.drawPath(Skia.Path.MakeFromSVGString(EMBLEMS[v]!.d)!, p);
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </GameFrame>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  grid: { width: 4 * 72 + 8 + 4 * 6, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { width: 72, height: 72, borderRadius: 16, backgroundColor: brand.core, borderWidth: 2, borderColor: brand.line, alignItems: "center", justifyContent: "center" },
  given: { backgroundColor: "#241D45", borderColor: brand.violet },
  bad: { borderColor: brand.pink },
});
