import { completeGymSession, GYM, UPGRADES, upgradeGym, type GymResult } from "@tamtam/core";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { ChispinClipId } from "@tamtam/art";
import { newId, useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn, Coin } from "../ui/kit";

type Phase = "intro" | "playing" | "result";

/** Gym activity inside the room (ACTIVITIES_SYSTEM §2.A): hold to charge, release inside the green zone. */
export function GymPanel({ onClose, play }: { onClose: () => void; play: (clip: ChispinClipId) => void }) {
  const { state, act, now, tzOffsetMin } = useGame();
  const creature = { play };
  const level = state.economy.activityLevels.gym;
  const reps = GYM.reps[level] ?? 5;
  const [phase, setPhase] = useState<Phase>("intro");
  const [rep, setRep] = useState(0);
  const [hits, setHits] = useState(0);
  const [charge, setCharge] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [result, setResult] = useState<GymResult | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const chargeRef = useRef(0);
  const holding = useRef<{ start: number; id: ReturnType<typeof setInterval> } | null>(null);
  const runId = useRef(newId());

  // Green zone shrinks with each repetition (fatigue).
  const zoneW = Math.max(0.1, 0.26 - rep * 0.025);
  const zoneC = 0.72;

  useEffect(() => () => {
    if (holding.current) clearInterval(holding.current.id);
  }, []);


  const start = () => {
    const cost = GYM.energyCostByLevel[level] ?? GYM.energyCost;
    if (state.care.needs.energy < cost || state.care.asleep) {
      setMsg(state.care.asleep ? "Está dormido. Despiértalo primero." : `Necesita ${cost} de energía (tiene ${Math.round(state.care.needs.energy)}). Una siesta de 20 minutos o un guiso de fuerza le ayudan.`);
      creature.play("sad");
      return;
    }
    runId.current = newId();
    setRep(0);
    setHits(0);
    setPhase("playing");
    creature.play("idle");
  };

  const pressIn = () => {
    if (phase !== "playing" || holding.current) return;
    const startT = Date.now();
    const id = setInterval(() => {
      const e = ((Date.now() - startT) / 1100) % 2;
      const v = e <= 1 ? e : 2 - e; // ping-pong 0→1→0
      chargeRef.current = v;
      setCharge(v);
    }, 16);
    holding.current = { start: startT, id };
    creature.play("train");
  };

  const pressOut = () => {
    if (!holding.current) return;
    clearInterval(holding.current.id);
    holding.current = null;
    const value = chargeRef.current;
    const ok = Math.abs(value - zoneC) <= zoneW / 2;
    const nextHits = hits + (ok ? 1 : 0);
    setHits(nextHits);
    setFeedback(ok ? "¡Perfecto!" : value < zoneC ? "Poca fuerza…" : "¡Demasiado!");
    setTimeout(() => setFeedback(null), 700);
    const nextRep = rep + 1;
    setRep(nextRep);
    setCharge(0);
    if (nextRep >= reps) {
      const quality = 0.5 + nextHits / reps;
      const r = act((s) => completeGymSession(s, { runId: runId.current, quality, now: now(), tzOffsetMin }));
      setResult(r);
      setPhase("result");
      creature.play(r.ok ? "celebrate" : "sad");
    } else {
      setTimeout(() => creature.play("idle"), 600);
    }
  };

  const nextUpgrade = UPGRADES.find((u) => u.activity === "gym" && u.toLevel === level + 1);
  const upgrade = () => {
    try {
      const lv = act((s) => upgradeGym(s, newId(), now()));
      setMsg(`¡Gym mejorado a nivel ${lv}: ${GYM.levelNames[lv]}!`);
      creature.play("celebrate");
    } catch (e) {
      const code = (e as Error).message;
      setMsg(
        code.includes("attribute_too_low") ? `Necesita Fuerza nivel ${nextUpgrade?.attributeLevel}.`
          : code.includes("insufficient_funds") ? `Necesitas ${nextUpgrade?.cost} Tamcoins.`
          : code.includes("missing_materials") ? "Faltan materiales (6 de metal)."
          : "No se puede mejorar ahora.",
      );
    }
  };

  return (
    <View style={g.root}>
      <View style={g.head}>
        <View style={{ flex: 1 }}>
          <Text style={g.kicker}>Gimnasio · Nivel {level} · Energía {Math.round(state.care.needs.energy)} · Fuerza nv. {state.tamtam?.attributes.str.level ?? 0}</Text>
          <Text style={g.title}>{GYM.levelNames[level]}</Text>
        </View>
        <Btn label="Salir" small onPress={onClose} testID="gym-exit" />
      </View>
      {feedback && <Text style={g.feedback}>{feedback}</Text>}

      {phase === "intro" && (
        <View style={g.panel}>
          <Text style={g.body}>
            Mantén pulsado para cargar y suelta cuando la barra esté en la zona verde. {reps} repeticiones. Cuesta {GYM.energyCostByLevel[level] ?? GYM.energyCost} de energía.
          </Text>
          {msg && <Text style={g.msg}>{msg}</Text>}
          <Btn label="Empezar entrenamiento" tone="coral" onPress={start} testID="gym-start" />
          {nextUpgrade ? (
            <Btn label={`Mejorar a ${GYM.levelNames[nextUpgrade.toLevel]} · ${nextUpgrade.cost} TC · Fuerza ${nextUpgrade.attributeLevel}`} small onPress={upgrade} />
          ) : (
            <Text style={g.body}>Gym al nivel máximo.</Text>
          )}
        </View>
      )}

      {phase === "playing" && (
        <View style={g.panel}>
          <Text style={g.body}>
            Repetición {Math.min(rep + 1, reps)} de {reps} · aciertos {hits}
          </Text>
          <View style={g.meter} accessibilityLabel={`Carga ${Math.round(charge * 100)} por ciento`}>
            <View style={[g.zone, { left: `${(zoneC - zoneW / 2) * 100}%`, width: `${zoneW * 100}%` }]} />
            <View style={[g.needle, { left: `${charge * 100}%` }]} />
          </View>
          <Pressable
            onPressIn={pressIn}
            onPressOut={pressOut}
            delayLongPress={60_000}
            onLongPress={() => undefined}
            {...(Platform.OS === "web" ? ({ onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault() } as object) : {})}
            style={({ pressed }) => [g.hold, NO_SELECT, pressed && g.holdPressed]} accessibilityRole="button" accessibilityLabel="Mantén pulsado para levantar" testID="gym-hold">
            <Text style={[g.holdText, NO_SELECT]} selectable={false}>MANTÉN Y SUELTA</Text>
          </Pressable>
        </View>
      )}

      {phase === "result" && result && (
        <View style={g.panel}>
          {result.ok ? (
            <>
              <Text style={g.resultTitle}>{hits === reps ? "¡Sesión perfecta!" : hits >= reps / 2 ? "¡Buen entrenamiento!" : "Ha costado, pero lo ha hecho"}</Text>
              <View style={g.rewardRow}>
                <Coin />
                <Text style={g.reward}>+{result.coins} Tamcoins</Text>
                <Text style={g.reward}>+{result.xp} XP de Fuerza</Text>
              </View>
              {result.strLevelsGained > 0 && <Text style={g.msg}>¡Fuerza sube a nivel {state.tamtam?.attributes.str.level}!</Text>}
              {result.strPointGained && <Text style={g.msg}>¡10 sesiones! +1 FUE permanente en la Arena.</Text>}
            </>
          ) : (
            <Text style={g.msg}>Está demasiado cansado para entrenar.</Text>
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn label="Otra vez" onPress={() => setPhase("intro")} style={{ flex: 1 }} />
            <Btn label="Terminar" tone="coral" onPress={onClose} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </View>
  );
}

/** Long-press must never start a text selection or a context menu (mobile web). */
export const NO_SELECT = Platform.OS === "web" ? ({ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" } as object) : {};

const g = StyleSheet.create({
  root: { backgroundColor: brand.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  kicker: { fontFamily: fonts.bodyBold, color: brand.orange, fontSize: 13 },
  title: { fontFamily: fonts.displayBold, color: "#FFFFFF", fontSize: 22, lineHeight: 28 },
  stats: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 8 },
  stat: { fontFamily: fonts.bodyBold, fontSize: 12, color: brand.cloud, backgroundColor: brand.panel, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
  stage: { flex: 1 },
  feedback: { position: "absolute", top: -54, alignSelf: "center", fontFamily: fonts.displayBold, fontSize: 32, color: brand.gold, textShadowColor: "#000", textShadowRadius: 6 },
  panel: { padding: 16, paddingTop: 8, gap: 10 },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  msg: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.coralDark },
  meter: { height: 28, borderRadius: 14, backgroundColor: brand.core, overflow: "hidden", borderWidth: 2, borderColor: colors.line },
  zone: { position: "absolute", top: 0, bottom: 0, backgroundColor: brand.mint },
  needle: { position: "absolute", top: -2, bottom: -2, width: 6, marginLeft: -3, backgroundColor: brand.cloud, borderRadius: 3 },
  hold: { height: 72, borderRadius: 22, backgroundColor: colors.coral, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.coralDark, alignItems: "center", justifyContent: "center" },
  holdPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 3 },
  holdText: { fontFamily: fonts.displayBold, fontSize: 22, color: brand.core },
  resultTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  reward: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
});
