import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import { CHISPIN_GENOME, FAMILIES, careProfile, dominantFamily, rollEvolution, type CareProfile, type EvolutionRoll } from "@tamtam/core";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { drawTamtam, useCreature, type CreatureHandle } from "../creature/useCreature";
import { useGame } from "../game/GameProvider";
import { brand, fonts } from "../theme";
import { Btn } from "../ui/kit";

const PRESETS: Record<string, Partial<CareProfile>> = {
  "Mi partida": {},
  Guerrero: { care: 0.7, fighting: 1, training: 0.9, affection: 0.4, hygiene: 0.5 },
  Forzudo: { care: 0.7, training: 1, study: 0.4 },
  "Limpio y estudioso": { care: 0.9, hygiene: 1, study: 1, affection: 0.5 },
  Mimado: { care: 0.9, affection: 1, hygiene: 0.6 },
  Jugón: { care: 0.7, play: 1, hygiene: 0.8 },
  Descuidado: { care: 0.08, affection: 0.05, hygiene: 0.1 },
};
const N = 9;

/** Debug: 9 possible evolutions for a care style, to check variety and how care steers families. */
export function EvolutionLab({ onClose }: { onClose: () => void }) {
  const { state } = useGame();
  const [preset, setPreset] = useState("Mi partida");
  const [seed, setSeed] = useState(1);
  const profile: CareProfile = preset === "Mi partida"
    ? careProfile(state.care.log, state.care)
    : (() => { const p = { care: 0.6, affection: 0.5, hygiene: 0.5, training: 0, fighting: 0, study: 0, play: 0, neglect: 0, ...PRESETS[preset] } as CareProfile; p.neglect = 1 - p.care; return p; })();
  const rolls: EvolutionRoll[] = Array.from({ length: N }, (_, i) => rollEvolution(state.tamtam?.genome ?? CHISPIN_GENOME, profile, seed * 1000 + i * 7919));
  return (
    <View style={l.root}>
      <View style={l.head}>
        <Text style={l.title}>Laboratorio de evolución</Text>
        <Btn small label="Cerrar" onPress={onClose} testID="evolab-close" />
      </View>
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
        {Object.keys(PRESETS).map((k) => (
          <Btn key={k} small label={k} tone={k === preset ? "dark" : "light"} onPress={() => setPreset(k)} />
        ))}
      </ScrollView>
      <Grid key={`${preset}-${seed}`} rolls={rolls} />
      <Btn label="Otras 9 tiradas" tone="coral" onPress={() => setSeed(seed + 1)} style={{ margin: 12 }} testID="evolab-reroll" />
    </View>
  );
}

function Grid({ rolls }: { rolls: EvolutionRoll[] }) {
  const { state } = useGame();
  // One canvas for all nine (each <Canvas> is a WebGL context on the web).
  const hs: CreatureHandle[] = [];
  for (let i = 0; i < N; i++) hs.push(useCreature(state.alleleId, undefined, rolls[i]!.genome)); // eslint-disable-line react-hooks/rules-of-hooks
  const [size, setSize] = useState({ w: 0, h: 0 });
  const W = Math.max(1, size.w), H = Math.max(1, size.h);
  const cw = W / 3, ch = H / 3;
  const scale = Math.min(cw / 230, ch / 150);
  const pic = useDerivedValue(() => {
    const t = hs[0]!.clock.value;
    return createPicture((c) => {
      if (W < 2) return;
      for (let i = 0; i < N; i++) {
        const h = hs[i]!;
        drawTamtam(c, h.res, h.playback.value, h.emitters.value, t, { x: (i % 3) * cw + cw * 0.52, y: Math.floor(i / 3) * ch + ch * 0.8, scale, dir: 1 }, 0);
      }
    }, Skia.XYWHRect(0, 0, W, H));
  });
  return (
    <View style={{ flex: 1, margin: 8 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={pic} />
      </Canvas>
      {rolls.map((r, i) => (
        <Pressable key={i} style={[l.label, { left: (i % 3) * cw, top: Math.floor(i / 3) * ch, width: cw }]} onPress={() => hs[i]!.play("celebrate")}>
          <Text style={l.name} numberOfLines={1}>{r.name}</Text>
          <Text style={[l.fam, { color: FAMILIES[dominantFamily(r.genome).family].accent }]} numberOfLines={1}>
            {dominantFamily(r.genome).hybrid ? "Quimera" : FAMILIES[dominantFamily(r.genome).family].name}
            {r.genome.mutation !== "none" ? ` · ${r.genome.mutation}` : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const l = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: brand.core, paddingTop: 30 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: brand.cloud },
  label: { position: "absolute", padding: 4 },
  name: { fontFamily: fonts.displayBold, fontSize: 14, color: brand.cloud },
  fam: { fontFamily: fonts.bodyBold, fontSize: 10 },
});
