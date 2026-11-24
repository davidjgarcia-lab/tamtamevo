import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { DPad, GameFrame, useSwipe } from "./common";

const COLS = 9;
const ROWS = 11;
const LEVELS = 3;

/** Maze generated with a randomised depth-first search. walls[c] bitmask: 1 N, 2 E, 4 S, 8 W. */
function makeMaze(): number[] {
  const w = Array(COLS * ROWS).fill(15);
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const c = stack[stack.length - 1]!;
    const x = c % COLS, y = Math.floor(c / COLS);
    const opts = ([[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]] as const).filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !seen.has(ny * COLS + nx);
    });
    if (!opts.length) { stack.pop(); continue; }
    const [dx, dy, a, b] = opts[Math.floor(Math.random() * opts.length)]!;
    const n = (y + dy) * COLS + x + dx;
    w[c] &= ~a;
    w[n] &= ~b;
    seen.add(n);
    stack.push(n);
  }
  return w;
}

export function MazeGame({ onExit }: { onExit: () => void }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [maze, setMaze] = useState(makeMaze);
  const [pos, setPos] = useState(0);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [trail, setTrail] = useState<number[]>([0]);
  const newKeys = () => { const k = new Set<number>(); while (k.size < 2) k.add(5 + Math.floor(Math.random() * (COLS * ROWS - 10))); return k; };
  const [keys, setKeys] = useState<Set<number>>(newKeys);
  const runStart = useRef(Date.now());
  const started = useRef(Date.now());
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);
  const goal = COLS * ROWS - 1;

  const reset = () => {
    setMaze(makeMaze()); setPos(0); setLevel(0); setScore(0); setOver(false); setTrail([0]); setKeys(newKeys()); started.current = Date.now(); runStart.current = Date.now();
  };
  const step = (dx: number, dy: number) => {
    if (over) return;
    const bit = dx === 1 ? 2 : dx === -1 ? 8 : dy === 1 ? 4 : 1;
    if (maze[pos]! & bit) return;
    const next = pos + dx + dy * COLS;
    setPos(next);
    setTrail((t) => [...t, next]);
    if (keys.has(next)) {
      const k = new Set(keys); k.delete(next); setKeys(k);
      setScore((s0) => s0 + 50);
    }
    if (next === goal) {
      const secs = (Date.now() - started.current) / 1000;
      const gained = Math.max(60, Math.round(260 - secs * 5)) + (keys.size === 0 ? 40 : 0);
      setScore((s) => s + gained);
      if (level + 1 >= LEVELS) setOver(true);
      else {
        setLevel(level + 1); setMaze(makeMaze()); setPos(0); setTrail([0]); setKeys(newKeys()); started.current = Date.now();
      }
    }
  };
  const swipe = useSwipe(step);

  const cell = Math.min(size.w / COLS, size.h / ROWS);
  const ox = (size.w - cell * COLS) / 2, oy = (size.h - cell * ROWS) / 2;
  const pic = useMemo(() => createPicture((c) => {
    if (!cell) return;
    const wall = Skia.Paint();
    wall.setAntiAlias(true);
    wall.setStyle(1);
    wall.setStrokeCap(1);
    wall.setStrokeWidth(Math.max(3, cell * 0.12));
    wall.setColor(Skia.Color("#8B42F6"));
    const tr = Skia.Paint();
    tr.setColor(Skia.Color("#00D4FF"));
    tr.setAlphaf(0.18);
    for (const t of trail) c.drawRect(Skia.XYWHRect(ox + (t % COLS) * cell, oy + Math.floor(t / COLS) * cell, cell, cell), tr);
    const gp = Skia.Paint();
    gp.setColor(Skia.Color("#FFD166"));
    gp.setMaskFilter(Skia.MaskFilter.MakeBlur(1, cell * 0.12, true));
    c.drawCircle(ox + (COLS - 0.5) * cell, oy + (ROWS - 0.5) * cell, cell * 0.3, gp);
    for (let i = 0; i < maze.length; i++) {
      const x = ox + (i % COLS) * cell, y = oy + Math.floor(i / COLS) * cell, m = maze[i]!;
      if (m & 1) c.drawLine(x, y, x + cell, y, wall);
      if (m & 2) c.drawLine(x + cell, y, x + cell, y + cell, wall);
      if (m & 4) c.drawLine(x, y + cell, x + cell, y + cell, wall);
      if (m & 8) c.drawLine(x, y, x, y + cell, wall);
    }
    const kp = Skia.Paint(); kp.setAntiAlias(true); kp.setColor(Skia.Color("#FFD166"));
    for (const k of keys) {
      const kx = ox + (k % COLS + 0.5) * cell, ky = oy + (Math.floor(k / COLS) + 0.5) * cell;
      c.drawCircle(kx - cell * 0.1, ky, cell * 0.14, kp);
      c.drawRect(Skia.XYWHRect(kx, ky - cell * 0.04, cell * 0.24, cell * 0.08), kp);
    }
    const pp = Skia.Paint();
    pp.setAntiAlias(true);
    pp.setColor(Skia.Color("#FF8A00"));
    const px = ox + (pos % COLS + 0.5) * cell, py = oy + (Math.floor(pos / COLS) + 0.5) * cell;
    c.drawCircle(px, py, cell * 0.32, pp);
    pp.setColor(Skia.Color("#FFF8EC"));
    c.drawCircle(px + cell * 0.1, py - cell * 0.06, cell * 0.08, pp);
    if (level === 2) {
      // Fog in the last maze: you only see around your Tamtam.
      const fog = Skia.Paint();
      fog.setShader(Skia.Shader.MakeRadialGradient({ x: px, y: py }, cell * 3.2, [Skia.Color("#17132B00"), Skia.Color("#17132BF2")], [0.45, 1], 0));
      c.drawRect(Skia.XYWHRect(0, 0, size.w, size.h), fog);
    }
  }, Skia.XYWHRect(0, 0, Math.max(1, size.w), Math.max(1, size.h))), [maze, pos, trail, cell, ox, oy, size, keys, level]);

  const elapsed = Math.floor((Date.now() - started.current) / 1000);
  return (
    <GameFrame id="maze" score={score} over={over} metrics={{ seconds: (Date.now() - runStart.current) / 1000 }} cheer={keys.size === 0 ? "happy" : null} onExit={onExit} onReplay={reset} extra={<DPad onDir={step} />}>
      <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} {...swipe}>
        <Canvas style={{ flex: 1 }} pointerEvents="none">
          <Picture picture={pic} />
        </Canvas>
        <View style={{ position: "absolute", top: 6, left: 8, flexDirection: "row", gap: 4 }} pointerEvents="none" accessibilityLabel={`Laberinto ${level + 1} de ${LEVELS}, ${elapsed} segundos`}>
          {Array.from({ length: LEVELS }, (_, i) => (
            <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i < level ? "#4FD8B4" : i === level ? "#FFD166" : "#4A4176" }} />
          ))}
        </View>
      </View>
    </GameFrame>
  );
}
