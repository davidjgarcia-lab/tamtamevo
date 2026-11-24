import { BlurStyle, Canvas, createPicture, PaintStyle, Picture, Skia } from "@shopify/react-native-skia";
import type { ChispinClipId } from "@tamtam/art";
import {
  buy, careAction, checkPlacement, readyToEvolve, setFinish, mopPoop, finishBath, peekLife, solveProblem, speechFor, quantity, cloneData, eggProgress, feedFood, FOODS, hatch, lustre, mirror, mood, move, napCooldownLeft, place, PlacementRejected, poopSpot, PROBLEMS,
  SLICE_CATALOG, unplace, type CareKind, type CareReaction, type CatalogItem, type Placement,
} from "@tamtam/core";
import { transformPoint } from "@tamtam/rig";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { Easing, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { composeLook } from "../creature/look";
import { drawCarried, drawDirt, drawEgg, drawFoam, drawMeal, drawMop, drawShower, drawSoap, drawTowel, drawTowelAt, foodPicture } from "../creature/props";
import { FoodIcon } from "../ui/FoodIcon";
import { ProblemPanel } from "./ProblemPanel";
import { BONE, drawTamtam, STAGE_SCALE, useCreature } from "../creature/useCreature";
import { newId, useGame } from "../game/GameProvider";
import { buildRoomPicture, cellAt, drawFurniture, placementRect, roomGeom } from "../home/roomArt";
import { brand, colors, fonts } from "../theme";
import { Btn } from "../ui/kit";
import { Icon } from "../ui/icons";
import { GymPanel, NO_SELECT } from "./GymPanel";
import { NamingPanel } from "./NamingPanel";
import { FinishTray, FoodSheet, InventoryTray } from "./sheets";
import { StudyPanel } from "./StudyPanel";
import { IconAction } from "./IconAction";

const REACTION: Record<CareReaction, { clip: ChispinClipId; ms: number; text: string | null }> = {
  eat: { clip: "eat", ms: 2300, text: "¡Ñam!" },
  eat_favorite: { clip: "eat", ms: 2600, text: "¡Su comida favorita!" },
  refuse_full: { clip: "angry", ms: 1400, text: "Está lleno: no quiere más." },
  dislike: { clip: "angry", ms: 1600, text: "¡Puaj! No le gusta la comida fría." },
  bathe: { clip: "bathe", ms: 3000, text: "¡A la ducha!" },
  clean: { clip: "celebrate", ms: 1100, text: "¡Limpio!" },
  pet: { clip: "pet", ms: 2400, text: null },
  pet_saturated: { clip: "idle", ms: 600, text: "Ya le has dado muchos mimos hoy." },
  play: { clip: "celebrate", ms: 2200, text: "¡A jugar!" },
  too_tired: { clip: "sad", ms: 1600, text: "Está demasiado cansado." },
  sleep: { clip: "sleep", ms: 0, text: "Buenas noches." },
  wake: { clip: "celebrate", ms: 1100, text: "¡Buenos días!" },
  already_asleep: { clip: "sleep", ms: 0, text: "Está dormido. Despiértalo primero." },
  nap: { clip: "sleep", ms: 0, text: "Siesta de 20 minutos (+15 energía)." },
  not_sleepy: { clip: "angry", ms: 1200, text: "No tiene sueño todavía." },
};

const PLACE_ERR: Record<string, string> = {
  overlap: "Ahí ya hay otro objeto.",
  out_of_bounds: "No cabe ahí.",
  window: "No se puede tapar la ventana.",
  not_owned: "No tienes más copias de ese objeto.",
  wrong_layer: "Ese objeto va en otro sitio (pared o suelo).",
  not_mirrorable: "Ese objeto no se puede girar.",
};

const FOOD_IDS = Object.keys(FOODS);
const FOOD_PICS = FOOD_IDS.map(foodPicture);

type Mode =
  | { kind: "play" }
  | { kind: "mop" }
  | { kind: "gym" }
  | { kind: "study" }
  | { kind: "bath"; step: 0 | 1 | 2 }
  | { kind: "feed"; food: string | null }
  | { kind: "problem" }
  | { kind: "decor"; selectedUid: string | null; pendingItem: string | null }
  | { kind: "preview"; item: CatalogItem; x: number; y: number; mirrored: boolean };

interface Fx {
  egg: boolean;
  eggP: number;
  crack: number;
  hygiene: number;
  food: number;
  foodStart: number;
  bath: number;
  mop: boolean;
  mx: number;
  my: number;
  /** Bath: -1 none, 0 soap, 1 shower, 2 towel. */
  bathStep: number;
  foam: number;
  tx: number;
  ty: number;
  toolOn: boolean;
  /** Food carried by the finger (index) or -1. */
  carry: number;
}

export function HomeScreen({
  toast, preview, onPreviewDone, onOpenGames, onEvolve,
}: { toast: (t: string) => void; preview: CatalogItem | null; onPreviewDone: () => void; onOpenGames: () => void; onEvolve: () => void }) {
  const game = useGame();
  const { state, act, now } = game;
  const t = state.tamtam;
  const liveTier = t ? lustre(state.care, t).tier : "plain";
  const formTier = !t || t.stage === "baby" ? liveTier : t.formQuality ?? liveTier;
  const look = useMemo(() => composeLook(formTier, liveTier), [formTier, liveTier]);
  const creature = useCreature(t ? state.alleleId : state.egg?.alleleId ?? state.alleleId, look, t?.genome);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [food, setFood] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "play" });
  const [decorTab, setDecorTab] = useState<"Muebles" | "Paredes" | "Suelo">("Muebles");
  const [reaction, setReaction] = useState<ChispinClipId | null>(null);
  const [activityClip, setActivityClip] = useState<ChispinClipId | null>(null);
  const [walking, setWalking] = useState(false);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posX = useSharedValue(0);
  const dir = useSharedValue(1);
  const vx = useSharedValue(0);
  const fx = useSharedValue<Fx>({ egg: false, eggP: 0, crack: -1, hygiene: 100, food: -1, foodStart: 0, bath: -1, mop: false, mx: 0, my: 0, bathStep: -1, foam: 0, tx: 0, ty: 0, toolOn: false, carry: -1 });
  const bathProg = useRef([0, 0, 0]);
  const [bathView, setBathView] = useState([0, 0, 0]);
  const [bubble, setBubble] = useState<{ text: string; x: number } | null>(null);
  const arrive = useRef<(() => void) | null>(null);
  const hatching = useRef(false);

  const g = useMemo(() => (size.w ? roomGeom(size.w, size.h, state.room) : null), [size, state.room]);
  const laneY = g ? g.floorTop + g.floorCellH * 3.4 : 0;
  const scale = (g ? Math.min((g.floorCellH * 2.1) / 100, g.w / 330) : 1) * (STAGE_SCALE[t?.stage ?? "baby"] ?? 1);

  useEffect(() => {
    if (g && posX.value === 0) posX.value = g.w * 0.5;
  }, [g, posX]);

  // Live inputs for the render worklet.
  const isEgg = state.phase === "egg";
  const eggP = eggProgress(state, now());
  useEffect(() => {
    fx.value = { ...fx.value, egg: isEgg, eggP, hygiene: state.care.needs.hygiene };
  }, [isEgg, eggP, state.care.needs.hygiene, fx]);

  // Shop → "Probar en mi casa".
  useEffect(() => {
    if (preview?.furniture) setMode({ kind: "preview", item: preview, x: preview.furniture.layer === "wall" ? 8 : 6, y: 1, mirrored: false });
  }, [preview]);

  // Which animation plays: walking > activity > reaction > mood.
  const m = t ? mood(state.care, now()) : "happy";
  const base: ChispinClipId = state.phase === "naming" ? "celebrate" : m === "asleep" || m === "napping" ? "sleep" : m === "hungry" ? "hungry" : m === "sad" || m === "tired" || m === "dirty" ? "sad" : "idle";
  const inActivity = mode.kind === "gym" || mode.kind === "study";
  const clip: ChispinClipId = walking ? "walk" : inActivity ? activityClip ?? "idle" : reaction ?? base;
  useEffect(() => {
    creature.play(clip);
  }, [clip, creature.play]);

  const onArrive = () => {
    setWalking(false);
    const f = arrive.current;
    arrive.current = null;
    f?.();
  };
  const walkTo = (target: number, then?: () => void) => {
    const dist = Math.abs(target - posX.value);
    arrive.current = then ?? null;
    if (dist < 8) return onArrive();
    dir.value = target > posX.value ? 1 : -1;
    vx.value = 46;
    setWalking(true);
    posX.value = withTiming(target, { duration: (dist / (70 * scale)) * 1000, easing: Easing.linear }, () => {
      vx.value = 0;
      scheduleOnRN(onArrive);
    });
  };

  // The Tamtam says what it needs now and then.
  useEffect(() => {
    if (!t || !g) return;
    const id = setInterval(() => {
      if (mode.kind !== "play" || state.care.asleep) return;
      const sp = speechFor(state, now());
      if (sp.mood === "happy" && Math.random() < 0.6) return;
      setBubble({ text: sp.text, x: posX.value });
    }, 18_000);
    return () => clearInterval(id);
  });
  useEffect(() => {
    if (!bubble) return;
    const tm = setTimeout(() => setBubble(null), 4500);
    return () => clearTimeout(tm);
  }, [bubble]);

  // Wandering: when idle and happy enough, walk somewhere now and then.
  useEffect(() => {
    if (!g || !t) return;
    const id = setInterval(() => {
      if (reaction || walking || base !== "idle" || mode.kind !== "play" || food || Math.random() < 0.4) return;
      walkTo(g.w * (0.18 + Math.random() * 0.64));
    }, 4500);
    return () => clearInterval(id);
  });

  const react = (r: CareReaction, extra?: { food?: string }) => {
    const def = REACTION[r];
    if (def.text) toast(def.text);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    const tt = creature.clock.value;
    if (extra?.food && (r === "eat" || r === "eat_favorite")) fx.value = { ...fx.value, food: FOOD_IDS.indexOf(extra.food), foodStart: tt };
    if (r === "bathe") fx.value = { ...fx.value, bath: tt };
    if (def.ms > 0) {
      setReaction(def.clip);
      reactionTimer.current = setTimeout(() => {
        setReaction(null);
        fx.value = { ...fx.value, food: -1, bath: -1 };
      }, def.ms);
    } else setReaction(null);
  };
  const doCare = (kind: CareKind) => react(act((s) => careAction(s, kind, now())));

  // ── Rendering ─────────────────────────────────────────────────────────────
  const hour = new Date(now()).getHours();
  const night = hour >= 21 || hour < 7;
  const roomPic = useMemo(() => (g ? buildRoomPicture(state.room, g, { night, lightsOn: state.lightsOn }) : null), [g, state.room, night, state.lightsOn]);

  const poopAt = (ts: number) => {
    const sp = poopSpot(ts);
    return { x: g!.floorX0 + sp.x * state.room.floor.cols * g!.floorCellW, y: g!.floorTop + sp.y * (g!.floorBottom - g!.floorTop) };
  };

  const overlay = useMemo(() => {
    if (!g) return null;
    return createPicture((c) => {
      const p = Skia.Paint();
      p.setAntiAlias(true);
      const ink = Skia.Paint();
      ink.setAntiAlias(true);
      ink.setStyle(PaintStyle.Stroke);
      ink.setColor(Skia.Color("#2A1A3E"));
      ink.setStrokeWidth(1.6);
      // Poops wherever the Tamtam left them (positions derived from their timestamps).
      for (const ts of state.care.poops) {
        const { x, y } = poopAt(ts);
        const s = g.floorCellH * 0.26;
        const sh = Skia.Paint();
        sh.setColor(Skia.Color("#05030D"));
        sh.setAlphaf(0.25);
        sh.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 3, true));
        c.drawOval(Skia.XYWHRect(x - s * 1.1, y - s * 0.2, s * 2.2, s * 0.6), sh);
        for (const [dy, rw, rh, col] of [[0, 1, 0.5, "#6E4630"], [-0.42, 0.72, 0.42, "#7E5238"], [-0.78, 0.44, 0.34, "#8E5E40"]] as const) {
          p.setColor(Skia.Color(col));
          const r = Skia.XYWHRect(x - s * rw, y + s * (dy - rh), s * rw * 2, s * rh * 2);
          c.drawOval(r, p);
          c.drawOval(r, ink);
        }
        p.setColor(Skia.Color("#FFFFFF"));
        p.setAlphaf(0.5);
        c.drawOval(Skia.XYWHRect(x - s * 0.5, y - s * 0.75, s * 0.3, s * 0.16), p);
        p.setAlphaf(1);
        const stink = Skia.Paint();
        stink.setAntiAlias(true);
        stink.setStyle(PaintStyle.Stroke);
        stink.setStrokeWidth(1.6);
        stink.setColor(Skia.Color("#B6E36A"));
        stink.setAlphaf(0.7);
        for (const k of [-0.5, 0.5]) {
          const path = Skia.Path.MakeFromSVGString(`M ${x + k * s} ${y - s * 1.3} c ${-s * 0.3} ${-s * 0.3} ${s * 0.3} ${-s * 0.6} 0 ${-s * 0.9} c ${-s * 0.3} ${-s * 0.3} ${s * 0.3} ${-s * 0.6} 0 ${-s * 0.9}`);
          if (path) c.drawPath(path, stink);
        }
      }
      if (mode.kind !== "decor" && mode.kind !== "preview") return;
      const line = Skia.Paint();
      line.setAntiAlias(true);
      line.setStyle(PaintStyle.Stroke);
      line.setStrokeWidth(1);
      line.setColor(Skia.Color("#FFFFFF"));
      line.setAlphaf(0.35);
      for (let x = 0; x <= state.room.floor.cols; x++) c.drawLine(g.floorX0 + x * g.floorCellW, g.floorTop, g.floorX0 + x * g.floorCellW, g.floorBottom, line);
      for (let y = 0; y <= state.room.floor.rows; y++) c.drawLine(g.floorX0, g.floorTop + y * g.floorCellH, g.floorX0 + state.room.floor.cols * g.floorCellW, g.floorTop + y * g.floorCellH, line);
      for (let x = 0; x <= state.room.wall.cols; x++) c.drawLine(g.wallX0 + x * g.wallCell, g.wallTop, g.wallX0 + x * g.wallCell, g.wallTop + state.room.wall.rows * g.wallCell, line);
      for (let y = 0; y <= state.room.wall.rows; y++) c.drawLine(g.wallX0, g.wallTop + y * g.wallCell, g.wallX0 + state.room.wall.cols * g.wallCell, g.wallTop + y * g.wallCell, line);
      const hl = Skia.Paint();
      hl.setAntiAlias(true);
      if (mode.kind === "decor" && mode.selectedUid) {
        const sel = state.room.placements.find((q) => q.uid === mode.selectedUid);
        if (sel) {
          const r = placementRect(g, sel);
          hl.setColor(Skia.Color("#FFE08A"));
          hl.setAlphaf(0.45);
          c.drawRRect(Skia.RRectXY(Skia.XYWHRect(r.x, r.y, r.w, r.h), 6, 6), hl);
        }
      }
      if (mode.kind === "preview") {
        const cand: Placement = { uid: "__preview", itemId: mode.item.id, layer: mode.item.furniture!.layer, x: mode.x, y: mode.y, mirrored: mode.mirrored, rotated: false };
        const inv = cloneData(state.economy.inventory);
        inv.items[mode.item.id] = { qty: (inv.items[mode.item.id]?.qty ?? 0) + 1, firstAcquiredAt: 0 };
        const ok = checkPlacement(state.room, SLICE_CATALOG, inv, cand) === null;
        const r = placementRect(g, cand);
        hl.setColor(Skia.Color(ok ? "#5BC85B" : "#E5484D"));
        hl.setAlphaf(0.4);
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(r.x, r.y, r.w, r.h), 6, 6), hl);
        const ghost = Skia.Paint();
        ghost.setAlphaf(0.7);
        c.saveLayer(ghost);
        drawFurniture(c, mode.item.id, r, mode.mirrored, undefined, g.floorCellH);
        c.restore();
      }
    }, Skia.XYWHRect(0, 0, g.w, g.h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, state.care.poops, state.room, state.economy.inventory, mode]);

  const { res, clock, playback, emitters } = creature;
  const W = Math.max(1, size.w);
  const H = Math.max(1, size.h);
  const eggX = g ? g.w * 0.5 : 0;
  const dynamic = useDerivedValue(() => {
    const tt = clock.value;
    const f = fx.value;
    return createPicture((c) => {
      if (W < 2) return;
      if (f.egg) {
        drawEgg(c, eggX, laneY, scale * 1.15, tt, f.eggP, f.crack >= 0 ? tt - f.crack : -1);
        return;
      }
      const at = { x: posX.value, y: laneY, scale, dir: dir.value };
      const frame = drawTamtam(c, res, playback.value, emitters.value, tt, at, vx.value);
      drawDirt(c, frame, BONE.body, BONE.head, at, f.hygiene, tt);
      if (f.food >= 0) {
        const [mx, my] = transformPoint(frame.world, BONE.head, 42, 4);
        drawMeal(c, FOOD_PICS[f.food]!, at.x + mx * scale * at.dir, at.y + my * scale, scale * 1.35, (tt - f.foodStart) / 2.1);
      }
      if (f.bath >= 0 && tt - f.bath < 1.9) {
        drawFoam(c, frame, BONE.body, BONE.head, at, tt);
        drawShower(c, at.x + 6 * scale * at.dir, Math.max(30, laneY - 170 * scale), laneY, scale, tt);
      } else if (f.bath >= 0 && tt - f.bath < 2.9) drawTowel(c, frame, BONE.head, at, tt);
      if (f.mop) drawMop(c, f.mx, f.my, scale * 1.3, tt);
      if (f.bathStep >= 0) {
        drawFoam(c, frame, BONE.body, BONE.head, at, tt, f.foam);
        if (f.bathStep === 1) drawShower(c, at.x + 6 * scale * at.dir, Math.max(30, laneY - 170 * scale), laneY, scale, tt);
        if (f.toolOn && f.bathStep === 0) drawSoap(c, f.tx, f.ty, scale * 1.1, tt);
        if (f.toolOn && f.bathStep === 2) drawTowelAt(c, f.tx, f.ty, scale * 1.1, tt);
      }
      if (f.carry >= 0) drawCarried(c, FOOD_PICS[f.carry]!, f.tx, f.ty, scale, tt);
    }, Skia.XYWHRect(0, 0, W, H));
  }, [W, H, laneY, scale, eggX, res]);

  // ── Input: tap, stroke (mimos) and mop ──────────────────────────────────
  const offset = useRef({ x: 0, y: 0 });
  type Measurable = { measure: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void };
  const stageRef = useRef<Measurable | null>(null);
  const gesture = useRef({ sx: 0, sy: 0, lx: 0, ly: 0, moved: 0, stroke: 0, lastPet: 0, scrub: new Map<number, number>() });
  const local = (e: GestureResponderEvent) => ({ x: e.nativeEvent.pageX - offset.current.x, y: e.nativeEvent.pageY - offset.current.y });
  const overCreature = (x: number, y: number) => !!t && Math.abs(x - posX.value) < 85 * scale && y > laneY - 115 * scale && y < laneY + 12;

  const onGrant = (e: GestureResponderEvent) => {
    stageRef.current?.measure((_x, _y, _w, _h, px, py) => (offset.current = { x: px, y: py }));
    const p = local(e);
    Object.assign(gesture.current, { sx: p.x, sy: p.y, lx: p.x, ly: p.y, moved: 0, stroke: 0 });
    if (mode.kind === "mop") fx.value = { ...fx.value, mop: true, mx: p.x, my: p.y };
    if (mode.kind === "bath") fx.value = { ...fx.value, toolOn: true, tx: p.x, ty: p.y };
    if (mode.kind === "feed" && mode.food) fx.value = { ...fx.value, carry: FOOD_IDS.indexOf(mode.food), tx: p.x, ty: p.y };
  };
  const onMove = (e: GestureResponderEvent) => {
    const p = local(e);
    const gs = gesture.current;
    const d = Math.hypot(p.x - gs.lx, p.y - gs.ly);
    gs.moved += d;
    gs.lx = p.x;
    gs.ly = p.y;
    if (mode.kind === "feed") {
      fx.value = { ...fx.value, tx: p.x, ty: p.y };
      return;
    }
    if (mode.kind === "bath") {
      fx.value = { ...fx.value, toolOn: true, tx: p.x, ty: p.y };
      if (!overCreature(p.x, p.y)) return;
      const st = mode.step;
      const pr = bathProg.current;
      pr[st] = Math.min(1, pr[st]! + d / 700);
      const foam = st === 0 ? pr[0]! : st === 1 ? pr[0]! * (1 - pr[1]!) : 0;
      fx.value = { ...fx.value, foam };
      if (Math.random() < 0.15) setBathView([...pr]);
      if (pr[st]! >= 1) {
        setBathView([...pr]);
        if (st < 2) {
          setMode({ kind: "bath", step: (st + 1) as 1 | 2 });
          fx.value = { ...fx.value, bathStep: st + 1, toolOn: false };
          toast(st === 0 ? "¡Qué espuma! Ahora aclara bajo la ducha" : "¡Aclarado! Sécalo con la toalla");
        } else endBath();
      }
      return;
    }
    if (mode.kind === "mop" && g) {
      fx.value = { ...fx.value, mop: true, mx: p.x, my: p.y };
      for (const ts of state.care.poops) {
        const q = poopAt(ts);
        if (Math.hypot(p.x - q.x, p.y - q.y) > g.floorCellH * 0.9) continue;
        const v = (gs.scrub.get(ts) ?? 0) + d;
        gs.scrub.set(ts, v);
        if (v > 120) {
          gs.scrub.delete(ts);
          act((s) => mopPoop(s, ts, now()));
          toast(state.care.poops.length <= 1 ? "¡Suelo reluciente!" : "¡Una menos!");
        }
      }
      return;
    }
    // Mimos: stroke the Tamtam with your finger.
    if (mode.kind === "play" && t && overCreature(p.x, p.y)) {
      gs.stroke += d;
      const tNow = Date.now();
      if (gs.stroke > 150 && tNow - gs.lastPet > 1800) {
        gs.stroke = 0;
        gs.lastPet = tNow;
        doCare(state.care.asleep ? "wake" : "pet");
      }
    }
  };
  const onRelease = () => {
    const gs = gesture.current;
    if (mode.kind === "mop") return;
    if (mode.kind === "bath") {
      fx.value = { ...fx.value, toolOn: false };
      return;
    }
    if (mode.kind === "feed") {
      const f = fx.value;
      fx.value = { ...fx.value, carry: -1 };
      if (!mode.food || f.carry < 0) return;
      // Mouth: in front of the head, about 70 % of the body height.
      const mouthX = posX.value + dir.value * 62 * scale, mouthY = laneY - 62 * scale;
      const nearMouth = Math.hypot(f.tx - mouthX, f.ty - mouthY) < 95 * scale + 24;
      const onHead = overCreature(f.tx, f.ty) && f.ty < laneY - 45 * scale && (f.tx - posX.value) * dir.value > 0;
      if (!nearMouth && !onHead) return toast("Acércalo a su boca");
      const id = mode.food;
      const r = act((s) => feedFood(s, id, now()));
      react(r, { food: id });
      if (r === "refuse_full") {
        dir.value = -dir.value;
        setTimeout(() => (dir.value = -dir.value), 900);
      }
      if (quantity(state.economy.inventory, id) <= 1) setMode({ kind: "feed", food: null });
      return;
    }
    if (gs.moved < 12) handleTap(gs.sx, gs.sy);
  };

  const handleTap = (x: number, y: number) => {
    if (!g) return;
    if (state.phase === "egg") {
      if (Math.abs(x - eggX) > 90 * scale || y < laneY - 150 * scale) return;
      if (eggP < 1) return toast("Aún se está formando… dale unos segundos de calor.");
      if (hatching.current) return;
      hatching.current = true;
      fx.value = { ...fx.value, crack: creature.clock.value };
      setTimeout(() => {
        act((s) => hatch(s, now()));
        hatching.current = false;
        fx.value = { ...fx.value, crack: -1, egg: false };
      }, 1300);
      return;
    }
    if (!t) return;
    if (mode.kind === "play") {
      if (overCreature(x, y)) {
        if (state.care.asleep) return toast("Shhh… está durmiendo.");
        return setBubble({ text: speechFor(state, now()).text, x: posX.value });
      }
      const hit = (id: string) => {
        const p = state.room.placements.find((q) => q.itemId === id);
        if (!p) return false;
        const r = placementRect(g, p);
        return x >= r.x && x <= r.x + r.w && y >= r.y - g.floorCellH * 1.2 && y <= r.y + r.h;
      };
      if (hit("gym_dumbbells")) return startActivity("gym");
      if (hit("study_desk")) return startActivity("study");
      return;
    }
    if (mode.kind === "preview") {
      const layer = mode.item.furniture!.layer === "wall" ? "wall" : "floor";
      const cell = cellAt(g, state.room, layer, x, y);
      if (cell) setMode({ ...mode, x: cell.x, y: cell.y });
      return;
    }
    if (mode.kind !== "decor") return;
    if (mode.pendingItem) {
      const item = SLICE_CATALOG.get(mode.pendingItem)!;
      const cell = cellAt(g, state.room, item.furniture!.layer === "wall" ? "wall" : "floor", x, y);
      if (!cell) return;
      try {
        const uid = newId();
        act((s) => place(s, { uid, itemId: item.id, layer: item.furniture!.layer, x: cell.x, y: cell.y, mirrored: false, rotated: false }));
        setMode({ kind: "decor", selectedUid: uid, pendingItem: null });
      } catch (err) {
        toast(err instanceof PlacementRejected ? PLACE_ERR[err.reason] ?? "No se puede colocar ahí." : "No se puede colocar ahí.");
      }
      return;
    }
    const hitP = [...state.room.placements].reverse().find((p) => {
      const r = placementRect(g, p);
      const top = p.layer === "floor" ? r.y - g.floorCellH * 1.4 : r.y;
      return x >= r.x && x <= r.x + r.w && y >= top && y <= r.y + r.h;
    });
    if (hitP && hitP.uid !== mode.selectedUid) return setMode({ ...mode, selectedUid: hitP.uid });
    if (mode.selectedUid) {
      const sel = state.room.placements.find((p) => p.uid === mode.selectedUid)!;
      const cell = cellAt(g, state.room, sel.layer === "wall" ? "wall" : "floor", x, y);
      if (!cell) return;
      try {
        act((s) => move(s, sel.uid, cell.x, cell.y));
      } catch (err) {
        toast(err instanceof PlacementRejected ? PLACE_ERR[err.reason] ?? "No se puede mover ahí." : "No se puede mover ahí.");
      }
    }
  };

  // ── Activities inside the room (Gimnasio, Estudio) ───────────────────────
  const startActivity = (kind: "gym" | "study") => {
    if (!g) return;
    if (state.care.asleep) return toast("Está dormido. Despiértalo primero.");
    const p = state.room.placements.find((q) => q.itemId === (kind === "gym" ? "gym_dumbbells" : "study_desk"));
    setActivityClip("idle");
    setMode({ kind });
    if (p) {
      const r = placementRect(g, p);
      const cx = r.x + r.w / 2;
      const target = Math.min(g.w * 0.85, Math.max(g.w * 0.15, cx + (cx > g.w / 2 ? -1 : 1) * 70 * scale));
      walkTo(target, () => (dir.value = cx > target ? 1 : -1));
    }
  };
  const endActivity = () => {
    setActivityClip(null);
    setMode({ kind: "play" });
  };

  const startBath = () => {
    if (state.care.asleep) return toast("Está dormido. Despiértalo primero.");
    bathProg.current = [0, 0, 0];
    setBathView([0, 0, 0]);
    fx.value = { ...fx.value, bathStep: 0, foam: 0, toolOn: false };
    setMode({ kind: "bath", step: 0 });
    setActivityClip(null);
  };
  function endBath() {
    const pr = bathProg.current;
    const q = (pr[0]! + pr[1]! + pr[2]!) / 3;
    fx.value = { ...fx.value, bathStep: -1, foam: 0, toolOn: false };
    setMode({ kind: "play" });
    const r = act((s) => finishBath(s, q, now()));
    if (r.reaction !== "bathe") return react(r.reaction);
    setReaction("celebrate");
    setTimeout(() => setReaction(null), 1500);
    toast(q > 0.95 ? `¡Reluciente! +${r.pay?.coins ?? 0} Tamcoins` : q > 0.5 ? "Limpio, pero podía quedar mejor" : "Un baño rapidito…");
  }

  const startMop = () => {
    if (state.care.poops.length === 0) return toast("No hay nada que limpiar. ¡Todo reluce!");
    gesture.current.scrub.clear();
    setMode({ kind: "mop" });
  };
  const endMop = () => {
    fx.value = { ...fx.value, mop: false };
    setMode({ kind: "play" });
  };
  useEffect(() => {
    if (mode.kind === "mop" && state.care.poops.length === 0) {
      const id = setTimeout(endMop, 700);
      return () => clearTimeout(id);
    }
  });

  const confirmPreview = () => {
    if (mode.kind !== "preview") return;
    const { item, x, y, mirrored } = mode;
    try {
      act((s) => {
        buy(s, item.id, newId(), now());
        place(s, { uid: newId(), itemId: item.id, layer: item.furniture!.layer, x, y, mirrored, rotated: false });
      });
      toast(`${item.name.es} comprado y colocado`);
      setMode({ kind: "play" });
      onPreviewDone();
      creature.play("celebrate");
    } catch (e) {
      toast(e instanceof PlacementRejected ? PLACE_ERR[e.reason] ?? "No cabe ahí." : "No tienes suficientes Tamcoins.");
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setSize({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) });
    stageRef.current?.measure((_x, _y, _w, _h, px, py) => (offset.current = { x: px, y: py }));
  };
  const needs = state.care.needs;
  const pills: [string, number, string][] = [
    ["Hambre", needs.hunger, brand.orange], ["Higiene", needs.hygiene, brand.cyan], ["Felicidad", needs.happiness, brand.gold],
    ["Cariño", needs.affection, brand.pink], ["Energía", needs.energy, brand.violet], ["Actividad", needs.activity, brand.mint],
  ];
  const napLeft = napCooldownLeft(state.care, now());
  const problem = t ? peekLife(state).problem : null;
  const problemMin = problem ? Math.max(0, Math.ceil((problem.until - now()) / 60_000)) : 0;

  return (
    <View style={h.root}>
      {t && (
        <View style={h.pills}>
          {pills.map(([label, v, color]) => (
            <View key={label} style={h.pill} accessibilityLabel={`${label} ${Math.round(v)}`}>
              <View style={[h.pillFill, { width: `${Math.max(4, v)}%`, backgroundColor: color }]} />
              <Text style={h.pillText}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      <View
        ref={stageRef as never}
        style={[h.stage, NO_SELECT]}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminationRequest={() => false}
        accessibilityLabel={state.phase === "egg" ? "Habitación con tu huevo" : "Habitación"}
        testID="stage"
      >
        {roomPic && overlay && g && (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Picture picture={roomPic} />
            <Picture picture={overlay} />
            <Picture picture={dynamic} />
          </Canvas>
        )}
        {mode.kind === "mop" && <Text style={h.stageHint} pointerEvents="none">Frota con la fregona sobre la suciedad</Text>}
        {mode.kind === "feed" && <Text style={h.stageHint} pointerEvents="none">{mode.food ? "Arrastra la comida hasta su boca" : "Elige una comida abajo"}</Text>}
        {bubble && g && mode.kind === "play" && (
          <View style={[h.bubble, { left: Math.max(8, Math.min(g.w - 208, bubble.x - 100)), top: Math.max(8, laneY - 150 * scale - 40) }]} pointerEvents="none" testID="speech">
            <Text style={h.bubbleText}>{bubble.text}</Text>
          </View>
        )}
        {state.phase === "egg" && (
          <View style={h.eggHint} pointerEvents="none">
            <View style={h.track}>
              <View style={[h.fill, { width: `${Math.round(eggP * 100)}%` }]} />
            </View>
            <Text style={h.stageHint2}>{eggP < 1 ? "Tu primer huevo se está calentando en casa…" : "¡Se mueve! Tócalo para abrirlo"}</Text>
          </View>
        )}
      </View>

      {state.phase === "naming" && <NamingPanel />}

      {t && mode.kind === "play" && problem && (
        <Pressable onPress={() => setMode({ kind: "problem" })} style={({ pressed }) => [h.problem, pressed && { opacity: 0.8 }]} accessibilityRole="button" testID="problem">
          <Text style={h.problemText}>¡Ayuda! {PROBLEMS[problem.id].name} · {problemMin} min</Text>
        </Pressable>
      )}
      {mode.kind === "problem" && problem && (
        <ProblemPanel
          id={problem.id}
          minutesLeft={problemMin}
          onClose={() => setMode({ kind: "play" })}
          onSolved={(q) => {
            const r = act((s) => solveProblem(s, now(), q));
            setMode({ kind: "play" });
            setReaction("celebrate");
            setTimeout(() => setReaction(null), 1500);
            toast(`¡Solucionado! +${r.coins} Tamcoins · +${r.xp} XP`);
          }}
        />
      )}
      {mode.kind === "bath" && (
        <View style={h.panel}>
          <Text style={h.panelTitle}>
            {mode.step === 0 ? "1 · Enjabona: frota con la pastilla sobre el Tamtam" : mode.step === 1 ? "2 · Aclara: frota bajo la ducha" : "3 · Sécalo con la toalla"}
          </Text>
          <View style={h.row}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={h.bathTrack}>
                <View style={[h.bathFill, { width: `${Math.round((bathView[i] ?? 0) * 100)}%` }]} />
              </View>
            ))}
          </View>
          <Btn small label="Terminar baño" tone="coral" onPress={endBath} testID="bath-done" />
        </View>
      )}
      {mode.kind === "feed" && (
        <View style={h.panel}>
          <View style={h.row}>
            {FOOD_IDS.filter((id) => quantity(state.economy.inventory, id) > 0).map((id) => (
              <Pressable key={id} onPress={() => setMode({ kind: "feed", food: id })} style={[h.foodBtn, mode.food === id && h.foodOn]} accessibilityRole="button" accessibilityLabel={FOODS[id]!.item.name.es} testID={`feed-${id}`}>
                <FoodIcon id={id} size={40} />
                <Text style={h.foodQty}>×{quantity(state.economy.inventory, id)}</Text>
              </Pressable>
            ))}
            {FOOD_IDS.every((id) => quantity(state.economy.inventory, id) === 0) && <Text style={h.panelTitle}>No queda comida: cómprala en la Tienda.</Text>}
          </View>
          <Btn small label="Cerrar" onPress={() => setMode({ kind: "play" })} testID="feed-close" />
        </View>
      )}
      {t && mode.kind === "play" && readyToEvolve(state) && (
        <Pressable onPress={onEvolve} style={({ pressed }) => [h.evolve, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel="Evolucionar" testID="evolve">
          <Text style={h.evolveText}>✦ ¡{t.name} está listo para evolucionar! ✦</Text>
        </Pressable>
      )}
      {t && mode.kind === "play" && (
        <View style={h.panel}>
          <View style={h.row}>
            <IconAction icon="food" label="Comer" color={brand.orange} onPress={() => (state.care.asleep ? toast("Está dormido.") : setMode({ kind: "feed", food: null }))} testID="care-feed" />
            <IconAction icon="shower" label="Bañar" color={brand.cyan} onPress={startBath} testID="care-bathe" />
            <IconAction icon="mop" label="Limpiar" color={brand.mint} onPress={startMop} badge={state.care.poops.length || undefined} testID="care-clean" />
            <IconAction icon="play" label="Jugar" color={brand.gold} onPress={() => (state.care.asleep ? toast("Está dormido. Despiértalo primero.") : onOpenGames())} testID="care-play" />
            <IconAction icon="nap" label={napLeft > 0 ? `${napLeft}m` : "Siesta"} color={brand.violet} disabled={state.care.asleep || napLeft > 0} onPress={() => doCare("nap")} testID="care-nap" />
            <IconAction icon={state.care.asleep ? "sun" : "moon"} label={state.care.asleep ? "Despertar" : "Dormir"} color={brand.blue} onPress={() => doCare(state.care.asleep ? "wake" : "sleep")} testID="care-sleep" />
          </View>
          <View style={h.row}>
            <Btn small label="Gimnasio" tone="coral" icon={<Icon name="gym" size={20} color={brand.core} accent={brand.core} />} onPress={() => startActivity("gym")} style={h.flex} testID="open-gym" />
            <Btn small label="Estudio" tone="dark" icon={<Icon name="study" size={20} accent={brand.cyan} />} onPress={() => startActivity("study")} style={h.flex} testID="open-study" />
            <Btn small label="Decorar" icon={<Icon name="decor" size={20} />} onPress={() => setMode({ kind: "decor", selectedUid: null, pendingItem: null })} style={h.flex} testID="open-decor" />
          </View>
        </View>
      )}

      {mode.kind === "mop" && (
        <View style={h.panel}>
          <Text style={h.panelTitle}>Limpiando · {state.care.poops.length} por recoger</Text>
          <Btn label="Listo" tone="coral" onPress={endMop} testID="mop-done" />
        </View>
      )}

      {mode.kind === "gym" && <GymPanel onClose={endActivity} play={setActivityClip} />}
      {mode.kind === "study" && <StudyPanel onClose={endActivity} play={setActivityClip} />}

      {mode.kind === "decor" && (
        <View style={h.panel}>
          <Text style={h.panelTitle}>Decorar · toca un objeto y luego una casilla</Text>
          <View style={h.row}>
            {(["Muebles", "Paredes", "Suelo"] as const).map((tb) => (
              <Btn key={tb} small label={tb} tone={decorTab === tb ? "dark" : "light"} onPress={() => setDecorTab(tb)} style={h.flex} testID={`decor-tab-${tb}`} />
            ))}
          </View>
          {decorTab === "Muebles" ? (
            <InventoryTray selected={mode.pendingItem} onPick={(id) => setMode({ kind: "decor", selectedUid: null, pendingItem: id })} />
          ) : (
            <FinishTray
              slot={decorTab === "Paredes" ? "wall" : "floor"}
              onPick={(id) => {
                try {
                  act((s) => setFinish(s, decorTab === "Paredes" ? "wall" : "floor", id));
                } catch {
                  toast("Consíguelo en la Tienda (Paredes y suelos).");
                }
              }}
            />
          )}
          <View style={h.row}>
            <Btn small label="Girar" disabled={!mode.selectedUid} onPress={() => { try { act((s) => mirror(s, mode.selectedUid!)); } catch { toast("Ese objeto no se puede girar."); } }} style={h.flex} />
            <Btn small label="Retirar" disabled={!mode.selectedUid} onPress={() => { act((s) => unplace(s, mode.selectedUid!)); setMode({ ...mode, selectedUid: null }); }} style={h.flex} />
            <Btn small label="Listo" tone="coral" onPress={() => setMode({ kind: "play" })} style={h.flex} testID="decor-done" />
          </View>
        </View>
      )}

      {mode.kind === "preview" && (
        <View style={h.panel}>
          <Text style={h.panelTitle}>Probando: {mode.item.name.es} · toca una casilla</Text>
          <View style={h.row}>
            <Btn small label="Girar" disabled={!mode.item.furniture?.mirrorable} onPress={() => setMode({ ...mode, mirrored: !mode.mirrored })} style={h.flex} />
            <Btn small label="Descartar" onPress={() => { setMode({ kind: "play" }); onPreviewDone(); }} style={h.flex} />
          </View>
          <Btn label={`Comprar y colocar · ${mode.item.price.amount}`} tone="gold" onPress={confirmPreview} testID="preview-buy" />
        </View>
      )}

      {food && (
        <FoodSheet
          onClose={() => setFood(false)}
          onFeed={(id) => {
            setFood(false);
            const go = () => react(act((s) => feedFood(s, id, now())), { food: id });
            if (g && Math.abs(posX.value - g.w * 0.5) > g.w * 0.3) walkTo(g.w * 0.5, go);
            else go();
          }}
        />
      )}
    </View>
  );
}

const h = StyleSheet.create({
  root: { flex: 1 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 4, paddingHorizontal: 12, paddingTop: 6 },
  pill: { width: "32.4%", height: 22, borderRadius: 11, backgroundColor: brand.panel, overflow: "hidden", justifyContent: "center" },
  pillFill: { ...StyleSheet.absoluteFill, right: undefined, opacity: 0.85 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: brand.cloud, paddingLeft: 8, textShadowColor: "rgba(10,7,24,0.7)", textShadowRadius: 3 },
  stage: { flex: 1, marginHorizontal: 10, marginVertical: 8, borderRadius: 24, overflow: "hidden", backgroundColor: brand.panel, borderWidth: 1.5, borderColor: brand.line },
  stageHint: { position: "absolute", top: 10, alignSelf: "center", backgroundColor: "rgba(23,19,43,0.8)", color: brand.cloud, fontFamily: fonts.bodyBold, fontSize: 13, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: "hidden" },
  eggHint: { position: "absolute", top: 12, left: 24, right: 24, gap: 6, alignItems: "center" },
  stageHint2: { color: brand.cloud, fontFamily: fonts.bodyBold, fontSize: 14, textAlign: "center", textShadowColor: "#000", textShadowRadius: 4 },
  track: { height: 10, alignSelf: "stretch", borderRadius: 5, backgroundColor: "rgba(23,19,43,0.7)", overflow: "hidden" },
  fill: { height: 10, backgroundColor: brand.cyan, borderRadius: 5 },
  problem: { marginHorizontal: 12, marginBottom: 6, borderRadius: 16, paddingVertical: 10, backgroundColor: "#5A1E3A", borderWidth: 2, borderColor: brand.pink, alignItems: "center" },
  problemText: { fontFamily: fonts.displayBold, fontSize: 15, color: brand.cloud },
  bubble: { position: "absolute", width: 200, backgroundColor: brand.cloud, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: brand.violet },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 13, color: brand.core, textAlign: "center" },
  bathTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: brand.panel, overflow: "hidden" },
  bathFill: { height: 10, borderRadius: 5, backgroundColor: brand.cyan },
  foodBtn: { width: 62, height: 66, borderRadius: 14, backgroundColor: brand.panelHi, borderWidth: 2, borderColor: brand.line, alignItems: "center", justifyContent: "center" },
  foodOn: { borderColor: brand.cyan },
  foodQty: { fontFamily: fonts.bodyBold, fontSize: 11, color: brand.cloud },
  evolve: { marginHorizontal: 12, marginBottom: 6, borderRadius: 16, paddingVertical: 10, backgroundColor: brand.violet, borderWidth: 2, borderColor: brand.cyan, alignItems: "center" },
  evolveText: { fontFamily: fonts.displayBold, fontSize: 16, color: brand.cloud },
  panel: { paddingHorizontal: 12, paddingBottom: 6, gap: 6 },
  panelTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, textAlign: "center" },
  row: { flexDirection: "row", gap: 6 },
  flex: { flex: 1 },
});
