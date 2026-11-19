import {
  debugAttributeLevels, debugCoins, debugForceEvolution, debugGrantAll, debugLevelUp, debugNewEgg, debugSetNeed, type NeedId,
} from "@tamtam/core";
import { fireColorAlleles } from "@tamtam/art";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { newId, useGame } from "../game/GameProvider";
import { colors, fonts } from "../theme";
import { Btn, Sheet } from "../ui/kit";

/**
 * Developer Debug Mode. Works on a separate save slot ("debug") with a simulated clock,
 * so nothing here affects the normal game.
 */
export function DebugPanel({ onClose, toast }: { onClose: () => void; toast: (t: string) => void }) {
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
          <Btn small label="Energía a 100" onPress={() => act((s) => debugSetNeed(s, "energy", 100))} />
        </View>

        <Text style={d.h}>Niveles y atributos</Text>
        <View style={d.row}>
          <Btn small label="Nivel +5" onPress={() => act((s) => debugLevelUp(s, 5))} />
          <Btn small label="Fuerza +1" onPress={() => act((s) => debugAttributeLevels(s, "str", 1))} />
          <Btn small label="Fuerza +5" onPress={() => act((s) => debugAttributeLevels(s, "str", 5))} />
          <Btn small label="Inteligencia +5" onPress={() => act((s) => debugAttributeLevels(s, "int", 5))} />
        </View>

        <Text style={d.h}>Objetos</Text>
        <View style={d.row}>
          <Btn small label="Desbloquear todo" onPress={() => { act((s) => debugGrantAll(s, now())); toast("Todos los objetos añadidos al inventario"); }} />
        </View>

        <Text style={d.h}>Evolución (datos)</Text>
        <Text style={d.p}>Fuerza la transición en los datos para probar el flujo y la conservación del nombre. En este prototipo solo está dibujada la forma Bebé, así que se sigue viendo a Chispín.</Text>
        <View style={d.row}>
          <Btn
            small
            label="Forzar → Fogarín"
            disabled={state.tamtam?.stage !== "baby"}
            onPress={() => {
              act((s) => debugForceEvolution(s, { formId: "fire_child_fogarin", stage: "child" }, now()));
              toast(`${state.tamtam?.name} es ahora Fogarín (en datos)`);
            }}
          />
        </View>

        <Text style={d.h}>Huevos y genética</Text>
        <View style={d.row}>
          {fireColorAlleles.map((a) => (
            <Btn key={a.id} small label={`Huevo ${a.name}`} onPress={() => act((s) => debugNewEgg(s, now(), newId(), a.id))} />
          ))}
        </View>

        <Text style={d.h}>No disponible en este prototipo</Text>
        <Text style={d.p}>Simular combates (no hay Arena todavía), activar minijuegos (no implementados) y herencia genética completa (solo hay alelos de color).</Text>

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
