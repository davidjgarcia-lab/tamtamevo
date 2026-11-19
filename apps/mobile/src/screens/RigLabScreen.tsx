import { Canvas, Picture, createPicture, Skia } from "@shopify/react-native-skia";
import { chispinClips, chispinEmitters, chispinRig, fireColorAlleles, type ChispinClipId } from "@tamtam/art";
import { compileClip, compileRig, derivePalette, evaluateFrame, evalEmitter, switchClip, type EmitterDef, type PlaybackState } from "@tamtam/rig";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { useDerivedValue, useFrameCallback, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { drawCreature, drawParticles, type ActiveEmitters } from "../creature/draw";
import { buildResources } from "../creature/resources";
import { buildFireHabitat } from "../scene/fireHabitat";
import { colors, fonts } from "../theme";

/**
 * Phase 2 spike — "Rig Lab": Chispín living in the fire habitat.
 * Verifies the TamRig runtime (keyed clips + cross-fades + procedural layers +
 * particles + runtime genetic tinting) running on the UI thread.
 */

const rig = compileRig(chispinRig);
const clips = chispinClips.map((c) => compileClip(rig, c));
const clipIndex = (id: ChispinClipId) => clips.findIndex((c) => c.id === id);
const allEmitters: EmitterDef[] = Object.values(chispinEmitters).flat();
const SEED = 7;
const WALK_SPEED = 46; // creature units per second
const PET_DURATION_MS = 3200;

const AMBIENT: EmitterDef = {
  id: "ambient",
  shape: "ember",
  rate: 3,
  life: 6,
  x: 0.5,
  y: 1.02,
  spread: 0.5,
  vx: [-0.02, 0.02],
  vy: [-0.2, -0.1],
  gravity: 0,
  size: [0.0035, 0.007],
  wobble: 0.015,
  color: "#FFB15C",
};

const ACTIONS: { id: ChispinClipId; label: string }[] = [
  { id: "idle", label: "Reposo" },
  { id: "walk", label: "Caminar" },
  { id: "run", label: "Correr" },
  { id: "eat", label: "Comer" },
  { id: "pet", label: "Caricia" },
  { id: "sleep", label: "Dormir" },
  { id: "celebrate", label: "Saltar" },
  { id: "train", label: "Entrenar" },
  { id: "bathe", label: "Bañarse" },
  { id: "angry", label: "Enfado" },
  { id: "attack", label: "Atacar" },
];

export function RigLabScreen() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [clipId, setClipId] = useState<ChispinClipId>("idle");
  const [alleleId, setAlleleId] = useState(fireColorAlleles[0]!.id);
  const [fps, setFps] = useState(0);
  const petTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const palette = useMemo(() => derivePalette(fireColorAlleles.find((a) => a.id === alleleId)!.genes), [alleleId]);
  const res = useMemo(() => buildResources(rig, palette, allEmitters), [palette]);

  const groundY = size.h * 0.8;
  const scale = size.h > 0 ? Math.min((size.h * 0.4) / 100, size.w / 230) : 1;
  const background = useMemo(
    () => (size.w > 0 ? buildFireHabitat(size.w, size.h, groundY) : null),
    [size.w, size.h, groundY],
  );

  // UI-thread state.
  const clock = useSharedValue(0);
  const playback = useSharedValue<PlaybackState>({ clip: clipIndex("idle"), start: 0, prevClip: -1, prevStart: 0 });
  const emitters = useSharedValue<ActiveEmitters[]>([{ defs: chispinEmitters.idle, from: 0, until: Infinity }]);
  const posX = useSharedValue(0);
  const dir = useSharedValue(1);
  const vx = useSharedValue(0);
  const fpsAcc = useSharedValue({ frames: 0, since: 0 });
  const bounds = useSharedValue({ w: 0, scale: 1 });

  useEffect(() => {
    bounds.value = { w: size.w, scale };
    if (posX.value === 0) posX.value = size.w / 2;
  }, [size.w, scale, bounds, posX]);

  useFrameCallback((info) => {
    const now = info.timestamp / 1000;
    const dt = info.timeSincePreviousFrame ? info.timeSincePreviousFrame / 1000 : 0;
    clock.value = now;

    const walking = playback.value.clip === clipIndex("walk");
    const speed = walking ? WALK_SPEED * bounds.value.scale : 0;
    if (walking && bounds.value.w > 0) {
      const margin = 70 * bounds.value.scale;
      let x = posX.value + dir.value * speed * dt;
      if (x > bounds.value.w - margin) {
        x = bounds.value.w - margin;
        dir.value = -1;
      } else if (x < margin) {
        x = margin;
        dir.value = 1;
      }
      posX.value = x;
    }
    vx.value = walking ? WALK_SPEED : 0;

    const acc = fpsAcc.value;
    const frames = acc.frames + 1;
    if (now - acc.since >= 0.5) {
      scheduleOnRN(setFps, Math.round(frames / (now - acc.since)));
      fpsAcc.value = { frames: 0, since: now };
    } else {
      fpsAcc.value = { frames, since: acc.since };
    }
  });

  const play = useCallback(
    (id: ChispinClipId) => {
      const now = clock.value;
      const next = switchClip(playback.value, clipIndex(id), now);
      if (next === playback.value) return;
      const prevDefs = chispinEmitters[clips[playback.value.clip]!.id as ChispinClipId];
      emitters.value = [
        { defs: prevDefs, from: playback.value.start, until: now },
        { defs: chispinEmitters[id], from: now, until: Infinity },
      ];
      playback.value = next;
      setClipId(id);
    },
    [clock, playback, emitters],
  );

  const pet = useCallback(() => {
    if (petTimer.current) clearTimeout(petTimer.current);
    const back = clipId === "pet" ? "idle" : clipId;
    play("pet");
    petTimer.current = setTimeout(() => play(back === "sleep" ? "idle" : back), PET_DURATION_MS);
  }, [clipId, play]);

  useEffect(() => () => void (petTimer.current && clearTimeout(petTimer.current)), []);

  const picture = useDerivedValue(() => {
    const t = clock.value;
    const w = bounds.value.w;
    return createPicture((canvas) => {
      if (w <= 0) return;
      const h = size.h;
      // Ambient embers rising through the cave (scene space, normalised to width).
      const amb = evalEmitter(AMBIENT, t, 0, Infinity, 3);
      const p = res.particlePaints["embers:glow"];
      if (p) {
        for (let i = 0; i < amb.length; i++) {
          const a = amb[i]!;
          const q = p.copy();
          q.setAlphaf(a.alpha * 0.8);
          canvas.drawCircle(a.x * w, a.y * h, a.size * w, q);
        }
      }
      const frame = evaluateFrame(rig, clips, playback.value, { time: t, vx: vx.value, seed: SEED });
      const at = { x: posX.value, y: groundY, scale: bounds.value.scale, dir: dir.value };
      drawParticles(canvas, res, emitters.value, t, at, SEED, true);
      drawCreature(canvas, res, frame, at);
      drawParticles(canvas, res, emitters.value, t, at, SEED, false);
    }, Skia.XYWHRect(0, 0, Math.max(1, w), Math.max(1, size.h)));
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.round(width), h: Math.round(height) });
  };

  const onStagePress = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - posX.value;
    const dy = locationY - (groundY - 55 * scale);
    if (Math.hypot(dx, dy) < 75 * scale) pet();
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Fase 2 · Spike de animación</Text>
          <Text style={styles.title}>Chispín</Text>
        </View>
        <View style={styles.fps} accessibilityLabel={`${fps} fotogramas por segundo`}>
          <Text style={styles.fpsValue}>{fps}</Text>
          <Text style={styles.fpsLabel}>FPS</Text>
        </View>
      </View>

      <Pressable style={styles.stage} onLayout={onLayout} onPress={onStagePress} accessibilityRole="button" accessibilityLabel="Acariciar a Chispín">
        {background && size.w > 0 ? (
          <Canvas style={StyleSheet.absoluteFill}>
            <Picture picture={background} />
            <Picture picture={picture} />
          </Canvas>
        ) : null}
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>Toca a Chispín para acariciarlo</Text>
        </View>
      </Pressable>

      <View style={styles.panel}>
        <Text style={styles.section}>Animación</Text>
        <View style={styles.row}>
          {ACTIONS.map((a) => {
            const active = a.id === clipId;
            return (
              <Pressable
                key={a.id}
                onPress={() => {
                  if (a.id === "pet") return pet();
                  if (petTimer.current) clearTimeout(petTimer.current);
                  play(a.id);
                }}
                style={({ pressed }) => [styles.action, active && styles.actionActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.actionText, active && styles.actionTextActive]}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.section}>Color genético (alelo base)</Text>
        <View style={styles.row}>
          {fireColorAlleles.map((a) => {
            const active = a.id === alleleId;
            return (
              <Pressable
                key={a.id}
                onPress={() => setAlleleId(a.id)}
                style={({ pressed }) => [styles.allele, active && styles.alleleActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${a.name}, ${a.rank === "D" ? "dominante" : a.rank === "I" ? "intermedio" : "recesivo"}`}
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.swatch, { backgroundColor: a.genes.base }]}>
                  <View style={[styles.swatchAccent, { backgroundColor: a.genes.accent }]} />
                </View>
                <Text style={styles.alleleText} numberOfLines={1}>
                  {a.name}
                </Text>
                <Text style={styles.rank}>{a.rank}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  kicker: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, letterSpacing: 0.4, textTransform: "uppercase" },
  title: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.ink, marginTop: -2 },
  fps: { backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, alignItems: "center", minWidth: 56 },
  fpsValue: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream, fontVariant: ["tabular-nums"] },
  fpsLabel: { fontFamily: fonts.body, fontSize: 10, color: "#C9BFD6", marginTop: -3 },
  stage: { flex: 1, marginHorizontal: 12, borderRadius: 24, overflow: "hidden", backgroundColor: "#2A0E1E" },
  hint: { position: "absolute", top: 14, alignSelf: "center", backgroundColor: "rgba(26,8,17,0.55)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  hintText: { fontFamily: fonts.body, fontSize: 13, color: "#FFE3C7" },
  panel: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 8 },
  section: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  action: {
    flexBasis: "22%",
    flexGrow: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
    borderBottomWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  actionActive: { backgroundColor: colors.coral, borderColor: colors.coralDark },
  actionText: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  actionTextActive: { color: "#FFFFFF" },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 3 },
  allele: { flex: 1, minHeight: 72, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center", paddingVertical: 6, gap: 3 },
  alleleActive: { borderColor: colors.ink },
  swatch: { width: 28, height: 28, borderRadius: 14, overflow: "hidden", justifyContent: "flex-end", alignItems: "center" },
  swatchAccent: { width: 28, height: 10 },
  alleleText: { fontFamily: fonts.body, fontSize: 10.5, color: colors.ink, paddingHorizontal: 2 },
  rank: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft },
});
