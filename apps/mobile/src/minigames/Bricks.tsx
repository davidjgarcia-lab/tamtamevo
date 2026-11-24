import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import { isFirstPlayToday } from "@tamtam/core";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, type GestureResponderEvent } from "react-native";
import { useGame } from "../game/GameProvider";
import { drawLandscape } from "../home/roomArt";
import { brand, fonts } from "../theme";
import { GameFrame } from "./common";

/**
 * "Lanzar ascuas" (references batch 1: ballz-style). Drag to aim, release to fire a burst of embers.
 * Rocks show their life as a number and move down one row per turn. Pickups: +1 ember, horizontal / vertical ray.
 */
const COLS = 7;
const ROWS = 9;
type Rock = { c: number; r: number; hp: number; max: number };
type Pick = { c: number; r: number; kind: "plus" | "rayH" | "rayV"; used: boolean };
type Ball = { x: number; y: number; vx: number; vy: number; live: boolean; delay: number };
interface World {
  W: number; H: number; cell: number; floor: number;
  rocks: Rock[]; picks: Pick[]; balls: Ball[];
  launchX: number; nextX: number | null; balls0: number; addBalls: number;
  turn: number; score: number; combo: number; bestCombo: number; firing: boolean; over: boolean; easy: number;
  aim: { x: number; y: number } | null; fast: boolean; turnStart: number;
}

function spawnRow(w: World) {
  const n = 2 + Math.floor(Math.random() * 4);
  const cols = [...Array(COLS).keys()].sort(() => Math.random() - 0.5);
  const hpBase = Math.max(1, Math.round(w.turn * w.easy));
  for (let i = 0; i < n; i++) {
    const hp = Math.random() < 0.15 ? hpBase * 2 : hpBase;
    w.rocks.push({ c: cols[i]!, r: 0, hp, max: hp });
  }
  const free = cols.slice(n);
  if (free.length) w.picks.push({ c: free[0]!, r: 0, kind: "plus", used: false });
  if (free.length > 1 && Math.random() < 0.25) w.picks.push({ c: free[1]!, r: 0, kind: Math.random() < 0.5 ? "rayH" : "rayV", used: false });
}

export function BricksGame({ onExit }: { onExit: () => void }) {
  const { state, now } = useGame();
  const world = useRef<World | null>(null);
  const [, setFrame] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const offset = useRef({ x: 0, y: 0 });
  type Measurable = { measure: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void };
  const ref = useRef<Measurable | null>(null);
  const easy = isFirstPlayToday(state, "bricks", now()) ? 0.7 : 1;

  const reset = (W = size.w, H = size.h) => {
    const cell = W / COLS;
    const w: World = {
      W, H, cell, floor: H - 34, rocks: [], picks: [], balls: [], launchX: W / 2, nextX: null, balls0: 1, addBalls: 0,
      turn: 1, score: 0, combo: 0, bestCombo: 0, firing: false, over: false, easy, aim: null, fast: false, turnStart: 0,
    };
    spawnRow(w);
    for (const r of w.rocks) r.r = 1;
    for (const p of w.picks) p.r = 1;
    world.current = w;
    setFrame((f) => f + 1);
  };
  useEffect(() => {
    if (size.w) reset(size.w, size.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  useEffect(() => {
    let raf = 0, last = 0;
    const loop = (ts: number) => {
      const w = world.current;
      const dt0 = last ? Math.min(0.033, (ts - last) / 1000) : 0;
      last = ts;
      if (w && w.firing && !w.over) {
        const sub = w.fast ? 8 : 4;
        const dt = (dt0 * (w.fast ? 2 : 1)) / sub;
        const rad = w.cell * 0.13;
        const top = 24;
        for (let k = 0; k < sub; k++) {
          for (const b of w.balls) {
            if (!b.live) continue;
            if (b.delay > 0) { b.delay -= dt; continue; }
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.x < rad) { b.x = rad; b.vx = Math.abs(b.vx); }
            if (b.x > w.W - rad) { b.x = w.W - rad; b.vx = -Math.abs(b.vx); }
            if (b.y < top + rad) { b.y = top + rad; b.vy = Math.abs(b.vy); }
            for (const r of w.rocks) {
              if (r.hp <= 0) continue;
              const x0 = r.c * w.cell + 2, y0 = top + r.r * w.cell + 2, s = w.cell - 4;
              const cx = Math.max(x0, Math.min(b.x, x0 + s)), cy = Math.max(y0, Math.min(b.y, y0 + s));
              const dx = b.x - cx, dy = b.y - cy;
              if (dx * dx + dy * dy > rad * rad) continue;
              if (Math.abs(dx) > Math.abs(dy)) { b.vx = Math.sign(dx || -b.vx) * Math.abs(b.vx); b.x = cx + Math.sign(dx || 1) * rad; }
              else { b.vy = Math.sign(dy || -b.vy) * Math.abs(b.vy); b.y = cy + Math.sign(dy || 1) * rad; }
              hitRock(w, r);
              break;
            }
            for (const p of w.picks) {
              if (p.used && p.kind === "plus") continue;
              const px = (p.c + 0.5) * w.cell, py = top + (p.r + 0.5) * w.cell;
              if (Math.hypot(b.x - px, b.y - py) > w.cell * 0.3) continue;
              if (p.kind === "plus") { p.used = true; w.addBalls += 1; }
              else if (!p.used || Math.random() < 0.02) {
                p.used = true;
                for (const r of w.rocks) if (r.hp > 0 && (p.kind === "rayH" ? r.r === p.r : r.c === p.c)) hitRock(w, r);
              }
            }
            if (b.vy > 0 && b.y >= w.floor) {
              b.live = false; b.y = w.floor;
              if (w.nextX === null) w.nextX = b.x;
            }
          }
        }
        w.rocks = w.rocks.filter((r) => r.hp > 0);
        if (!w.fast && ts - w.turnStart > 5000) w.fast = true;
        if (w.balls.every((b) => !b.live)) endTurn(w);
        setFrame((f) => f + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function hitRock(w: World, r: Rock) {
    r.hp -= 1;
    if (r.hp <= 0) { w.score += r.max; w.combo += 1; w.bestCombo = Math.max(w.bestCombo, w.combo); }
  }
  function endTurn(w: World) {
    w.firing = false;
    w.launchX = w.nextX ?? w.launchX;
    w.nextX = null;
    w.balls0 += w.addBalls;
    w.addBalls = 0;
    w.picks = w.picks.filter((p) => !p.used);
    w.turn += 1;
    for (const r of w.rocks) r.r += 1;
    for (const p of w.picks) p.r += 1;
    w.picks = w.picks.filter((p) => p.r < ROWS - 1);
    spawnRow(w);
    if (w.rocks.some((r) => r.r >= ROWS - 1)) w.over = true;
  }

  const local = (e: GestureResponderEvent) => ({ x: e.nativeEvent.pageX - offset.current.x, y: e.nativeEvent.pageY - offset.current.y });
  const aimAt = (e: GestureResponderEvent) => {
    const w = world.current;
    if (!w || w.firing || w.over) return;
    w.aim = local(e);
    setFrame((f) => f + 1);
  };
  const fire = () => {
    const w = world.current;
    if (!w || w.firing || w.over || !w.aim) return;
    const dx = w.aim.x - w.launchX, dy = Math.min(-12, w.aim.y - w.floor);
    const a = Math.atan2(dy, dx);
    const ang = Math.max(-Math.PI + 0.17, Math.min(-0.17, a));
    const sp = Math.max(420, w.H * 1.25);
    w.balls = Array.from({ length: w.balls0 }, (_, i) => ({ x: w.launchX, y: w.floor - 1, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, live: true, delay: i * 0.07 }));
    w.combo = 0; w.firing = true; w.aim = null; w.fast = false; w.turnStart = performance.now();
  };

  const w = world.current;
  const pic = createPicture((c) => {
    if (!w) return;
    const top = 24;
    c.save();
    c.clipRect(Skia.XYWHRect(0, 0, w.W, w.H), 1, true);
    drawLandscape(c, ["forest", "sea", "mountains", "aurora", "desert"][Math.floor((w.turn - 1) / 8) % 5]!, 0, 0, w.W, w.H);
    const shade = Skia.Paint(); shade.setColor(Skia.Color("#17132B")); shade.setAlphaf(Math.max(0.35, 0.8 - w.turn * 0.02));
    c.drawRect(Skia.XYWHRect(0, 0, w.W, w.H), shade);
    c.restore();
    const p = Skia.Paint(); p.setAntiAlias(true);
    for (const r of w.rocks) {
      const x0 = r.c * w.cell + 2, y0 = top + r.r * w.cell + 2, s = w.cell - 4;
      const k = r.hp / Math.max(1, w.turn * 2);
      p.setColor(Skia.Color(k > 0.75 ? "#B5452E" : k > 0.4 ? "#8E5E40" : "#6E6A78"));
      c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x0, y0, s, s), 8, 8), p);
      p.setColor(Skia.Color("#FFB347")); p.setAlphaf(0.5);
      c.drawLine(x0 + 6, y0 + s * 0.3, x0 + s * 0.5, y0 + s * 0.55, (() => { const q = Skia.Paint(); q.setColor(Skia.Color("#FF8A00")); q.setStrokeWidth(2); q.setStyle(1); q.setAlphaf(0.7); return q; })());
      p.setAlphaf(1);
    }
    for (const pk of w.picks) {
      if (pk.used && pk.kind === "plus") continue;
      const px = (pk.c + 0.5) * w.cell, py = top + (pk.r + 0.5) * w.cell;
      const q = Skia.Paint(); q.setAntiAlias(true); q.setStyle(1); q.setStrokeWidth(3);
      q.setColor(Skia.Color(pk.kind === "plus" ? "#FFD166" : "#00D4FF"));
      c.drawCircle(px, py, w.cell * 0.22, q);
      if (pk.kind === "plus") { c.drawLine(px - 6, py, px + 6, py, q); c.drawLine(px, py - 6, px, py + 6, q); }
      else if (pk.kind === "rayH") c.drawLine(px - 9, py, px + 9, py, q);
      else c.drawLine(px, py - 9, px, py + 9, q);
    }
    const ember = Skia.Paint(); ember.setAntiAlias(true); ember.setColor(Skia.Color("#FFE08A"));
    const glow = Skia.Paint(); glow.setColor(Skia.Color("#FF8A00")); glow.setAlphaf(0.6); glow.setMaskFilter(Skia.MaskFilter.MakeBlur(1, 5, true));
    for (const b of w.balls) if (b.live && b.delay <= 0) { c.drawCircle(b.x, b.y, w.cell * 0.2, glow); c.drawCircle(b.x, b.y, w.cell * 0.12, ember); }
    // Launcher (the Tamtam's crest flame) and aim line.
    c.drawCircle(w.launchX, w.floor, 14, glow);
    c.drawCircle(w.launchX, w.floor, 8, ember);
    if (w.aim) {
      const dx = w.aim.x - w.launchX, dy = Math.min(-12, w.aim.y - w.floor), L = Math.hypot(dx, dy);
      const dot = Skia.Paint(); dot.setColor(Skia.Color("#FFFFFF")); dot.setAlphaf(0.8);
      for (let i = 1; i <= 9; i++) c.drawCircle(w.launchX + (dx / L) * i * 22, w.floor + (dy / L) * i * 22, 3, dot);
    }

  }, Skia.XYWHRect(0, 0, Math.max(1, size.w), Math.max(1, size.h)));

  const danger = !!w && w.rocks.some((r) => r.r >= ROWS - 3);
  return (
    <GameFrame id="bricks" score={w?.score ?? 0} over={!!w?.over} onExit={onExit} onReplay={() => reset()} metrics={{ combo: w?.bestCombo ?? 0 }} cheer={danger ? "worried" : (w?.combo ?? 0) >= 3 ? "happy" : null}>
      <View
        ref={ref as never}
        style={{ flex: 1 }}
        onLayout={(e) => {
          setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
          ref.current?.measure((_x, _y, _w, _h, px, py) => (offset.current = { x: px, y: py }));
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => { ref.current?.measure((_x, _y, _w, _h, px, py) => (offset.current = { x: px, y: py })); aimAt(e); }}
        onResponderMove={aimAt}
        onResponderRelease={fire}
        testID="bricks-board"
      >
        <Canvas style={{ flex: 1 }} pointerEvents="none">
          <Picture picture={pic} />
        </Canvas>
        {w?.rocks.map((r, i) => (
          <Text key={i} pointerEvents="none" style={{ position: "absolute", left: r.c * w.cell, top: 24 + r.r * w.cell + w.cell / 2 - 10, width: w.cell, textAlign: "center", color: "#FFFFFF", fontFamily: fonts.displayBold, fontSize: 16 }}>
            {r.hp}
          </Text>
        ))}
        {w && (
          <Text pointerEvents="none" style={{ position: "absolute", left: w.launchX + 12, top: w.floor - 26, color: brand.gold, fontFamily: fonts.bodyBold, fontSize: 13 }}>
            ×{w.balls0}
          </Text>
        )}
        <Text style={{ position: "absolute", top: 4, left: 8, color: brand.cloud, fontFamily: fonts.bodyBold, fontSize: 12 }} pointerEvents="none">
          Turno {w?.turn ?? 1}
        </Text>
        {w?.firing && (
          <Pressable onPress={() => w && (w.fast = true)} style={{ position: "absolute", top: 2, right: 8, backgroundColor: brand.panelHi, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }} accessibilityLabel="Acelerar">
            <Text style={{ color: brand.cloud, fontFamily: fonts.bodyBold }}>»</Text>
          </Pressable>
        )}
      </View>
    </GameFrame>
  );
}
