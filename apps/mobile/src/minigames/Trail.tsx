import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import { isFirstPlayToday } from "@tamtam/core";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useGame } from "../game/GameProvider";
import { NO_SELECT } from "../screens/GymPanel";
import { brand, fonts } from "../theme";
import { DPad, GameFrame, useSwipe } from "./common";

/**
 * Ember trail (references batch 1: .io snake). Constant speed + boost that costs length, rival trails with
 * personalities (timid / glutton / aggressive), special pellets (magnet, shield, grow), one revive per run and
 * beginner protection (rivals move slower in the first runs and on the first run of the day).
 */
const N = 17;
type P = { x: number; y: number };
type Kind = "ember" | "magnet" | "shield" | "grow";
type Bot = { body: P[]; dir: P; style: "timid" | "glutton" | "aggressive"; dead: number; color: string };
interface World {
  me: P[]; dir: P; nextDir: P; bots: Bot[]; food: { p: P; kind: Kind }[];
  score: number; over: boolean; revived: boolean; dying: boolean;
  shield: number; magnet: number; boost: boolean; tick: number; slowBots: boolean; eaten: number;
}
const eq = (a: P, b: P) => a.x === b.x && a.y === b.y;
const DIRS: P[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

function occupied(w: World, p: P) {
  return w.me.some((q) => eq(q, p)) || w.bots.some((b) => b.body.some((q) => eq(q, p)));
}
function spawnFood(w: World, kind: Kind = "ember") {
  for (let k = 0; k < 200; k++) {
    const p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
    if (!occupied(w, p) && !w.food.some((f) => eq(f.p, p))) return void w.food.push({ p, kind });
  }
}
function fresh(slow: boolean): World {
  const w: World = {
    me: [{ x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    bots: [
      { body: [{ x: 13, y: 3 }, { x: 14, y: 3 }], dir: { x: -1, y: 0 }, style: "glutton", dead: 0, color: "#FFD166" },
      { body: [{ x: 13, y: 13 }, { x: 14, y: 13 }], dir: { x: -1, y: 0 }, style: "aggressive", dead: 0, color: "#FF4F9A" },
      { body: [{ x: 8, y: 1 }, { x: 8, y: 0 }], dir: { x: 0, y: 1 }, style: "timid", dead: 0, color: "#4FD8B4" },
    ],
    food: [], score: 0, over: false, revived: false, dying: false, shield: 0, magnet: 0, boost: false, tick: 0, slowBots: slow, eaten: 0,
  };
  for (let i = 0; i < 4; i++) spawnFood(w);
  spawnFood(w, "magnet");
  return w;
}

export function TrailGame({ onExit }: { onExit: () => void }) {
  const { state, now } = useGame();
  const slow = (state.records.trail?.plays ?? 0) < 3 || isFirstPlayToday(state, "trail", now());
  const world = useRef<World>(fresh(slow));
  const [, setTick] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let acc = 0, last = performance.now();
    const id = setInterval(() => {
      const t = performance.now();
      acc += t - last; last = t;
      const w = world.current;
      const step = w.boost && w.me.length > 3 ? 85 : 170;
      while (acc >= step) { acc -= step; advance(w); }
      setTick((n) => n + 1);
    }, 30);
    return () => clearInterval(id);
  }, []);

  function eat(w: World, p: P, isMe: boolean, body: P[]) {
    const i = w.food.findIndex((f) => eq(f.p, p));
    if (i < 0) return false;
    const f = w.food[i]!;
    w.food.splice(i, 1);
    if (isMe) {
      if (f.kind === "ember") { w.score += 20; w.eaten++; }
      if (f.kind === "magnet") w.magnet = 40;
      if (f.kind === "shield") w.shield = 30;
      if (f.kind === "grow") { for (let k = 0; k < 3; k++) body.push({ ...body[body.length - 1]! }); w.score += 30; }
    }
    spawnFood(w, Math.random() < 0.12 ? (["magnet", "shield", "grow"] as Kind[])[Math.floor(Math.random() * 3)]! : "ember");
    return f.kind === "ember" || f.kind === "grow";
  }

  function advance(w: World) {
    if (w.over || w.dying) return;
    w.tick++;
    w.dir = w.nextDir;
    const head = { x: w.me[0]!.x + w.dir.x, y: w.me[0]!.y + w.dir.y };
    const wall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
    const hit = w.me.slice(0, -1).some((q) => eq(q, head)) || w.bots.some((b) => b.body.some((q) => eq(q, head)));
    if (wall || (hit && w.shield <= 0)) {
      w.dying = true;
      if (w.revived) w.over = true;
      return;
    }
    w.me.unshift(head);
    if (!eat(w, head, true, w.me)) w.me.pop();
    // Boost costs length (one segment every 6 boosted steps).
    if (w.boost && w.me.length > 3 && w.tick % 6 === 0) w.me.pop();
    if (w.shield > 0) w.shield--;
    if (w.magnet > 0) {
      w.magnet--;
      for (const f of w.food) {
        if (f.kind !== "ember") continue;
        if (Math.abs(f.p.x - head.x) + Math.abs(f.p.y - head.y) <= 4) f.p = { x: f.p.x + Math.sign(head.x - f.p.x), y: f.p.y + Math.sign(head.y - f.p.y) };
      }
      eat(w, head, true, w.me);
    }
    // Rivals.
    if (w.slowBots && w.tick % 2 === 1) return;
    for (const b of w.bots) {
      if (!b.body.length) {
        if (--b.dead <= 0) { const s = { x: N - 2, y: Math.floor(Math.random() * N) }; if (!occupied(w, s)) { b.body = [s]; b.dir = { x: -1, y: 0 }; } }
        continue;
      }
      const h = b.body[0]!;
      const target = b.style === "aggressive" ? { x: head.x + w.dir.x * 3, y: head.y + w.dir.y * 3 }
        : b.style === "timid" ? { x: N - 1 - head.x, y: N - 1 - head.y }
        : w.food.reduce((best, f) => (Math.abs(f.p.x - h.x) + Math.abs(f.p.y - h.y) < Math.abs(best.x - h.x) + Math.abs(best.y - h.y) ? f.p : best), w.food[0]?.p ?? { x: 8, y: 8 });
      const opts = DIRS.filter((d) => !(d.x === -b.dir.x && d.y === -b.dir.y))
        .map((d) => ({ d, p: { x: h.x + d.x, y: h.y + d.y } }))
        .filter(({ p }) => p.x >= 0 && p.y >= 0 && p.x < N && p.y < N && !occupied(w, p))
        .sort((a, c) => Math.abs(a.p.x - target.x) + Math.abs(a.p.y - target.y) - (Math.abs(c.p.x - target.x) + Math.abs(c.p.y - target.y)) + (Math.random() - 0.5) * 1.2);
      if (!opts.length) {
        // The rival crashes: its body turns into embers.
        for (const q of b.body.filter((_, i) => i % 2 === 0)) if (!w.food.some((f) => eq(f.p, q))) w.food.push({ p: q, kind: "ember" });
        b.body = []; b.dead = 20;
        continue;
      }
      const { d, p } = opts[0]!;
      b.dir = d; b.body.unshift(p);
      if (!eat(w, p, false, b.body)) b.body.pop();
      if (b.body.length > 10) b.body.pop();
    }
  }

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
    const p = Skia.Paint(); p.setAntiAlias(true);
    p.setColor(Skia.Color("#241D45"));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) % 2) c.drawRect(Skia.XYWHRect(ox + x * cell, oy + y * cell, cell, cell), p);
    for (const f of w.food) {
      const cx = ox + (f.p.x + 0.5) * cell, cy = oy + (f.p.y + 0.5) * cell;
      const col = f.kind === "ember" ? "#FFB347" : f.kind === "magnet" ? "#00D4FF" : f.kind === "shield" ? "#B983FF" : "#4FD8B4";
      const g = Skia.Paint(); g.setColor(Skia.Color(col)); g.setMaskFilter(Skia.MaskFilter.MakeBlur(1, cell * 0.3, true));
      c.drawCircle(cx, cy, cell * (f.kind === "ember" ? 0.42 : 0.55), g);
      p.setColor(Skia.Color(f.kind === "ember" ? "#FFF1C2" : "#FFFFFF"));
      c.drawCircle(cx, cy, cell * (f.kind === "ember" ? 0.2 : 0.28), p);
    }
    const body = (arr: P[], col: string, headCol: string, glow = false) => {
      arr.forEach((q, i) => {
        p.setColor(Skia.Color(i === 0 ? headCol : col));
        p.setAlphaf(i === 0 ? 1 : 0.95 - (i / Math.max(1, arr.length)) * 0.4);
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(ox + q.x * cell + 1.5, oy + q.y * cell + 1.5, cell - 3, cell - 3), cell * 0.3, cell * 0.3), p);
      });
      p.setAlphaf(1);
      if (glow && arr[0]) {
        const g = Skia.Paint(); g.setStyle(1); g.setStrokeWidth(3); g.setColor(Skia.Color("#B983FF"));
        c.drawCircle(ox + (arr[0].x + 0.5) * cell, oy + (arr[0].y + 0.5) * cell, cell * 0.8, g);
      }
    };
    for (const b of w.bots) body(b.body, b.color, "#FFFFFF");
    body(w.me, w.boost ? "#8FF0FF" : "#00D4FF", "#F5F3FF", w.shield > 0);
  }, Skia.XYWHRect(0, 0, Math.max(1, size.w), Math.max(1, size.h)));

  const revive = () => {
    const ww = world.current;
    ww.revived = true; ww.dying = false; ww.shield = 25;
    ww.me = ww.me.slice(0, Math.max(3, Math.ceil(ww.me.length / 2)));
    // Turn away from the obstacle.
    const h = ww.me[0]!;
    const safe = DIRS.find((d) => { const p = { x: h.x + d.x, y: h.y + d.y }; return p.x >= 0 && p.y >= 0 && p.x < N && p.y < N && !occupied(ww, p); });
    if (safe) { ww.dir = safe; ww.nextDir = safe; }
  };
  const giveUp = () => { world.current.over = true; world.current.dying = false; };

  return (
    <GameFrame
      id="trail" score={w.score} over={w.over}
      onExit={onExit}
      onReplay={() => { world.current = fresh(slow); setTick((n) => n + 1); }}
      metrics={{ combo: w.eaten }}
      cheer={w.dying ? "worried" : w.shield > 0 || w.magnet > 0 ? "happy" : null}
      extra={
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 8 }}>
          <DPad onDir={steer} />
          <Pressable
            onPressIn={() => (world.current.boost = true)}
            onPressOut={() => (world.current.boost = false)}
            style={({ pressed }) => [{ width: 72, height: 72, borderRadius: 36, backgroundColor: pressed ? brand.orange : brand.panelHi, borderWidth: 2, borderColor: brand.orange, alignItems: "center", justifyContent: "center" }, NO_SELECT]}
            accessibilityRole="button"
            accessibilityLabel="Acelerón"
            testID="trail-boost"
          >
            <Text style={{ fontFamily: fonts.displayBold, color: brand.cloud, fontSize: 14 }}>Acelerón</Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} {...swipe}>
        <Canvas style={{ flex: 1 }} pointerEvents="none">
          <Picture picture={pic} />
        </Canvas>
        {w.dying && !w.over && (
          <View style={{ position: "absolute", left: 0, right: 0, top: "35%", alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 24, color: brand.cloud }}>¡Choque!</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={revive} style={{ backgroundColor: brand.cyan, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 }} testID="trail-revive">
                <Text style={{ fontFamily: fonts.displayBold, color: brand.core }}>Revivir (1 vez)</Text>
              </Pressable>
              <Pressable onPress={giveUp} style={{ backgroundColor: brand.panelHi, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 }} testID="trail-giveup">
                <Text style={{ fontFamily: fonts.displayBold, color: brand.cloud }}>Terminar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </GameFrame>
  );
}
