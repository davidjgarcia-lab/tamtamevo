import { Canvas, createPicture, Picture, Skia, BlurStyle } from "@shopify/react-native-skia";
import { DEFAULT_NAMES, eggProgress, hatch, nameNewTamtam, validateName, type NameError } from "@tamtam/core";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useDerivedValue, useFrameCallback, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { drawTamtam, useCreature } from "../creature/useCreature";
import { useGame } from "../game/GameProvider";
import { colors, fonts } from "../theme";
import { Btn } from "../ui/kit";

const EGG = "M 0 -60 C 30 -60 46 -18 46 10 C 46 40 26 58 0 58 C -26 58 -46 40 -46 10 C -46 -18 -30 -60 0 -60 Z";
const SPOTS = ["M -20 -20 a 9 7 0 1 0 0.1 0 Z", "M 18 0 a 11 9 0 1 0 0.1 0 Z", "M -8 26 a 8 6 0 1 0 0.1 0 Z", "M 14 -34 a 6 5 0 1 0 0.1 0 Z"];
const CRACKS = [
  "M -30 -6 L -18 -14 L -8 -2 L 4 -16 L 14 -4 L 28 -12",
  "M -4 -16 L -10 -30 L 0 -40",
  "M 14 -4 L 22 10 L 34 4",
];

export function EggScreen() {
  const { state, now, act } = useGame();
  const [progress, setProgress] = useState(eggProgress(state, now()));
  const [cracking, setCracking] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const clock = useSharedValue(0);
  const crackStart = useSharedValue(-1);
  const prog = useSharedValue(progress);

  useEffect(() => {
    const id = setInterval(() => {
      const p = eggProgress(state, now());
      setProgress(p);
      prog.value = p;
    }, 200);
    return () => clearInterval(id);
  }, [state, now, prog]);

  useFrameCallback((i) => {
    clock.value = i.timestamp / 1000;
  });

  const paths = useMemo(() => ({
    egg: Skia.Path.MakeFromSVGString(EGG)!,
    spots: SPOTS.map((d) => Skia.Path.MakeFromSVGString(d)!),
    cracks: CRACKS.map((d) => Skia.Path.MakeFromSVGString(d)!),
  }), []);

  const picture = useDerivedValue(() => {
    const t = clock.value;
    const { w, h } = size;
    return createPicture((c) => {
      if (w === 0) return;
      const p = prog.value;
      const cs = crackStart.value;
      const ct = cs < 0 ? 0 : t - cs;
      const glow = Skia.Paint();
      glow.setColor(Skia.Color("#FFB25E"));
      glow.setAlphaf(0.25 + 0.45 * p + (p >= 1 ? 0.2 * Math.sin(t * 6) : 0));
      glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 40, true));
      const scale = Math.min(w, h) / 220;
      c.save();
      c.translate(w / 2, h * 0.52);
      c.scale(scale, scale);
      c.drawCircle(0, 0, 70, glow);
      // Wobble grows as hatching approaches; bursts of wobble with pauses.
      const burst = Math.max(0, Math.sin(t * 1.3));
      const amp = (3 + 12 * p) * burst * burst + (cs >= 0 ? 10 : 0);
      c.rotate(Math.sin(t * (8 + p * 6)) * amp, 0, 50);
      const shadow = Skia.Paint();
      shadow.setColor(Skia.Color("#2A0E1E"));
      shadow.setAlphaf(0.25);
      c.drawOval(Skia.XYWHRect(-40, 52, 80, 14), shadow);
      const shell = Skia.Paint();
      shell.setAntiAlias(true);
      shell.setColor(Skia.Color("#FFF1DC"));
      c.drawPath(paths.egg, shell);
      const spot = Skia.Paint();
      spot.setAntiAlias(true);
      spot.setColor(Skia.Color("#FF8A4C"));
      for (const sp of paths.spots) c.drawPath(sp, spot);
      const shade = Skia.Paint();
      shade.setColor(Skia.Color("#E9B98A"));
      shade.setAlphaf(0.45);
      c.save();
      c.clipPath(paths.egg, 1, true);
      c.drawCircle(26, 30, 50, shade);
      c.restore();
      const line = Skia.Paint();
      line.setAntiAlias(true);
      line.setStyle(1);
      line.setStrokeWidth(4);
      line.setColor(Skia.Color("#5A1426"));
      c.drawPath(paths.egg, line);
      const hl = Skia.Paint();
      hl.setColor(Skia.Color("#FFFFFF"));
      hl.setAlphaf(0.8);
      c.drawOval(Skia.XYWHRect(-28, -40, 12, 18), hl);
      if (cs >= 0) {
        const crack = Skia.Paint();
        crack.setAntiAlias(true);
        crack.setStyle(1);
        crack.setStrokeWidth(3.2);
        crack.setStrokeCap(1);
        crack.setColor(Skia.Color("#5A1426"));
        const n = Math.min(paths.cracks.length, Math.floor(ct / 0.25) + 1);
        for (let k = 0; k < n; k++) c.drawPath(paths.cracks[k]!, crack);
        const light = Skia.Paint();
        light.setColor(Skia.Color("#FFE08A"));
        light.setAlphaf(Math.min(1, ct / 0.9));
        light.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 10, true));
        c.drawCircle(0, -8, 20 + ct * 60, light);
      }
      c.restore();
    }, Skia.XYWHRect(0, 0, Math.max(1, w), Math.max(1, h)));
  });

  const ready = progress >= 1;
  const onTap = () => {
    if (!ready || cracking) return;
    setCracking(true);
    crackStart.value = clock.value;
    setTimeout(() => act((s) => hatch(s, now())), 1100);
  };
  const secondsLeft = Math.max(0, Math.ceil(((state.egg?.hatchAt ?? 0) - now()) / 1000));

  return (
    <SafeAreaView style={st.root}>
      <Text style={st.kicker}>Un nido luminoso ha caído en tu casa</Text>
      <Text style={st.title}>{ready ? "¡Se mueve!" : "Incubando…"}</Text>
      <Pressable
        style={st.stage}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel={ready ? "Abrir el huevo" : "Huevo incubando"}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Picture picture={picture} />
        </Canvas>
      </Pressable>
      <View style={st.footer}>
        <View style={st.track}>
          <View style={[st.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={st.hint}>{cracking ? "¡Está saliendo!" : ready ? "Toca el huevo para ayudarle a salir" : `Eclosión en ${secondsLeft} s · el calor del nido lo despierta`}</Text>
      </View>
    </SafeAreaView>
  );
}

const ERRORS: Record<NameError, string> = {
  empty: "Escribe un nombre o pulsa «Sugerir».",
  too_short: "Necesita al menos 2 caracteres.",
  too_long: "Máximo 16 caracteres.",
  invalid_characters: "Hay caracteres que no se pueden usar.",
  no_letters: "Incluye al menos una letra o número.",
  blocked: "Ese nombre no está permitido.",
};

export function NamingScreen() {
  const { act, now, state } = useGame();
  const creature = useCreature(state.egg?.alleleId ?? "brasa");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const result = validateName(name);
  const len = [...name.normalize("NFC")].length;

  useEffect(() => {
    creature.play("celebrate");
    const t = setTimeout(() => creature.play("idle"), 2400);
    return () => clearTimeout(t);
  }, [creature.play]);

  const { res, clock, playback, emitters } = creature;
  const picture = useDerivedValue(() => {
    const { w, h } = size;
    const t = clock.value;
    return createPicture((c) => {
      if (w === 0) return;
      drawTamtam(c, res, playback.value, emitters.value, t, { x: w / 2, y: h * 0.86, scale: Math.min(h / 175, w / 170), dir: 1 }, 0);
    }, Skia.XYWHRect(0, 0, Math.max(1, w), Math.max(1, h)));
  });

  const suggest = () => {
    const list = DEFAULT_NAMES.fire!;
    setName(list[Math.floor(Math.random() * list.length)]!);
    setTouched(true);
  };
  const confirm = () => {
    setTouched(true);
    if (name.trim() !== "" && !result.ok) return;
    act((s) => nameNewTamtam(s, name, now()));
  };

  return (
    <SafeAreaView style={st.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={st.kicker}>¡Ha nacido un Brasálido!</Text>
        <Text style={st.title}>¿Cómo se llamará?</Text>
        <View style={st.stage} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Picture picture={picture} />
          </Canvas>
        </View>
        <View style={st.form}>
          <Text style={st.label} nativeID="nameLabel">Nombre de tu Tamtam</Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (touched) setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            placeholder="p. ej. Brasa"
            placeholderTextColor="#A99BB3"
            maxLength={40}
            style={[st.input, touched && !result.ok && name !== "" && st.inputError]}
            accessibilityLabelledBy="nameLabel"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={confirm}
            testID="name-input"
          />
          <Text style={[st.help, touched && !result.ok && name !== "" && st.helpError]}>
            {touched && !result.ok && name !== "" ? ERRORS[result.error] : `${len}/16 · Si lo dejas vacío, elegiremos uno por ti.`}
          </Text>
          <View style={st.row}>
            <Btn label="Sugerir" onPress={suggest} style={{ flex: 1 }} />
            <Btn label="Confirmar nombre" tone="coral" onPress={confirm} style={{ flex: 2 }} testID="confirm-name" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#2A0E1E" },
  kicker: { textAlign: "center", marginTop: 16, fontFamily: fonts.body, color: "#FFC9A3", fontSize: 14 },
  title: { textAlign: "center", fontFamily: fonts.displayBold, fontSize: 30, color: "#FFF4E2", marginTop: 2 },
  stage: { flex: 1, minHeight: 220 },
  footer: { padding: 24, gap: 10 },
  track: { height: 14, borderRadius: 7, backgroundColor: "#4A1D2E", overflow: "hidden" },
  fill: { height: 14, backgroundColor: "#FFB627", borderRadius: 7 },
  hint: { textAlign: "center", color: "#FFE3C7", fontFamily: fonts.body, fontSize: 14 },
  form: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 8 },
  label: { fontFamily: fonts.bodyBold, color: colors.inkSoft, fontSize: 13 },
  input: { height: 54, borderRadius: 16, borderWidth: 2, borderColor: colors.line, backgroundColor: "#FFFFFF", paddingHorizontal: 16, fontSize: 20, fontFamily: fonts.display, color: colors.ink },
  inputError: { borderColor: "#D9405F" },
  help: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 13 },
  helpError: { color: "#C0304F" },
  row: { flexDirection: "row", gap: 10, marginTop: 6 },
});
