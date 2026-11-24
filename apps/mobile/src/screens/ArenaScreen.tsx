import { Canvas, createPicture, Picture, Skia, TileMode, useImage, vec } from "@shopify/react-native-skia";
import { arenaGate, arenaXpFor, canChooseSchool, cardInfo, chooseCard, chooseSchool, DIFF, equipFighter, FAMILIES, fight, fighterFamily, makeRivals, matchup, narrate, peekArenaPro, playerFighter, rankOf, SCHOOLS, weeklyBoard, type BattleEvent, type CardId, type Difficulty, type Fighter, type SchoolId } from "@tamtam/core";
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
  /** Fight as dealt to the simulator (rival before equipment), for revenge. */
  base: Fighter;
  levelUp: boolean;
  consolation: boolean;
  replay: number;
}

/** Arena: ranked real-time auto-battles against rivals of similar power (simulated, deterministic). */
export function ArenaScreen({ toast, onBattle }: { toast: (t: string) => void; onBattle: (on: boolean) => void }) {
  const { state, act, now } = useGame();
  const [battle, setBattle] = useState<Battle | null>(null);
  const t = state.tamtam;
  const pro = peekArenaPro(state);
  if (!t) {
    return (
      <View style={a.center}>
        <Icon name="egg" size={48} accent={brand.cyan} />
        <Text style={a.lead}>Abre tu huevo en casa para poder combatir.</Text>
      </View>
    );
  }
  const me = equipFighter(state, playerFighter(state));
  const rank = rankOf(state.arena.pc);
  const day = Math.floor(now() / 86_400_000);
  const rivals = makeRivals(playerFighter(state), day * 7919 + state.arena.pc + state.arena.wins * 31 + state.arena.losses * 17);
  const gate = arenaGate(state, now());
  const myFam = fighterFamily(state);
  const board = weeklyBoard(state, now());

  const start = (rival: Fighter, d: Difficulty) => {
    if (!gate.ok) return toast(gate.reason ?? "No puede combatir ahora.");
    const r = act((s) => fight(s, rival, d, { fightId: newId(), seed: Math.floor(Math.random() * 1e9), now: now() }));
    setBattle({ me: r.me, rival: r.foe, base: rival, d, events: r.result.events, winner: r.result.winner, pc: r.pc, coins: r.coins, levelUp: !!r.progress?.levelUp, consolation: !!r.progress?.consolation, replay: 0 });
    onBattle(true);
  };
  const consolationRival = (): Fighter => {
    const easy = rivals[0]!.fighter;
    return { ...easy, name: `${easy.name} (consuelo)`, hp: Math.round(easy.hp * 0.8), str: Math.round(easy.str * 0.8) };
  };

  if (battle)
    return (
      <BattleView
        key={battle.replay}
        b={battle}
        myAllele={state.alleleId}
        canRevenge={!battle.consolation && battle.winner !== 0 && gate.ok}
        onRevenge={() => start(battle.base, battle.d)}
        onReplay={() => setBattle({ ...battle, replay: battle.replay + 1 })}
        onExit={() => { setBattle(null); onBattle(false); }}
      />
    );

  const famTag = (f?: Fighter) => {
    const fam = f?.genome?.parts.back ?? "fire";
    const m = matchup(myFam, fam);
    return { fam, m, label: m > 1 ? "Ventaja +15 %" : m < 1 ? "Desventaja −13 %" : "Neutral", color: m > 1 ? brand.mint : m < 1 ? brand.pink : colors.inkSoft };
  };

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
      <View style={a.levelBox}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={a.name}>Arena nivel {pro.level}</Text>
          <Text style={a.desc} testID="arena-energy">Energía {gate.left}/5{gate.consolation ? " · consuelo disponible" : ""}</Text>
        </View>
        <View style={a.hpTrack}><View style={[a.hpFill, { width: `${(pro.xp / arenaXpFor(pro.level)) * 100}%`, backgroundColor: brand.cyan }]} /></View>
        <View style={a.pips}>{[0, 1, 2, 3, 4].map((i) => <View key={i} style={[a.pip, i < gate.left && { backgroundColor: brand.orange }]} />)}</View>
        {pro.cards.length > 0 && <Text style={a.desc}>Cartas: {pro.cards.map((c) => cardInfo(c).name).join(" · ")}</Text>}
        {pro.school && <Text style={a.desc}>{SCHOOLS[pro.school].name}: {SCHOOLS[pro.school].desc}</Text>}
        {!gate.ok && gate.reason && <Text style={[a.desc, { color: brand.pink }]}>{gate.reason}</Text>}
      </View>
      <Text style={a.desc}>
        {t.name} ({myFam ? FAMILIES[myFam].name : "Fuego"}): Vida {me.hp} · Fuerza {me.str} · Defensa {me.def} · Velocidad {me.spd}. Los combates son automáticos y en tiempo real; tu Tamtam lucha con lo que ha entrenado.
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
            <Text style={[a.diff, { color: famTag(fighter).color }]}>{FAMILIES[famTag(fighter).fam].name} · {famTag(fighter).label}</Text>
          </View>
          <Btn small label="Combatir" tone="pink" onPress={() => start(fighter, difficulty)} testID={`fight-${difficulty}`} />
        </View>
      ))}
      {gate.consolation && (
        <View style={[a.card, { borderColor: brand.mint }]}>
          <View style={{ flex: 1 }}>
            <Text style={a.name}>Combate de consuelo</Text>
            <Text style={a.desc}>Tres derrotas hoy: un rival más flojo para acabar el día con buen sabor.</Text>
          </View>
          <Btn small label="Combatir" tone="mint" onPress={() => start(consolationRival(), "easy")} testID="fight-consolation" />
        </View>
      )}
      <Text style={a.section}>Líderes de la semana</Text>
      <Text style={a.desc}>Tabla local con rivales del dispositivo (sin servidor todavía).</Text>
      {board.map((row, i) => (
        <Text key={row.name + i} style={[a.desc, row.me && { color: brand.gold, fontFamily: fonts.bodyBold }]}>
          {i + 1}. {row.name} · {FAMILIES[row.family].name} · {row.wins} victorias
        </Text>
      ))}
      {pro.badges.length > 0 && <Text style={a.desc}>Insignias: {pro.badges.join(" · ")}</Text>}
      {state.arena.history.length > 0 && <Text style={a.section}>Últimos combates</Text>}
      {state.arena.history.slice(-5).reverse().map((hi, i) => (
        <Text key={i} style={a.desc}>
          {hi.won ? "Victoria" : "Derrota"} contra {hi.rival} · {hi.pc >= 0 ? "+" : ""}{hi.pc} PC · +{hi.coins} TC
        </Text>
      ))}
      {pro.offer && <CardChoice offer={pro.offer} level={pro.level} onPick={(c) => { act((s) => chooseCard(s, c)); toast(`Nueva carta: ${cardInfo(c).name}`); }} />}
      {!pro.offer && canChooseSchool(state) && <SchoolChoice onPick={(sc) => { act((s) => chooseSchool(s, sc)); toast(`Te unes a la ${SCHOOLS[sc].name}`); }} />}
    </ScrollView>
  );
}

function CardChoice({ offer, level, onPick }: { offer: CardId[]; level: number; onPick: (c: CardId) => void }) {
  return (
    <View style={a.choice} testID="arena-cards">
      <Text style={a.section}>¡Arena nivel {level}! Elige una carta</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {offer.map((c, i) => {
          const info = cardInfo(c);
          return (
            <View key={c} style={[a.cardPick, { borderColor: info.kind === "tech" ? brand.orange : info.kind === "companion" ? brand.mint : brand.cyan }]}>
              <Icon name={info.kind === "tech" ? "arena" : info.kind === "companion" ? "heart" : "gym"} size={34} accent={info.kind === "tech" ? brand.orange : brand.cyan} />
              <Text style={a.name}>{info.name}</Text>
              <Text style={[a.desc, { textAlign: "center" }]}>{info.desc}</Text>
              <Btn small label="Elegir" tone="coral" onPress={() => onPick(c)} testID={`card-${i}`} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SchoolChoice({ onPick }: { onPick: (s: SchoolId) => void }) {
  return (
    <View style={a.choice} testID="arena-school">
      <Text style={a.section}>Elige escuela de lucha</Text>
      <Text style={a.desc}>Solo se elige una vez.</Text>
      {(Object.keys(SCHOOLS) as SchoolId[]).map((k) => (
        <View key={k} style={a.card}>
          <View style={{ flex: 1 }}>
            <Text style={a.name}>{SCHOOLS[k].name}</Text>
            <Text style={a.desc}>{SCHOOLS[k].desc}</Text>
          </View>
          <Btn small label="Unirse" tone="pink" onPress={() => onPick(k)} testID={`school-${k}`} />
        </View>
      ))}
    </View>
  );
}

type Floating = { id: number; side: 0 | 1; text: string; color: string };

function BattleView({ b, myAllele, onExit, onRevenge, onReplay, canRevenge }: { b: Battle; myAllele: string; onExit: () => void; onRevenge: () => void; onReplay: () => void; canRevenge: boolean }) {
  const [log, setLog] = useState<string[]>([]);
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
        const line = narrate(e as never, [b.me.name, b.rival.name]);
        if (line) setLog((l) => [...l.slice(-2), line]);
        if (e.type === "technique" || e.type === "companion") {
          setBanner(e.type === "technique" ? e.name : `${e.name} ayuda`);
          timers.push(setTimeout(() => setBanner(null), 1000));
          float(e.by, e.type === "technique" ? e.name : "¡Ayuda!", brand.orange);
          continue;
        }
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
  const den = useImage(require("../../assets/creatures/fire_den.webp")); // eslint-disable-line @typescript-eslint/no-require-imports
  const bg = useMemo(
    () =>
      createPicture((c) => {
        if (den) {
          // Painted fire den (from the Unity project), cover-fit.
          const k = Math.max(W / den.width(), H / den.height());
          const dw = den.width() * k, dh = den.height() * k;
          c.drawImageRect(den, Skia.XYWHRect(0, 0, den.width(), den.height()), Skia.XYWHRect((W - dw) / 2, H - dh, dw, dh), Skia.Paint());
          return;
        }
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
    [W, H, den],
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
            {b.levelUp && <Text style={[a.desc, { textAlign: "center", color: brand.cyan }]}>¡Sube el nivel de Arena! Elige una carta al volver.</Text>}
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
              <Btn small label="Repetir" tone="dark" onPress={onReplay} testID="battle-replay" />
              {canRevenge && <Btn small label="¡Revancha!" tone="pink" onPress={onRevenge} testID="battle-revenge" />}
            </View>
            <Btn label="Volver a la Arena" tone="coral" onPress={onExit} testID="battle-exit" />
          </>
        ) : (
          <>
            <Text style={a.desc}>Combate automático en curso · {DIFF[b.d].label}</Text>
            {log.map((l, i) => <Text key={i} style={[a.desc, { opacity: 0.5 + i * 0.25 }]}>{l}</Text>)}
          </>
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
  levelBox: { backgroundColor: brand.panel, borderRadius: 18, padding: 12, gap: 6, borderWidth: 1.5, borderColor: brand.line },
  pips: { flexDirection: "row", gap: 6 },
  pip: { width: 18, height: 8, borderRadius: 4, backgroundColor: brand.line },
  choice: { backgroundColor: brand.core, borderRadius: 20, padding: 14, gap: 10, borderWidth: 2, borderColor: brand.gold },
  cardPick: { flex: 1, alignItems: "center", gap: 6, backgroundColor: brand.panel, borderRadius: 16, borderWidth: 2, padding: 10 },
});
