import { Canvas, createPicture, PaintStyle, Picture, Skia } from "@shopify/react-native-skia";
import type { ChispinClipId } from "@tamtam/art";
import {
  buy, careAction, checkPlacement, cloneData, feedFood, lustre, mirror, mood, move, napCooldownLeft, place, PlacementRejected, PurchaseError, SLICE_CATALOG, unplace,
  type CareReaction, type CareKind, type CatalogItem, type Placement,
} from "@tamtam/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { Easing, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { composeLook } from "../creature/look";
import { drawTamtam, useCreature } from "../creature/useCreature";
import { newId, useGame } from "../game/GameProvider";
import { buildRoomPicture, cellAt, drawFurniture, placementRect, roomGeom } from "../home/roomArt";
import { brand, colors, fonts } from "../theme";
import { Btn, Coin, Toast } from "../ui/kit";
import { DebugPanel } from "./DebugPanel";
import { GymScreen } from "./GymScreen";
import { LustreLab } from "./LustreLab";
import { FoodSheet, HistorySheet, InventoryTray, ProfileSheet, ShopSheet } from "./sheets";

const REACTION: Record<CareReaction, { clip: ChispinClipId; ms: number; text: string | null }> = {
  eat: { clip: "eat", ms: 2200, text: "¡Ñam!" },
  eat_favorite: { clip: "eat", ms: 2600, text: "¡Su comida favorita!" },
  refuse_full: { clip: "angry", ms: 1400, text: "Está lleno: no quiere más." },
  dislike: { clip: "angry", ms: 1600, text: "¡Puaj! No le gusta la comida fría." },
  bathe: { clip: "bathe", ms: 2400, text: "¡Qué limpio!" },
  clean: { clip: "celebrate", ms: 1100, text: "Todo limpio." },
  pet: { clip: "pet", ms: 2600, text: null },
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

type Mode = { kind: "play" } | { kind: "decor"; selectedUid: string | null; pendingItem: string | null } | { kind: "preview"; item: CatalogItem; x: number; y: number; mirrored: boolean };

export function HomeScreen() {
  const game = useGame();
  const { state, act, now } = game;
  const t = state.tamtam!;
  // Lustre: how polished the Tamtam looks right now (recomputed every tick; the look only changes with the tier).
  const liveTier = lustre(state.care, t).tier;
  const formTier = t.stage === "baby" ? liveTier : t.formQuality ?? liveTier;
  const look = useMemo(() => composeLook(formTier, liveTier), [formTier, liveTier]);
  const creature = useCreature(state.alleleId, look);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [sheet, setSheet] = useState<null | "food" | "shop" | "profile" | "history" | "debug">(null);
  const [gym, setGym] = useState(false);
  const [lab, setLab] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "play" });
  const [toastText, setToastText] = useState<string | null>(null);
  const [reaction, setReaction] = useState<ChispinClipId | null>(null);
  const [walking, setWalking] = useState(false);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posX = useSharedValue(0);
  const dir = useSharedValue(1);
  const vx = useSharedValue(0);

  const toast = (text: string) => {
    setToastText(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(null), 2200);
  };

  const g = useMemo(() => (size.w ? roomGeom(size.w, size.h, state.room) : null), [size, state.room]);
  const laneY = g ? g.floorTop + g.floorCellH * 3.55 : 0;
  const scale = g ? (g.floorCellH * 1.9) / 128 : 1;

  useEffect(() => {
    if (g && posX.value === 0) posX.value = g.w * 0.5;
  }, [g, posX]);

  // Which animation should play: reaction > walking > mood.
  const m = mood(state.care, now());
  const base: ChispinClipId = m === "asleep" || m === "napping" ? "sleep" : m === "hungry" ? "hungry" : m === "sad" || m === "tired" || m === "dirty" ? "sad" : "idle";
  const clip: ChispinClipId = reaction ?? (walking ? "walk" : base);
  useEffect(() => {
    creature.play(clip);
  }, [clip, creature.play]);

  // Wandering: when idle and happy enough, walk somewhere now and then.
  useEffect(() => {
    if (!g) return;
    const id = setInterval(() => {
      if (reaction || walking || base !== "idle" || mode.kind !== "play" || gym || Math.random() < 0.4) return;
      const target = g.w * (0.15 + Math.random() * 0.7);
      const dist = Math.abs(target - posX.value);
      if (dist < 30) return;
      dir.value = target > posX.value ? 1 : -1;
      vx.value = 46;
      setWalking(true);
      posX.value = withTiming(target, { duration: (dist / (46 * scale)) * 1000, easing: Easing.linear }, () => {
        vx.value = 0;
        scheduleOnRN(setWalking, false);
      });
    }, 4500);
    return () => clearInterval(id);
  }, [g, reaction, walking, base, mode.kind, gym, scale, posX, dir, vx]);

  const react = (r: CareReaction) => {
    const def = REACTION[r];
    if (def.text) toast(def.text);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    if (def.ms > 0) {
      setReaction(def.clip);
      reactionTimer.current = setTimeout(() => setReaction(null), def.ms);
    } else {
      setReaction(null);
    }
  };

  const doCare = (kind: CareKind) => react(act((s) => careAction(s, kind, now())));

  // ── Rendering ─────────────────────────────────────────────────────────────
  const hour = new Date(now()).getHours();
  const night = hour >= 21 || hour < 7;
  const roomPic = useMemo(() => (g ? buildRoomPicture(state.room, g, { night, lightsOn: state.lightsOn }) : null), [g, state.room, night, state.lightsOn]);

  // Overlay: decor grid, selection, preview ghost, poops (JS-built, cheap).
  const overlay = useMemo(() => {
    if (!g) return null;
    return createPicture((c) => {
      const p = Skia.Paint();
      p.setAntiAlias(true);
      // Poops (cartoon swirl) on the front lane.
      state.care.poops.forEach((_, i) => {
        const x = g.w * (0.2 + i * 0.22);
        const y = g.floorBottom - g.floorCellH * 0.35;
        const s = g.floorCellH * 0.28;
        p.setColor(Skia.Color("#8A5A3C"));
        c.drawOval(Skia.XYWHRect(x - s, y - s * 0.5, s * 2, s), p);
        c.drawOval(Skia.XYWHRect(x - s * 0.7, y - s, s * 1.4, s * 0.8), p);
        c.drawOval(Skia.XYWHRect(x - s * 0.4, y - s * 1.4, s * 0.8, s * 0.6), p);
        p.setColor(Skia.Color("#FFFFFF"));
        c.drawCircle(x - s * 0.2, y - s * 0.7, s * 0.12, p);
        c.drawCircle(x + s * 0.2, y - s * 0.7, s * 0.12, p);
      });
      if (mode.kind === "play") return;
      // Grid.
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
  }, [g, state.care.poops, state.room, state.economy.inventory, mode]);

  const { res, clock, playback, emitters } = creature;
  const dynamic = useDerivedValue(() => {
    const tt = clock.value;
    return createPicture((c) => {
      if (!g) return;
      drawTamtam(c, res, playback.value, emitters.value, tt, { x: posX.value, y: laneY, scale, dir: dir.value }, vx.value);
    }, Skia.XYWHRect(0, 0, Math.max(1, size.w), Math.max(1, size.h)));
  });

  // ── Input ─────────────────────────────────────────────────────────────────
  type Measurable = { measure: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void };
  const stageRef = useRef<Measurable | null>(null);
  // Page coordinates → stage coordinates (locationX is unreliable on react-native-web).
  const onStagePress = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    stageRef.current?.measure((_x, _y, _w, _h, px, py) => handleStageTap(pageX - px, pageY - py));
  };
  const handleStageTap = (x: number, y: number) => {
    if (!g) return;
    if (mode.kind === "play") {
      // Poop?
      const pi = state.care.poops.findIndex((_, i) => Math.hypot(x - g.w * (0.2 + i * 0.22), y - (g.floorBottom - g.floorCellH * 0.4)) < g.floorCellH * 0.6);
      if (pi >= 0) return doCare("clean");
      // Creature?
      if (Math.abs(x - posX.value) < 60 * scale && y > laneY - 130 * scale && y < laneY + 10) return doCare(state.care.asleep ? "wake" : "pet");
      // Dumbbells → gym.
      const gymP = state.room.placements.find((p) => p.itemId === "gym_dumbbells");
      if (gymP) {
        const r = placementRect(g, gymP);
        if (x >= r.x && x <= r.x + r.w && y >= r.y - g.floorCellH && y <= r.y + r.h) return setGym(true);
      }
      return;
    }
    if (mode.kind === "preview") {
      const layer = mode.item.furniture!.layer === "wall" ? "wall" : "floor";
      const cell = cellAt(g, state.room, layer, x, y);
      if (cell) setMode({ ...mode, x: cell.x, y: cell.y });
      return;
    }
    // Decor mode.
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
    // Select an item under the finger (front-most first).
    const hit = [...state.room.placements].reverse().find((p) => {
      const r = placementRect(g, p);
      const top = p.layer === "floor" ? r.y - g.floorCellH * 1.4 : r.y;
      return x >= r.x && x <= r.x + r.w && y >= top && y <= r.y + r.h;
    });
    if (hit && hit.uid !== mode.selectedUid) return setMode({ ...mode, selectedUid: hit.uid });
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

  const onBuy = (item: CatalogItem) => {
    try {
      act((s) => buy(s, item.id, newId(), now()));
      toast(`Has comprado: ${item.name.es}`);
    } catch (e) {
      toast(e instanceof PurchaseError ? "No puedes comprarlo ahora." : "Error en la compra.");
    }
  };

  const confirmPreview = () => {
    if (mode.kind !== "preview") return;
    const { item, x, y, mirrored } = mode;
    try {
      // Buy and place in ONE transaction: either both happen or neither.
      act((s) => {
        buy(s, item.id, newId(), now());
        place(s, { uid: newId(), itemId: item.id, layer: item.furniture!.layer, x, y, mirrored, rotated: false });
      });
      toast(`${item.name.es} comprado y colocado`);
      setMode({ kind: "play" });
      creature.play("celebrate");
    } catch (e) {
      toast(e instanceof PlacementRejected ? PLACE_ERR[e.reason] ?? "No cabe ahí." : e instanceof PurchaseError ? "No tienes suficientes Tamcoins." : "No se pudo completar.");
    }
  };

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) });
  const needs = state.care.needs;
  const pills: [string, number, string][] = [
    ["Hambre", needs.hunger, brand.orange], ["Higiene", needs.hygiene, brand.cyan], ["Felicidad", needs.happiness, brand.gold],
    ["Cariño", needs.affection, brand.pink], ["Energía", needs.energy, brand.violet], ["Actividad", needs.activity, brand.mint],
  ];

  return (
    <SafeAreaView style={h.root} edges={["top", "bottom"]}>
      {game.profile === "debug" && <Text style={h.debugBanner}>MODO DEBUG · partida de pruebas · reloj simulado</Text>}
      <View style={h.top}>
        <Pressable style={h.ribbon} onPress={() => setSheet("profile")} accessibilityRole="button" accessibilityLabel={`Ficha de ${t.name}`}>
          <Text style={h.name} numberOfLines={1}>{t.name}</Text>
          <Text style={h.sub}>Chispín · Bebé · Nv {t.level}</Text>
        </Pressable>
        <Pressable style={h.wallet} onPress={() => setSheet("history")} accessibilityRole="button" accessibilityLabel={`${state.economy.wallet.balances.tamcoin} Tamcoins, ver historial`}>
          <Coin />
          <Text style={h.coins}>{state.economy.wallet.balances.tamcoin}</Text>
        </Pressable>
        <Btn label="DEV" small tone="dark" onPress={() => setSheet("debug")} testID="dev" />
      </View>
      <View style={h.pills}>
        {pills.map(([label, v, color]) => (
          <View key={label} style={h.pill} accessibilityLabel={`${label} ${Math.round(v)}`}>
            <View style={[h.pillFill, { width: `${Math.max(4, v)}%`, backgroundColor: color }]} />
            <Text style={h.pillText}>{label}</Text>
          </View>
        ))}
      </View>

      <Pressable ref={stageRef as never} style={h.stage} onLayout={onLayout} onPress={onStagePress} accessibilityLabel="Habitación">
        {roomPic && overlay && g && (
          <Canvas style={StyleSheet.absoluteFill}>
            <Picture picture={roomPic} />
            <Picture picture={overlay} />
            <Picture picture={dynamic} />
          </Canvas>
        )}
      </Pressable>

      {mode.kind === "play" && (
        <View style={h.panel}>
          <View style={h.row}>
            <Btn small label="Comer" onPress={() => setSheet("food")} style={h.flex} testID="care-feed" />
            <Btn small label="Bañar" onPress={() => doCare("bathe")} style={h.flex} testID="care-bathe" />
            <Btn small label="Limpiar" onPress={() => doCare("clean")} style={h.flex} testID="care-clean" />
            <Btn small label="Mimos" onPress={() => doCare("pet")} style={h.flex} testID="care-pet" />
          </View>
          <View style={h.row}>
            <Btn small label="Jugar" onPress={() => doCare("play")} style={h.flex} testID="care-play" />
            <Btn
              small
              label={napCooldownLeft(state.care, now()) > 0 ? `Siesta ${napCooldownLeft(state.care, now())}m` : "Siesta"}
              disabled={state.care.asleep || napCooldownLeft(state.care, now()) > 0}
              onPress={() => doCare("nap")}
              style={h.flex}
              testID="care-nap"
            />
            <Btn small label={state.care.asleep ? "Despertar" : "Dormir"} onPress={() => doCare(state.care.asleep ? "wake" : "sleep")} style={h.flex} testID="care-sleep" />
          </View>
          <View style={h.row}>
            <Btn label="Tienda" tone="gold" onPress={() => setSheet("shop")} style={h.flex} testID="open-shop" />
            <Btn label="Decorar" tone="light" onPress={() => setMode({ kind: "decor", selectedUid: null, pendingItem: null })} style={h.flex} testID="open-decor" />
            <Btn label="Gimnasio" tone="coral" onPress={() => setGym(true)} style={h.flex} testID="open-gym" />
          </View>
        </View>
      )}

      {mode.kind === "decor" && (
        <View style={h.panel}>
          <Text style={h.panelTitle}>Decorar · toca un objeto y luego una casilla</Text>
          <InventoryTray selected={mode.pendingItem} onPick={(id) => setMode({ kind: "decor", selectedUid: null, pendingItem: id })} />
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
            <Btn small label="Descartar" onPress={() => setMode({ kind: "play" })} style={h.flex} />
          </View>
          <Btn label={`Comprar y colocar · ${mode.item.price.amount}`} tone="gold" onPress={confirmPreview} testID="preview-buy" />
        </View>
      )}

      {sheet === "food" && (
        <FoodSheet
          onClose={() => setSheet(null)}
          onFeed={(id) => {
            setSheet(null);
            react(act((s) => feedFood(s, id, now())));
          }}
        />
      )}
      {sheet === "shop" && (
        <ShopSheet
          onClose={() => setSheet(null)}
          onBuy={onBuy}
          onPreview={(item) => {
            setSheet(null);
            setMode({ kind: "preview", item, x: item.furniture!.layer === "wall" ? 8 : 6, y: item.furniture!.layer === "wall" ? 1 : 1, mirrored: false });
          }}
        />
      )}
      {sheet === "profile" && <ProfileSheet onClose={() => setSheet(null)} />}
      {sheet === "history" && <HistorySheet onClose={() => setSheet(null)} />}
      {sheet === "debug" && <DebugPanel onClose={() => setSheet(null)} toast={toast} onLustreLab={() => { setSheet(null); setLab(true); }} />}
      {lab && <LustreLab alleleId={state.alleleId} onClose={() => setLab(false)} />}
      {gym && <GymScreen onClose={() => setGym(false)} />}
      <Toast text={toastText} />
    </SafeAreaView>
  );
}

const h = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  debugBanner: { backgroundColor: brand.violet, color: brand.cloud, textAlign: "center", fontFamily: fonts.bodyBold, fontSize: 11, paddingVertical: 3 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 6 },
  ribbon: { flex: 1, backgroundColor: brand.violet, borderRadius: 18, borderWidth: 1.5, borderBottomWidth: 4, borderColor: "#6E2BD6", paddingHorizontal: 14, paddingVertical: 4 },
  name: { fontFamily: fonts.displayBold, fontSize: 24, color: brand.cloud, lineHeight: 30 },
  sub: { fontFamily: fonts.body, fontSize: 11, color: "#E6DCFF", marginTop: -4 },
  wallet: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1.5, borderBottomWidth: 4, borderColor: colors.line, paddingHorizontal: 12, height: 48 },
  coins: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, fontVariant: ["tabular-nums"] },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 4, paddingHorizontal: 12, paddingTop: 8 },
  pill: { width: "32.4%", height: 22, borderRadius: 11, backgroundColor: brand.panel, overflow: "hidden", justifyContent: "center" },
  pillFill: { ...StyleSheet.absoluteFill, right: undefined, opacity: 0.85 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: brand.cloud, paddingLeft: 8, textShadowColor: "rgba(10,7,24,0.7)", textShadowRadius: 3 },
  stage: { flex: 1, margin: 10, borderRadius: 24, overflow: "hidden", backgroundColor: brand.panel, borderWidth: 1.5, borderColor: brand.line },
  panel: { paddingHorizontal: 12, paddingBottom: 6, gap: 6 },
  panelTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, textAlign: "center" },
  row: { flexDirection: "row", gap: 6 },
  flex: { flex: 1 },
});
