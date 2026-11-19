import type { ChispinClipId } from "@tamtam/art";
import { completeStudySession, FOODS, STUDY } from "@tamtam/core";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { newId, useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn, Coin } from "../ui/kit";
import { FoodIcon } from "../ui/FoodIcon";
import { NO_SELECT } from "./GymPanel";

const INGREDIENTS = Object.keys(FOODS);
const ROUNDS = [3, 4, 5];

type Phase = "intro" | "show" | "input" | "result";

/**
 * Study at the desk (Academia · Cocina): memorise the recipe (sequence of ingredients) and repeat it.
 * Three rounds of 3, 4 and 5 ingredients. Rewards Intelligence XP and Tamcoins.
 */
export function StudyPanel({ onClose, play }: { onClose: () => void; play: (clip: ChispinClipId) => void }) {
  const { state, act, now, tzOffsetMin } = useGame();
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<string[]>([]);
  const [shown, setShown] = useState(-1);
  const [input, setInput] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; coins: number; xp: number; levels: number } | null>(null);
  const runId = useRef(newId());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const showRound = (r: number) => {
    const s = Array.from({ length: ROUNDS[r]! }, () => INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)]!);
    setSeq(s);
    setInput([]);
    setRound(r);
    setPhase("show");
    play("idle");
    s.forEach((_, i) => timers.current.push(setTimeout(() => setShown(i), 400 + i * 900)));
    timers.current.push(setTimeout(() => { setShown(-1); setPhase("input"); }, 400 + s.length * 900));
  };

  const start = () => {
    if (state.care.asleep) return setMsg("Está dormido. Despiértalo primero.");
    if (state.care.needs.energy < STUDY.energyCost) return setMsg(`Necesita ${STUDY.energyCost} de energía para estudiar.`);
    runId.current = newId();
    setCorrect(0);
    setMsg(null);
    showRound(0);
  };

  const finish = (hits: number) => {
    const quality = 0.5 + hits / ROUNDS.length;
    const r = act((s) => completeStudySession(s, { runId: runId.current, quality, now: now(), tzOffsetMin }));
    setResult(r);
    setPhase("result");
    play(r.ok ? "celebrate" : "sad");
  };

  const pick = (id: string) => {
    if (phase !== "input") return;
    const next = [...input, id];
    setInput(next);
    const i = next.length - 1;
    if (seq[i] !== id) {
      play("sad");
      timers.current.push(setTimeout(() => (round + 1 < ROUNDS.length ? showRound(round + 1) : finish(correct)), 700));
      setPhase("show");
      return;
    }
    if (next.length === seq.length) {
      const c = correct + 1;
      setCorrect(c);
      play("celebrate");
      timers.current.push(setTimeout(() => (round + 1 < ROUNDS.length ? showRound(round + 1) : finish(c)), 900));
      setPhase("show");
    }
  };

  return (
    <View style={k.root}>
      <View style={k.head}>
        <View style={{ flex: 1 }}>
          <Text style={k.kicker}>Estudio · Inteligencia nv. {state.tamtam?.attributes.int.level ?? 0} · Sesiones {state.study.sessions}</Text>
          <Text style={k.title}>Recetario de cocina</Text>
        </View>
        <Btn label="Salir" small onPress={onClose} testID="study-exit" />
      </View>
      <View style={k.panel}>
        {phase === "intro" && (
          <>
            <Text style={k.body}>Memoriza los ingredientes de la receta en orden y repítelos. 3 rondas. Cuesta {STUDY.energyCost} de energía.</Text>
            {msg && <Text style={k.msg}>{msg}</Text>}
            <Btn label="Empezar a estudiar" tone="coral" onPress={start} testID="study-start" />
          </>
        )}
        {(phase === "show" || phase === "input") && (
          <>
            <Text style={k.body}>
              Ronda {round + 1} de {ROUNDS.length} · {phase === "show" ? "¡Memoriza!" : `Repite la receta (${input.length}/${seq.length})`}
            </Text>
            <View style={k.slots}>
              {seq.map((id, i) => (
                <View key={i} style={[k.slot, shown === i && k.slotOn]}>
                  {shown === i ? <FoodIcon id={id} size={40} /> : input[i] ? <FoodIcon id={input[i]!} size={34} /> : null}
                </View>
              ))}
            </View>
            <View style={k.pad}>
              {INGREDIENTS.map((id) => (
                <Pressable key={id} onPress={() => pick(id)} disabled={phase !== "input"} style={({ pressed }) => [k.key, NO_SELECT, pressed && k.keyPressed, phase !== "input" && { opacity: 0.5 }]} accessibilityRole="button" accessibilityLabel={FOODS[id]!.item.name.es} testID={`study-${id}`}>
                  <FoodIcon id={id} size={40} />
                </Pressable>
              ))}
            </View>
          </>
        )}
        {phase === "result" && result && (
          <>
            {result.ok ? (
              <>
                <Text style={k.resultTitle}>{correct === ROUNDS.length ? "¡Receta perfecta!" : correct > 0 ? "¡Ha aprendido algo nuevo!" : "Hoy no se le ha quedado…"}</Text>
                <View style={k.rewardRow}>
                  <Coin />
                  <Text style={k.reward}>+{result.coins} Tamcoins</Text>
                  <Text style={k.reward}>+{result.xp} XP de Inteligencia</Text>
                </View>
              </>
            ) : (
              <Text style={k.msg}>Está demasiado cansado para estudiar.</Text>
            )}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Btn label="Otra vez" onPress={() => setPhase("intro")} style={{ flex: 1 }} />
              <Btn label="Terminar" tone="coral" onPress={onClose} style={{ flex: 1 }} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const k = StyleSheet.create({
  root: { backgroundColor: brand.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10 },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  kicker: { fontFamily: fonts.bodyBold, color: brand.blue, fontSize: 12 },
  title: { fontFamily: fonts.displayBold, color: brand.cloud, fontSize: 22, lineHeight: 28 },
  panel: { padding: 16, paddingTop: 8, gap: 10 },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  msg: { fontFamily: fonts.bodyBold, fontSize: 14, color: brand.pink },
  slots: { flexDirection: "row", gap: 8, justifyContent: "center" },
  slot: { width: 52, height: 52, borderRadius: 14, backgroundColor: brand.core, borderWidth: 2, borderColor: brand.line, alignItems: "center", justifyContent: "center" },
  slotOn: { borderColor: brand.cyan, backgroundColor: "#1E2A55" },
  pad: { flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  key: { width: 60, height: 60, borderRadius: 16, backgroundColor: brand.panelHi, borderWidth: 1.5, borderBottomWidth: 4, borderColor: brand.line, alignItems: "center", justifyContent: "center" },
  keyPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  resultTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  reward: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
});
