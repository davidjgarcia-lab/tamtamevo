import { ageInDays, berryReadyIn, harvestBerries, peekHouse, swapWithFarm, type Tamtam } from "@tamtam/core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Portrait } from "../creature/Portrait";
import { useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn } from "../ui/kit";
import { Icon } from "../ui/icons";

const STAGE: Record<string, string> = { baby: "Bebé", child: "Infantil", juvenile: "Juvenil", adult: "Adulto" };

/**
 * Granja: where the Tamtams you are not playing with live. Their needs are paused while
 * they rest here; bring one home and the current one comes to rest in its place.
 */
export function FarmScreen({ toast, goHome }: { toast: (t: string) => void; goHome: () => void }) {
  const { state, act, now } = useGame();
  const t = state.tamtam;
  const berryLeft = berryReadyIn(state, now());
  const card = (tt: Tamtam, allele: string, active: boolean, index: number) => (
    <View key={tt.id} style={[f.card, active && f.active]}>
      <View style={f.portrait}>
        <Portrait alleleId={allele} size={92} clip={active ? "idle" : "sleep"} genome={tt.genome} stage={tt.stage} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={f.name}>{tt.name}</Text>
        <Text style={f.desc}>{tt.formName ?? "Chispín"} · {STAGE[tt.stage]} · Nv {tt.level} · {ageInDays(tt, now())} días</Text>
        <Text style={[f.desc, { color: active ? brand.mint : brand.textDim }]}>{active ? "En casa contigo" : "Descansando en la granja"}</Text>
      </View>
      {!active && (
        <Btn
          small
          label="Llevar a casa"
          tone="coral"
          testID={`farm-swap-${index}`}
          onPress={() => {
            act((s) => swapWithFarm(s, index, now()));
            toast(`${tt.name} vuelve a casa`);
            goHome();
          }}
        />
      )}
    </View>
  );
  return (
    <ScrollView contentContainerStyle={f.root}>
      <Text style={f.title}>Granja</Text>
      <Text style={f.lead}>Aquí viven los Tamtams con los que no estás jugando. Mientras descansan, sus necesidades no bajan.</Text>
      {t ? card(t, state.alleleId, true, -1) : (
        <View style={f.empty}>
          <Icon name="egg" size={40} accent={brand.cyan} />
          <Text style={f.desc}>Tu primer huevo está en casa. Ábrelo para empezar.</Text>
        </View>
      )}
      <View style={[f.card, { borderColor: brand.mint }]} testID="berry-tree">
        <Icon name="farm" size={44} accent={brand.mint} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={f.name}>Árbol de bayas</Text>
          {state.economy.caretakerLevel < 3 ? (
            <Text style={f.desc}>Crece en el nivel 3 de cuidador.</Text>
          ) : berryLeft > 0 ? (
            <Text style={f.desc}>Madura en {Math.ceil(berryLeft / 60_000)} min · cosechas: {peekHouse(state).berry.harvested}</Text>
          ) : (
            <Text style={[f.desc, { color: brand.mint }]}>¡Hay bayas maduras!</Text>
          )}
        </View>
        <Btn
          small
          label="Cosechar"
          tone="mint"
          disabled={state.economy.caretakerLevel < 3 || berryLeft > 0}
          testID="berry-harvest"
          onPress={() => {
            const r = act((s) => harvestBerries(s, now()));
            toast(r.kind === "food" ? "+1 Bollito de bayas" : `+${r.amount} Tamcoins`);
          }}
        />
      </View>
      {state.farm.map((e, i) => card(e.tamtam, e.alleleId, false, i))}
      {state.farm.length === 0 && (
        <View style={f.empty}>
          <Icon name="farm" size={40} accent={brand.mint} />
          <Text style={f.desc}>La granja está vacía. Los nuevos huevos llegarán con la cría y las expediciones (aún no disponibles en esta versión).</Text>
        </View>
      )}
    </ScrollView>
  );
}

const f = StyleSheet.create({
  root: { padding: 12, gap: 10 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink },
  lead: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: brand.panel, borderRadius: 18, borderWidth: 1.5, borderColor: brand.line, padding: 10 },
  active: { borderColor: brand.cyan },
  portrait: { width: 92, height: 92, borderRadius: 16, backgroundColor: brand.core, overflow: "hidden" },
  name: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  empty: { alignItems: "center", gap: 8, padding: 20, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: brand.line },
});
