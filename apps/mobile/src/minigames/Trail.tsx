import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { DPad, GameFrame, useSwipe } from "./common";

const N = 15;
type P = { x: number; y: number };
interface World { me: P[]; dir: P; nextDir: P; ai: P[]; aiDir: P; aiDead: number; food: P; score: number; over: boolean }

const eq = (a: P, b: P) => a.x === b.x && a.y === b.y;
const free = (w: World, p: P) => p.x >= 0 && p.y >= 0 && p.x < N && p.y < N && !w.me.some((q) => eq(q, p)) && !w.ai.some((q) => eq(q, p));

function spawnFood(w: World): P {
  for (let k = 0; k < 200; k++) {
    const p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
    if (free(w, p)) return p;
  }
  return { x: 0, y: 0 };
}

function fresh(): World {
  const w: World = {
    me: [{ x: 3, y: 7 }, { x: 2, y: 7 }, { x: 1, y: 7 }], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    ai: [{ x: 11, y: 3 }, { x: 12, y: 3 }, { x: 13, y: 3 }], aiDir: { x: -1, y: 0 }, aiDead: 0, food: { x: 7, y: 7 }, score: 0, over: false,
  };
  w.food = spawnFood(w);
  return w;
}

/** Ember trail: guide your trail to the embers; a rival trail (simple AI) competes for them. */
export function TrailGame({ onExit }: { onExit: () => void }) {
  const world = useRef<World>(fresh());
  const [, setTick] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      const w = world.current;
      if (w.over) return;
      // Player.
      w.dir = w.nextDir;
      const head = { x: w.me[0]!.x + w.dir.x, y: w.me[0]!.y + w.dir.y };
      const tailFree = w.me.slice(0, -1);
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || tailFree.some((q) => eq(q, head)) || w.ai.some((q) => eq(q, head))) {
        w.over = true;
        setTick((n) => n + 1);
        return;
      }
      w.me.unshift(head);
      if (eq(head, w.food)) {
        w.score += 20;
        w.food = spawnFood(w);
      } else w.me.pop();
      // Rival AI: greedy toward the ember, avoiding walls and bodies.
      if (w.ai.length) {
        const h = w.ai[0]!;
        const opts = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
          .filter((d) => !(d.x === -w.aiDir.x && d.y === -w.aiDir.y))
          .map((d) => ({ d, p: { x: h.x + d.x, y: h.y + d.y } }))
          .filter(({ p }) => free(w, p) || eq(p, w.ai[w.ai.length - 1]!))
          .sort((a, b) => Math.abs(a.p.x - w.food.x) + Math.abs(a.p.y - w.food.y) - (Math.abs(b.p.x - w.food.x) + Math.abs(b.p.y - w.food.y)) + (Math.random() - 0.5) * 0.8);
        if (!opts.length) {
          w.ai = [];
          w.aiDead = 12;
        } else {
          const { d, p } = opts[0]!;
          w.aiDir = d;
          w.ai.unshift(p);
          if (eq(p, w.food)) w.food = spawnFood(w);
          else w.ai.pop();
        }
      } else if (--w.aiDead <= 0) {
        const start = { x: N - 2, y: 1 };
        if (free(w, start)) {
          w.ai = [start];
          w.aiDir = { x: -1, y: 0 };
        }
      }
      setTick((n) => n + 1);
    }, 170);
    return () => clearInterval(id);
  }, []);

  const steer = (dx: number, dy: number) => {
    const w = world.current;
    if (dx === -w.dir.x && dy === -w.dir.y) return;
    w.nextDir = { x: dx, y: dy };
  };
  const swipe = useSwipe(steer);
  const w = world.current;
  const cell = Math.min(size.w, size.h) / N;
  const ox = (size.w - cell * N) / 2, oy = (size.h - cell * N) / 2;
  const pic = createPicture((c) => {
    if (!cell) return;
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color("#241D45"));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) % 2) c.drawRect(Skia.XYWHRect(ox + x * cell, oy + y * cell, cell, cell), p);
    const glow = Skia.Paint();
    glow.setColor(Skia.Color("#FFB347"));
    glow.setMaskFilter(Skia.MaskFilter.MakeBlur(1, cell * 0.3, true));
    c.drawCircle(ox + (w.food.x + 0.5) * cell, oy + (w.food.y + 0.5) * cell, cell * 0.45, glow);
    p.setColor(Skia.Color("#FFF1C2"));
    c.drawCircle(ox + (w.food.x + 0.5) * cell, oy + (w.food.y + 0.5) * cell, cell * 0.22, p);
    const body = (arr: P[], col: string, headCol: string) => {
      arr.forEach((q, i) => {
        p.setColor(Skia.Color(i === 0 ? headCol : col));
        p.setAlphaf(i === 0 ? 1 : 0.95 - (i / arr.length) * 0.4);
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(ox + q.x * cell + 1.5, oy + q.y * cell + 1.5, cell - 3, cell - 3), cell * 0.3, cell * 0.3), p);
      });
      p.setAlphaf(1);
    };
    body(w.ai, "#FF8A00", "#FFD166");
    body(w.me, "#00D4FF", "#F5F3FF");
  }, Skia.XYWHRect(0, 0, Math.max(1, size.w), Math.max(1, size.h)));

  return (
    <GameFrame id="trail" score={w.score} over={w.over} onExit={onExit} onReplay={() => { world.current = fresh(); setTick((n) => n + 1); }} extra={<DPad onDir={steer} />}>
      <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} {...swipe}>
        <Canvas style={{ flex: 1 }} pointerEvents="none">
          <Picture picture={pic} />
        </Canvas>
      </View>
    </GameFrame>
  );
}
