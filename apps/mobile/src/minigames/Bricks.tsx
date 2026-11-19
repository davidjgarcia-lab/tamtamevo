import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import { useEffect, useRef, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import { GameFrame } from "./common";

const COLS = 6;
const ROWS = 5;
const COLORS = ["#FF4F9A", "#FF8A00", "#FFD166", "#4FD8B4", "#00D4FF"];

interface World { w: number; h: number; px: number; bx: number; by: number; vx: number; vy: number; bricks: boolean[]; lives: number; score: number; stuck: boolean; over: boolean }

/** Brick breaker: drag to move the paddle, tap to launch. 30 bricks × 50 points. */
export function BricksGame({ onExit }: { onExit: () => void }) {
  const world = useRef<World | null>(null);
  const [, setFrame] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const offset = useRef(0);
  type Measurable = { measure: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void };
  const ref = useRef<Measurable | null>(null);

  const reset = (w = size.w, h = size.h) => {
    world.current = { w, h, px: w / 2, bx: w / 2, by: h - 60, vx: 0, vy: 0, bricks: Array(COLS * ROWS).fill(true), lives: 3, score: 0, stuck: true, over: false };
    setFrame((f) => f + 1);
  };
  useEffect(() => {
    if (size.w) reset(size.w, size.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      const W = world.current;
      const dt = last ? Math.min(0.033, (ts - last) / 1000) : 0;
      last = ts;
      if (W && !W.over) {
        const padW = W.w * 0.24, padY = W.h - 40, r = Math.max(6, W.w * 0.018);
        if (W.stuck) {
          W.bx = W.px;
          W.by = padY - r - 2;
        } else {
          W.bx += W.vx * dt;
          W.by += W.vy * dt;
          if (W.bx < r) { W.bx = r; W.vx = Math.abs(W.vx); }
          if (W.bx > W.w - r) { W.bx = W.w - r; W.vx = -Math.abs(W.vx); }
          if (W.by < r) { W.by = r; W.vy = Math.abs(W.vy); }
          if (W.vy > 0 && W.by + r >= padY && W.by + r <= padY + 14 && Math.abs(W.bx - W.px) <= padW / 2 + r) {
            const k = (W.bx - W.px) / (padW / 2);
            const sp = Math.hypot(W.vx, W.vy) * 1.02;
            W.vx = sp * Math.sin(k * 1.05);
            W.vy = -sp * Math.cos(k * 1.05);
          }
          const bw = W.w / COLS, bh = W.h * 0.05, top = W.h * 0.08;
          for (let i = 0; i < W.bricks.length; i++) {
            if (!W.bricks[i]) continue;
            const x = (i % COLS) * bw, y = top + Math.floor(i / COLS) * bh;
            if (W.bx + r > x && W.bx - r < x + bw && W.by + r > y && W.by - r < y + bh) {
              W.bricks[i] = false;
              W.score += 50;
              const fromSide = W.bx < x || W.bx > x + bw;
              if (fromSide) W.vx = -W.vx;
              else W.vy = -W.vy;
              break;
            }
          }
          if (W.bricks.every((b) => !b)) W.over = true;
          if (W.by > W.h + r) {
            W.lives -= 1;
            W.stuck = true;
            if (W.lives <= 0) W.over = true;
          }
        }
        setFrame((f) => f + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const W = world.current;
  const pic = createPicture((c) => {
    if (!W) return;
    const p = Skia.Paint();
    p.setAntiAlias(true);
    const bw = W.w / COLS, bh = W.h * 0.05, top = W.h * 0.08;
    W.bricks.forEach((alive, i) => {
      if (!alive) return;
      p.setColor(Skia.Color(COLORS[Math.floor(i / COLS)]!));
      c.drawRRect(Skia.RRectXY(Skia.XYWHRect((i % COLS) * bw + 3, top + Math.floor(i / COLS) * bh + 3, bw - 6, bh - 6), 6, 6), p);
    });
    const padW = W.w * 0.24;
    p.setColor(Skia.Color("#8B42F6"));
    c.drawRRect(Skia.RRectXY(Skia.XYWHRect(W.px - padW / 2, W.h - 40, padW, 14), 7, 7), p);
    const glow = Skia.Paint();
    glow.setColor(Skia.Color("#FFB347"));
    glow.setMaskFilter(Skia.MaskFilter.MakeBlur(1, 8, true));
    const r = Math.max(6, W.w * 0.018);
    c.drawCircle(W.bx, W.by, r * 1.6, glow);
    p.setColor(Skia.Color("#FFF1C2"));
    c.drawCircle(W.bx, W.by, r, p);
    for (let i = 0; i < W.lives; i++) {
      p.setColor(Skia.Color("#FF4F9A"));
      c.drawCircle(W.w - 16 - i * 18, 14, 6, p);
    }
  }, Skia.XYWHRect(0, 0, Math.max(1, size.w), Math.max(1, size.h)));

  const moveTo = (e: GestureResponderEvent) => {
    if (!world.current) return;
    world.current.px = Math.min(world.current.w * 0.88, Math.max(world.current.w * 0.12, e.nativeEvent.pageX - offset.current));
  };
  return (
    <GameFrame id="bricks" score={W?.score ?? 0} over={!!W?.over} onExit={onExit} onReplay={() => reset()}>
      <View
        ref={ref as never}
        style={{ flex: 1 }}
        onLayout={(e) => {
          setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
          ref.current?.measure((_x, _y, _w, _h, px) => (offset.current = px));
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          ref.current?.measure((_x, _y, _w, _h, px) => (offset.current = px));
          moveTo(e);
        }}
        onResponderMove={moveTo}
        onResponderRelease={() => {
          const w = world.current;
          if (w && w.stuck && !w.over) {
            w.stuck = false;
            const sp = Math.max(320, w.h * 0.75);
            w.vx = sp * 0.35;
            w.vy = -sp;
          }
        }}
        testID="bricks-board"
      >
        <Canvas style={{ flex: 1 }} pointerEvents="none">
          <Picture picture={pic} />
        </Canvas>
      </View>
    </GameFrame>
  );
}
