import { BlurStyle, Canvas, createPicture, Picture, Skia, TileMode, vec } from "@shopify/react-native-skia";
import { composeLook } from "../creature/look";
import {
  evolve, FAMILIES, LUSTRE_NAMES, PART_SLOTS, type EvolutionRoll, type FamilyId, type Tamtam,
} from "@tamtam/core";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { drawTamtam, STAGE_SCALE, useCreature } from "../creature/useCreature";
import { useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn } from "../ui/kit";

const SLOT_NAMES: Record<string, string> = { body: "Cuerpo", head: "Cabeza", legs: "Patas", tail: "Cola", back: "Lomo" };
const AXIS_NAMES: Record<string, string> = { care: "Cuidados", affection: "Mimos", hygiene: "Higiene", training: "Entrenamiento", fighting: "Combate", study: "Estudio", play: "Juego", neglect: "Abandono" };
export const STAGE_NAMES: Record<string, string> = { baby: "Bebé", child: "Infantil", juvenile: "Juvenil", adult: "Adulto" };
export const FAMILY_COLOR = (f: FamilyId) => FAMILIES[f].accent;

/** The Evolution Ritual: glow → flash → the new form, with what shaped it. */
export function EvolutionRitual({ onClose, force }: { onClose: () => void; force?: boolean }) {
  const { state, act, now } = useGame();
  const [before] = useState<Tamtam>(state.tamtam!);
  const [roll, setRoll] = useState<EvolutionRoll | null>(null);
  const t = state.tamtam!;
  const shown = roll ? t : before;
  const look = useMemo(() => composeLook(shown.formQuality ?? "plain", shown.formQuality ?? "plain"), [shown.formQuality]);
  const c = useCreature(state.alleleId, look, shown.genome, shown.stage);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const flash = useSharedValue(0);
  const charge = useSharedValue(0);

  useEffect(() => {
    c.play("celebrate");
    charge.value = withTiming(1, { duration: 2200 });
    const t1 = setTimeout(() => {
      flash.value = 1;
      setRoll(act((s) => evolve(s, now(), force)));
      flash.value = withTiming(0, { duration: 1200 });
    }, 2300);
    return () => clearTimeout(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (roll) c.play("celebrate");
  }, [roll, c.play]);

  const W = Math.max(1, size.w), H = Math.max(1, size.h);
  const scale = Math.min(W / 300, H / 210) * (STAGE_SCALE[shown.stage] ?? 1);
  const pic = useDerivedValue(() => {
    const tt = c.clock.value;
    return createPicture((cv) => {
      if (W < 2) return;
      const k = charge.value;
      const halo = Skia.Paint();
      halo.setShader(Skia.Shader.MakeRadialGradient(vec(W / 2, H * 0.55), W * 0.5, [Skia.Color("#B983FF"), Skia.Color("#00D4FF"), Skia.Color("transparent")], [0, 0.4, 1], TileMode.Clamp));
      halo.setAlphaf(0.25 + 0.5 * k);
      cv.drawCircle(W / 2, H * 0.55, W * 0.5 * (0.8 + 0.1 * Math.sin(tt * 3)), halo);
      const ring = Skia.Paint();
      ring.setAntiAlias(true);
      ring.setStyle(1);
      ring.setStrokeWidth(3);
      ring.setColor(Skia.Color("#FFFFFF"));
      for (let i = 0; i < 3; i++) {
        const ph = (tt * 0.6 + i / 3) % 1;
        ring.setAlphaf((1 - ph) * 0.5 * k);
        cv.drawOval(Skia.XYWHRect(W / 2 - W * 0.4 * ph, H * 0.86 - 20 * ph, W * 0.8 * ph, 40 * ph), ring);
      }
      drawTamtam(cv, c.res, c.playback.value, c.emitters.value, tt, { x: W / 2, y: H * 0.86, scale, dir: 1 }, 0);
      const f = flash.value;
      if (f > 0) {
        const p = Skia.Paint();
        p.setColor(Skia.Color("#FFFFFF"));
        p.setAlphaf(f);
        p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 30, true));
        cv.drawRect(Skia.XYWHRect(-40, -40, W + 80, H + 80), p);
      }
    }, Skia.XYWHRect(0, 0, W, H));
  }, [W, H, scale, c.res]);

  const axes = roll ? Object.entries(roll.profile).filter(([k]) => k !== "neglect" || roll.profile.neglect > 0.5).sort((a, b) => b[1] - a[1]).slice(0, 3) : [];
  return (
    <View style={r.root}>
      <Text style={r.kicker}>{roll ? "¡Ha evolucionado!" : "Ritual de Evolución"}</Text>
      <Text style={r.title}>{roll ? `${t.name} · ${t.formName}` : `${before.name} está cambiando…`}</Text>
      <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Picture picture={pic} />
        </Canvas>
      </View>
      {roll && t.genome && (
        <View style={r.panel}>
          <Text style={r.line}>
            {STAGE_NAMES[t.stage]} · calidad {LUSTRE_NAMES[t.formQuality ?? "plain"]}
            {t.genome.mutation !== "none" ? ` · mutación ${t.genome.mutation}` : ""} · habilidad {FAMILIES[t.genome.parts.back].skill}
          </Text>
          <View style={r.chips}>
            {PART_SLOTS.map((s) => (
              <View key={s} style={[r.chip, { borderColor: FAMILY_COLOR(t.genome!.parts[s]) }]}>
                <Text style={r.chipText}>
                  {SLOT_NAMES[s]}: {FAMILIES[t.genome!.parts[s]].name}
                  {roll.how[s] === "inherited" ? " (heredado)" : roll.how[s] === "wild" ? " (mutación)" : ""}
                </Text>
              </View>
            ))}
          </View>
          <Text style={r.line}>Lo que más ha influido: {axes.map(([k, v]) => `${AXIS_NAMES[k]} ${Math.round(v * 100)}%`).join(" · ")}</Text>
          <Btn label="¡Genial!" tone="coral" onPress={onClose} testID="ritual-done" />
        </View>
      )}
    </View>
  );
}

const r = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: "#0E0A1E", paddingTop: 40 },
  kicker: { textAlign: "center", fontFamily: fonts.bodyBold, color: brand.cyan, fontSize: 14 },
  title: { textAlign: "center", fontFamily: fonts.displayBold, color: brand.cloud, fontSize: 28, paddingHorizontal: 16 },
  panel: { backgroundColor: brand.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 8 },
  line: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: brand.core },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: brand.cloud },
});
