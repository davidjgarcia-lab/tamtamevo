import {
  debugAttributeLevels, debugCoins, debugGrantAll, emptyStageLog, debugProblem, addCaretakerXp, PROBLEMS, debugLevelUp, debugNewEgg, debugSetLifetimeCare, debugSetNeed, LUSTRE_NAMES, lustre, type NeedId,
} from "@tamtam/core";
import { fireColorAlleles } from "@tamtam/art";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { newId, useGame } from "../game/GameProvider";
import { colors, fonts } from "../theme";
import { Btn, Sheet } from "../ui/kit";

/** Stage logs that reproduce typical care styles (40 h of stage). */
const STYLES = {
  Guerrero: { hours: 40, sat: 40 * 72, hyg: 40 * 55, aff: 40 * 50, hun: 40 * 70, gym: 12, fights: 12, wins: 8, pets: 5, baths: 3 },
  "Limpio y estudioso": { hours: 40, sat: 40 * 85, hyg: 40 * 95, aff: 40 * 60, hun: 40 * 80, study: 10, baths: 12, cleans: 6, pets: 8 },
  Mimado: { hours: 40, sat: 40 * 88, hyg: 40 * 70, aff: 40 * 95, hun: 40 * 85, pets: 40, baths: 5 },
  Jugón: { hours: 40, sat: 40 * 75, hyg: 40 * 80, aff: 40 * 60, hun: 40 * 70, games: 14, baths: 6 },
  Descuidado: { hours: 40, sat: 40 * 30, hyg: 40 * 25, aff: 40 * 20, hun: 40 * 30 },
};

/**
 * Developer Debug Mode. Works on a separate save slot ("debug") with a simulated clock,
 * so nothing here affects the normal game.
 */
export function DebugPanel({ onClose, toast, onLustreLab, onEvolutionLab, onForceEvolution }: { onClose: () => void; toast: (t: string) => void; onLustreLab: () => void; onEvolutionLab: () => void; onForceEvolution: () => void }) {
  const g = useGame();
  const { state, act, now } = g;

  if (g.profile !== "debug") {
    return (
      <Sheet title="Developer Debug Mode" onClose={onClose}>
        <Text style={d.p}>
          El modo debug usa una partida separada (copia de la actual) y un reloj simulado. Lo que hagas ahí no afecta a tu partida normal.
        </Text>
        <Btn label="Entrar en modo debug" tone="dark" onPress={() => void g.setProfile("debug")} testID="debug-enter" />
      </Sheet>
    );
  }

  const day = 24 * 3_600_000;
  const skip = (ms: number, label: string) => {
    g.addTime(ms);
    toast(`Reloj simulado +${label}`);
  };
  const setAll = (v: number) => act((s) => (["hunger", "hygiene", "happiness"] as NeedId[]).forEach((n) => debugSetNeed(s, n, v)));
  const simDate = new Date(now()).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <Sheet title="Modo debug" onClose={onClose} tall>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
        <Text style={d.p}>
          Partida de pruebas · reloj simulado: <Text style={d.b}>{simDate}</Text> (desfase {(g.timeOffsetMs / 3_600_000).toFixed(1)} h)
        </Text>

        <Text style={d.h}>Tiempo</Text>
        <View style={d.row}>
          <Btn small label="+1 h" onPress={() => skip(3_600_000, "1 h")} testID="dbg-1h" />
          <Btn small label="+6 h" onPress={() => skip(6 * 3_600_000, "6 h")} />
          <Btn small label="+12 h" onPress={() => skip(12 * 3_600_000, "12 h")} />
          <Btn small label="+24 h" onPress={() => skip(day, "24 h")} testID="dbg-24h" />
          <Btn small label="+3 días" onPress={() => skip(3 * day, "3 días")} />
          <Btn small label="+7 días" onPress={() => skip(7 * day, "7 días")} />
        </View>

        <Text style={d.h}>Monedas</Text>
        <View style={d.row}>
          <Btn small label="+500" onPress={() => act((s) => debugCoins(s, 500, now()))} testID="dbg-coins" />
          <Btn small label="+5.000" onPress={() => act((s) => debugCoins(s, 5000, now()))} />
          <Btn small label="−500" onPress={() => act((s) => debugCoins(s, -500, now()))} />
        </View>

        <Text style={d.h}>Hambre, higiene y felicidad</Text>
        <View style={d.row}>
          <Btn small label="Todo a 10" onPress={() => setAll(10)} />
          <Btn small label="Todo a 50" onPress={() => setAll(50)} />
          <Btn small label="Todo a 100" onPress={() => setAll(100)} />
          <Btn small label="Energía a 5" onPress={() => act((s) => debugSetNeed(s, "energy", 5))} />
          <Btn small label="Energía a 100" onPress={() => act((s) => debugSetNeed(s, "energy", 100))} testID="dbg-energy" />
          <Btn
            small
            label="Ensuciar (higiene 15 + cacas)"
            testID="dbg-mess"
            onPress={() => {
              act((s) => {
                debugSetNeed(s, "hygiene", 15);
                const t0 = now();
                s.care.poops.push(t0 - 3_600_000, t0 - 1_234_567, t0 - 777_777);
              });
              toast("Habitación sucia y Tamtam sin bañar");
            }}
          />
        </View>

        <Text style={d.h}>Niveles y atributos</Text>
        <View style={d.row}>
          <Btn small label="Nivel +5" onPress={() => act((s) => debugLevelUp(s, 5))} />
          <Btn small label="Fuerza +1" onPress={() => act((s) => debugAttributeLevels(s, "str", 1))} />
          <Btn small label="Fuerza +5" onPress={() => act((s) => debugAttributeLevels(s, "str", 5))} />
          <Btn small label="Inteligencia +5" onPress={() => act((s) => debugAttributeLevels(s, "int", 5))} />
        </View>

        <Text style={d.h}>Lustre {state.tamtam ? `· ${LUSTRE_NAMES[lustre(state.care, state.tamtam).tier]}` : ""}</Text>
        <View style={d.row}>
          <Btn small label="Historial de cuidado 15" onPress={() => act((s) => debugSetLifetimeCare(s, 15))} />
          <Btn small label="… 60" onPress={() => act((s) => debugSetLifetimeCare(s, 60))} />
          <Btn small label="… 100" onPress={() => act((s) => debugSetLifetimeCare(s, 100))} />
          <Btn small label="Comparativa de Lustre" tone="gold" onPress={onLustreLab} testID="dbg-lustre-lab" />
        </View>

        <Text style={d.h}>Objetos</Text>
        <View style={d.row}>
          <Btn small label="Desbloquear todo" onPress={() => { act((s) => debugGrantAll(s, now())); toast("Todos los objetos añadidos al inventario"); }} />
        </View>

        <Text style={d.h}>Vida del Tamtam</Text>
        <View style={d.row}>
          {(["thorn", "ash", "cold", "tangle"] as const).map((pid) => (
            <Btn key={pid} small label={`Problema: ${PROBLEMS[pid].name}`} testID={`dbg-problem-${pid}`} onPress={() => { act((s) => debugProblem(s, pid, now())); toast(`Problema: ${PROBLEMS[pid].name}`); }} />
          ))}
          <Btn small label="+200 XP cuidador" testID="dbg-xp" onPress={() => act((s) => { addCaretakerXp(s, 200); })} />
        </View>

        <Text style={d.h}>Evolución genética</Text>
        <Text style={d.p}>
          La evolución mezcla piezas de 9 familias según cómo se haya cuidado al Tamtam en esta etapa. Etapa: {state.tamtam?.stage ?? "—"} · madurez {state.care.maturity.toFixed(1)}.
        </Text>
        <View style={d.row}>
          <Btn small label="Madurez completa" testID="dbg-mature" onPress={() => { act((s) => { s.care.maturity = 999; }); toast("Listo para evolucionar"); }} />
          <Btn small label="Forzar evolución" tone="gold" disabled={!state.tamtam || state.tamtam.stage === "adult"} testID="dbg-evolve" onPress={onForceEvolution} />
          <Btn small label="Laboratorio de evolución" tone="dark" testID="dbg-evolab" onPress={onEvolutionLab} />
        </View>
        <Text style={d.p}>Simular cómo se ha cuidado esta etapa (rellena el registro de la etapa):</Text>
        <View style={d.row}>
          {(Object.keys(STYLES) as (keyof typeof STYLES)[]).map((k) => (
            <Btn key={k} small label={k} testID={`dbg-style-${k}`} onPress={() => { act((s) => { s.care.log = { ...emptyStageLog(), ...STYLES[k] }; }); toast(`Etapa simulada: ${k}`); }} />
          ))}
        </View>

        <Text style={d.h}>Huevos y genética</Text>
        <View style={d.row}>
          {fireColorAlleles.map((a) => (
            <Btn key={a.id} small label={`Huevo ${a.name}`} onPress={() => { act((s) => debugNewEgg(s, now(), newId(), a.id)); toast(state.tamtam ? `Nuevo Chispín ${a.name} en la Granja` : "Nuevo huevo en casa"); }} />
          ))}
        </View>

        <Text style={d.h}>No disponible en este prototipo</Text>
        <Text style={d.p}>Herencia genética completa (solo hay alelos de color), formas evolucionadas dibujadas (solo existe Chispín bebé) y todo lo que necesita servidor (Conectar, Arena PvP real).</Text>

        <View style={d.row}>
          <Btn label="Reiniciar partida debug" small onPress={() => void g.resetDebug()} />
          <Btn label="Salir del modo debug" tone="dark" small onPress={() => { onClose(); void g.setProfile("main"); }} testID="debug-exit" />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const d = StyleSheet.create({
  p: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
  b: { fontFamily: fonts.bodyBold, color: colors.ink },
  h: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
