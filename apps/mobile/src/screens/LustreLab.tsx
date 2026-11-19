import { Canvas, createPicture, Picture, Skia } from "@shopify/react-native-skia";
import { LUSTRE_NAMES, LUSTRE_TIERS, type LustreTier } from "@tamtam/core";
import { composeLook } from "../creature/look";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { drawTamtam, useCreature } from "../creature/useCreature";
import { colors, fonts } from "../theme";
import { Btn } from "../ui/kit";

/** Developer view: the same Tamtam at each Lustre tier (ART_BIBLE §8). */
function Cell({ tier, alleleId }: { tier: LustreTier; alleleId: string }) {
  const look = useMemo(() => composeLook(tier, tier), [tier]);
  const c = useCreature(alleleId, look);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => c.play("idle"), [c.play]);
  const { res, clock, playback, emitters } = c;
  const pic = useDerivedValue(() => {
    const t = clock.value;
    return createPicture((cv) => {
      if (!size.w) return;
      drawTamtam(cv, res, playback.value, emitters.value, t, { x: size.w / 2, y: size.h * 0.86, scale: Math.min(size.w / 150, size.h / 170), dir: 1 }, 0);
    }, Skia.XYWHRect(0, 0, Math.max(1, size.w), Math.max(1, size.h)));
  });
  return (
    <View style={l.cell}>
      <View style={l.stage} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Picture picture={pic} />
        </Canvas>
      </View>
      <Text style={l.label}>{LUSTRE_NAMES[tier]}</Text>
    </View>
  );
}

export function LustreLab({ alleleId, onClose }: { alleleId: string; onClose: () => void }) {
  return (
    <SafeAreaView style={l.root}>
      <View style={l.head}>
        <Text style={l.title}>Lustre · comparativa</Text>
        <Btn label="Cerrar" small onPress={onClose} />
      </View>
      <Text style={l.p}>El mismo Chispín según cómo se le cuide, entrene y combata. Apagado → Legendario.</Text>
      <View style={l.grid}>
        {LUSTRE_TIERS.map((t) => (
          <Cell key={t} tier={t} alleleId={alleleId} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const l = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: "#2A0E1E" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  title: { fontFamily: fonts.displayBold, fontSize: 24, color: "#FFF4E2" },
  p: { fontFamily: fonts.body, fontSize: 13, color: "#FFD9BF", paddingHorizontal: 14 },
  grid: { flex: 1, flexDirection: "row", flexWrap: "wrap", padding: 8 },
  cell: { width: "50%", height: "33%", padding: 6 },
  stage: { flex: 1, borderRadius: 18, backgroundColor: "#3B1626", overflow: "hidden" },
  label: { textAlign: "center", fontFamily: fonts.display, fontSize: 15, color: colors.cream, marginTop: 4 },
});
