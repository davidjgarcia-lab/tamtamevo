import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { brand, tagline } from "../theme";

const TIPS = [
  "Cada cuidado deja huella: el Lustre se graba al evolucionar.",
  "Una siesta de 20 minutos recupera energía.",
  "Las monedas del Gym compran muebles para su habitación.",
  "Cuida. Juega. Evoluciona.",
];

/**
 * Loading screen (Manual de Marca §08 · splash): logo on Violeta núcleo, cyan progress,
 * tagline and a tip. Works before custom fonts load (system font fallback).
 */
export function LoadingScreen({ progress, step }: { progress: number; step: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const tip = useRef(TIPS[Math.floor(Date.now() / 7000) % TIPS.length]!).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    Animated.timing(bar, { toValue: progress, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, bar]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] });

  return (
    <View style={st.root} accessibilityLabel={`Cargando TamTam Evolution, ${Math.round(progress * 100)} por ciento`} testID="loading-screen">
      <Animated.View style={[st.haloWrap, { opacity: glow }]} pointerEvents="none">
        {[440, 360, 280, 200].map((d, i) => (
          <View key={d} style={[st.haloRing, { width: d, height: d, borderRadius: d / 2, opacity: 0.1 + i * 0.06 }]} />
        ))}
      </Animated.View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image source={require("../../assets/brand/logo-640.png")} style={st.logo} resizeMode="contain" accessibilityLabel="TamTam Evolution" />
      </Animated.View>
      <Text style={st.tagline}>{tagline}</Text>
      <View style={st.footer}>
        <View style={st.track}>
          <Animated.View style={[st.fill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
        </View>
        <Text style={st.step}>{step}</Text>
        <Text style={st.tip}>{tip}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.core, alignItems: "center", justifyContent: "center", padding: 24 },
  haloWrap: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center", marginTop: -40 },
  haloRing: { position: "absolute", backgroundColor: brand.violet },
  logo: { width: 300, height: 200 },
  tagline: { color: brand.cyan, fontSize: 15, fontWeight: "700", marginTop: 18, textAlign: "center", letterSpacing: 0.3 },
  footer: { position: "absolute", bottom: 56, left: 32, right: 32, alignItems: "center", gap: 10 },
  track: { width: "100%", height: 8, borderRadius: 4, backgroundColor: brand.panel, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: brand.cyan },
  step: { color: brand.textSoft, fontSize: 13, fontWeight: "600" },
  tip: { color: brand.textDim, fontSize: 12, textAlign: "center" },
});
