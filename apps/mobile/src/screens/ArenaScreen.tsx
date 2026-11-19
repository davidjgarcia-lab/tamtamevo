import { Canvas, createPicture, Picture, Skia, TileMode, vec } from "@shopify/react-native-skia";
import { DIFF, fight, makeRivals, playerFighter, rankOf, type BattleEvent, type Difficulty, type Fighter } from "@tamtam/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDerivedValue, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { Portrait } from "../creature/Portrait";
import { drawTamtam, useCreature } from "../creature/useCreature";
import { newId, useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn, Coin } from "../ui/kit";
import { Icon } from "../ui/icons";

const SPEED = 1.6;

interface Battle {
  me: Fighter;
  rival: Fighter;
  d: Difficulty;
  events: BattleEvent[];
  winner: 0 | 1 | -1;
  pc: number;
  coins: number;
}

/** Arena: ranked real-time auto-battles against rivals of similar power (simulated, deterministic). */
export function ArenaScreen({ toast, onBattle }: { toast: (t: string) => void; onBattle: (on: boolean) => void }) {
  const { state, act, now } = useGame();
  const [battle, setBattle] = useState<Battle | null>(null);
  const t = state.tamtam;
  if (!t) {
    return (
      <View style={a.center}>
        <Icon name="egg" size={48} accent={brand.cyan} />
        <Text style={a.lead}>Abre tu huevo en casa para poder combatir.</Text>
      </View>
    );
  }
  const me = playerFighter(state);
  const rank = rankOf(state.arena.pc);
  const day = Math.floor(now() / 86_400_000);
  const rivals = makeRivals(me, day * 7919 + state.arena.pc + state.arena.wins * 31 + state.arena.losses * 17);

  const start = (rival: Fighter, d: Difficulty) => {
    if (state.care.asleep) return toast("Está dormido. Despiértalo primero.");
    if (state.care.needs.energy < 8) return toast("Está agotado para combatir. Una siesta le vendrá bien.");
    const r = act((s) => fight(s, rival, d, { fightId: newId(), seed: Math.floor(Math.random() * 1e9), now: now() }));
    setBattle({ me: r.me, rival, d, events: r.result.events, winner: r.result.winner, pc: r.pc, coins: r.coins });
    onBattle(true);
  };

  if (battle) return <BattleView b={battle} myAllele={state.alleleId} onExit={() => { setBattle(null); onBattle(false); }} />;

  return (
    <ScrollView contentContainerStyle={a.root}>
      <Text style={a.title}>Arena</Text>
      <View style={a.rank}>
        <Icon name="trophy" size={44} color={brand.gold} accent={brand.gold} />
        <View style={{ flex: 1 }}>
          <Text style={a.rankName}>{rank.name} {rank.division}</Text>
          <Text style={a.desc}>{state.arena.pc} PC{rank.toNext > 0 ? ` · faltan ${rank.toNext} para subir` : ""}</Text>
          <Text style={a.desc}>Victorias {state.arena.wins} · Derrotas {state.arena.losses}{state.arena.streak > 1 ? ` · racha ${state.arena.streak}` : ""}</Text>
        </View>
      </View>
      <Text style={a.desc}>
        {t.name}: Vida {me.hp} · Fuerza {me.str} · Defensa {me.def} · Velocidad {me.spd}. Los combates son automáticos y en tiempo real; tu Tamtam lucha con lo que ha entrenado.
      </Text>
      <Text style={a.section}>Rivales de hoy</Text>
      {rivals.map(({ fighter, difficulty }) => (
        <View key={difficulty} style={a.card}>
          <View style={a.portrait}>
            <Portrait alleleId={fighter.alleleId} size={84} dir={-1} genome={fighter.genome} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={a.name}>{fighter.name}</Text>
            <Text style={[a.diff, { color: difficulty === "easy" ? brand.mint : difficulty === "even" ? brand.gold : brand.pink }]}>{DIFF[difficulty].label}</Text>
            <Text style={a.desc}>Vida {fighter.hp} · Fuerza {fighter.str}</Text>
            <Text style={a.desc}>Victoria: +{DIFF[difficulty].win} PC · {DIFF[difficulty].coins} TC</Text>
          </View>
          <Btn small label="Combatir" tone="pink" onPress={() => start(fighter, difficulty)} testID={`fight-${difficulty}`} />
        </View>
      ))}
      {state.arena.history.length > 0 && <Text style={a.section}>Últimos combates</Text>}
      {state.arena.history.slice(-5).reverse().map((hi, i) => (
        <Text key={i} style={a.desc}>
          {hi.won ? "Victoria" : "Derrota"} contra {hi.rival} · {hi.pc >= 0 ? "+" : ""}{hi.pc} PC · +{hi.coins} TC
        </Text>
      ))}
    </ScrollView>
  );
}

type Floating = { id: number; side: 0 | 1; text: string; color: string };

function BattleView({ b, myAllele, onExit }: { b: Battle; myAllele: string; onExit: () => void }) {
  const A = useCreature(myAllele, undefined, b.me.genome);
  const B = useCreature(b.rival.alleleId, undefined, b.rival.genome);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hp, setHp] = useState<[number, number]>([b.me.hp, b.rival.hp]);
  const [floats, setFloats] = useState<Floating[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const lungeA = useSharedValue(0);
  const lungeB = useSharedValue(0);
  const fid = useRef(0);

  useEffect(() => {
    let bt = 0;
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const creature = [A, B];
    const lunge = [lungeA, lungeB];
    const float = (side: 0 | 1, text: string, color: string) => {
      const id = ++fid.current;
      setFloats((f) => [...f, { id, side, text, color }]);
      timers.push(setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900));
    };
    const back = (side: 0 | 1, ms: number) => timers.push(setTimeout(() => creature[side]!.play("idle"), ms));
    const id = setInterval(() => {
      bt += 0.05 * SPEED;
      while (i < b.events.length && b.events[i]!.t <= bt) {
        const e = b.events[i++]!;
        if (e.type === "attack" || e.type === "skill") {
          creature[e.by]!.play("attack");
          lunge[e.by]!.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 260 }));
          back(e.by, 520);
          if (e.type === "skill") {
            setBanner(e.name);
            timers.push(setTimeout(() => setBanner(null), 1000));
          }
        } else if (e.type === "hit") {
          creature[e.on]!.play("hit");
          back(e.on, 420);
          setHp((h) => (e.on === 0 ? [e.hp, h[1]] : [h[0], e.hp]));
          float(e.on, `${e.crit ? "¡" : ""}-${e.dmg}${e.crit ? "!" : ""}`, e.crit ? brand.gold : brand.cloud);
        } else if (e.type === "dodge") {
          float(e.by, "Esquiva", brand.cyan);
        } else if (e.type === "end") {
          clearInterval(id);
          const w = e.winner;
          timers.push(
            setTimeout(() => {
              if (w >= 0) {
                creature[w]!.play("celebrate");
                creature[1 - w]!.play("sad");
              }
              setDone(true);
            }, 500),
          );
        }
      }
    }, 50);
    return () => {
      clearInterval(id);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const W = Math.max(1, size.w);
  const H = Math.max(1, size.h);
  const bg = useMemo(
    () =>
      createPicture((c) => {
        const p = Skia.Paint();
        p.setShader(Skia.Shader.MakeLinearGradient(vec(0, 0), vec(0, H), [Skia.Color("#2A1C5C"), Skia.Color("#17132B")], null, TileMode.Clamp));
        c.drawRect(Skia.XYWHRect(0, 0, W, H), p);
        const floor = Skia.Paint();
        floor.setAntiAlias(true);
        floor.setShader(Skia.Shader.MakeRadialGradient(vec(W / 2, H * 0.8), W * 0.6, [Skia.Color("#5B3FB0"), Skia.Color("#30294F"), Skia.Color("#17132B")], [0, 0.6, 1], TileMode.Clamp));
        c.drawOval(Skia.XYWHRect(-W * 0.1, H * 0.62, W * 1.2, H * 0.36), floor);
        const ring = Skia.Paint();
        ring.setAntiAlias(true);
        ring.setStyle(1);
        ring.setStrokeWidth(3);
        ring.setColor(Skia.Color("#00D4FF"));
        ring.setAlphaf(0.45);
        c.drawOval(Skia.XYWHRect(W * 0.06, H * 0.68, W * 0.88, H * 0.24), ring);
      }, Skia.XYWHRect(0, 0, W, H)),
    [W, H],
  );
  const scale = Math.min(W / 560, H / 300);
  const pic = useDerivedValue(() => {
    const tt = A.clock.value;
    return createPicture((c) => {
      if (W < 2) return;
      drawTamtam(c, A.res, A.playback.value, A.emitters.value, tt, { x: W * 0.25 + lungeA.value * 40 * scale, y: H * 0.86, scale, dir: 1 }, 0);
      drawTamtam(c, B.res, B.playback.value, B.emitters.value, tt, { x: W * 0.75 - lungeB.value * 40 * scale, y: H * 0.86, scale, dir: -1 }, 0);
    }, Skia.XYWHRect(0, 0, W, H));
  }, [W, H, scale, A.res, B.res]);

  const won = b.winner === 0;
  const hpBar = (v: number, max: number, color: string, name: string, right?: boolean) => (
    <View style={[a.hpBox, right && { alignItems: "flex-end" }]}>
      <Text style={a.hpName}>{name}</Text>
      <View style={a.hpTrack}>
        <View style={[a.hpFill, { width: `${Math.max(0, (v / max) * 100)}%`, backgroundColor: color }, right && { alignSelf: "flex-end" }]} />
      </View>
      <Text style={a.hpText}>{Math.max(0, Math.round(v))} / {max}</Text>
    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      <View style={a.hpRow}>
        {hpBar(hp[0], b.me.hp, brand.mint, b.me.name)}
        {hpBar(hp[1], b.rival.hp, brand.pink, b.rival.name, true)}
      </View>
      <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Picture picture={bg} />
          <Picture picture={pic} />
        </Canvas>
        {floats.map((f) => (
          <Text key={f.id} style={[a.float, { left: f.side === 0 ? "18%" : "62%", color: f.color }]}>{f.text}</Text>
        ))}
        {banner && <Text style={a.banner}>{banner}</Text>}
      </View>
      <View style={a.panel}>
        {done ? (
          <>
            <Text style={[a.result, { color: won ? brand.gold : brand.textSoft }]}>{b.winner === -1 ? "Empate" : won ? "¡Victoria!" : "Derrota"}</Text>
            <View style={a.rewardRow}>
              <Text style={a.reward}>{b.pc >= 0 ? "+" : ""}{b.pc} PC</Text>
              <Coin />
              <Text style={a.reward}>+{b.coins} Tamcoins</Text>
            </View>
            <Btn label="Volver a la Arena" tone="coral" onPress={onExit} testID="battle-exit" />
          </>
        ) : (
          <Text style={a.desc}>Combate automático en curso · {DIFF[b.d].label}</Text>
        )}
      </View>
    </View>
  );
}

const a = StyleSheet.create({
  root: { padding: 12, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink },
  lead: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, textAlign: "center" },
  rank: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: brand.panel, borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: brand.gold },
  rankName: { fontFamily: fonts.displayBold, fontSize: 24, color: brand.gold },
  section: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: brand.panel, borderRadius: 18, borderWidth: 1.5, borderColor: brand.line, padding: 10 },
  portrait: { width: 84, height: 84, borderRadius: 14, backgroundColor: brand.core, overflow: "hidden" },
  name: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  diff: { fontFamily: fonts.bodyBold, fontSize: 13 },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  hpRow: { flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingTop: 8 },
  hpBox: { flex: 1, gap: 3 },
  hpName: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  hpTrack: { height: 12, borderRadius: 6, backgroundColor: brand.panel, overflow: "hidden" },
  hpFill: { height: 12, borderRadius: 6 },
  hpText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
  float: { position: "absolute", top: "30%", fontFamily: fonts.displayBold, fontSize: 26, textShadowColor: "#000", textShadowRadius: 6 },
  banner: { position: "absolute", top: 12, alignSelf: "center", fontFamily: fonts.displayBold, fontSize: 22, color: brand.orange, backgroundColor: "rgba(23,19,43,0.85)", paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  panel: { backgroundColor: brand.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 10, minHeight: 90, justifyContent: "center" },
  result: { fontFamily: fonts.displayBold, fontSize: 30, textAlign: "center" },
  rewardRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  reward: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
});
