import { buy, LEVEL_FEATURES, peekLife, PurchaseError, setFinish, SLICE_CATALOG, xpForLevel, type CatalogItem } from "@tamtam/core";
import { useEffect } from "react";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { newId, useGame } from "../game/GameProvider";
import { MinigameHub } from "../minigames/Hub";
import { brand, fonts } from "../theme";
import { Btn, Coin, Toast } from "../ui/kit";
import { Icon, type ICONS } from "../ui/icons";
import { ArenaScreen } from "./ArenaScreen";
import { ConnectScreen } from "./ConnectScreen";
import { DebugPanel } from "./DebugPanel";
import { FarmScreen } from "./FarmScreen";
import { NO_SELECT } from "./GymPanel";
import { HomeScreen } from "./HomeScreen";
import { LustreLab } from "./LustreLab";
import { EvolutionLab } from "./EvolutionLab";
import { EvolutionRitual, STAGE_NAMES } from "./EvolutionRitual";
import { HistorySheet, ProfileSheet, ShopView } from "./sheets";

type Tab = "home" | "farm" | "shop" | "arena" | "connect";
const TABS: { id: Tab; label: string; icon: keyof typeof ICONS }[] = [
  { id: "home", label: "Casa", icon: "home" },
  { id: "farm", label: "Granja", icon: "farm" },
  { id: "shop", label: "Tienda", icon: "shop" },
  { id: "arena", label: "Arena", icon: "arena" },
  { id: "connect", label: "Conectar", icon: "connect" },
];
const STAGE = STAGE_NAMES;

/** App frame: header (Tamtam, wallet, DEV) + content + bottom tab bar. */
export function AppShell() {
  const game = useGame();
  const { state, act, now } = game;
  const [tab, setTab] = useState<Tab>("home");
  const [preview, setPreview] = useState<CatalogItem | null>(null);
  const [sheet, setSheet] = useState<null | "profile" | "history" | "debug">(null);
  const [lab, setLab] = useState(false);
  const [games, setGames] = useState(false);
  const [fighting, setFighting] = useState(false);
  const [ritual, setRitual] = useState<null | { force: boolean }>(null);
  const [evoLab, setEvoLab] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = (text: string) => {
    setToastText(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(null), 2200);
  };
  const t = state.tamtam;
  // Coins gained float up; caretaker level-ups show what got unlocked.
  const coinsNow = state.economy.wallet.balances.tamcoin;
  const lvl = state.economy.caretakerLevel;
  const prev = useRef({ coins: coinsNow, lvl, profile: game.profile });
  const [gain, setGain] = useState<{ n: number; k: number } | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (p.profile === game.profile) {
      if (coinsNow > p.coins) setGain({ n: coinsNow - p.coins, k: Date.now() });
      if (lvl > p.lvl) setLevelUp(lvl);
    }
    prev.current = { coins: coinsNow, lvl, profile: game.profile };
  }, [coinsNow, lvl, game.profile]);
  useEffect(() => {
    if (!gain) return;
    const tm = setTimeout(() => setGain(null), 1400);
    return () => clearTimeout(tm);
  }, [gain]);
  const L = peekLife(state);
  const xpPct = Math.min(100, (L.xp / xpForLevel(lvl)) * 100);

  const onBuy = (item: CatalogItem) => {
    try {
      act((s) => {
        buy(s, item.id, newId(), now());
        if (item.category === "surfaces") setFinish(s, item.id.startsWith("wall_") ? "wall" : "floor", item.id);
      });
      toast(item.category === "surfaces" ? `${item.name.es} aplicado en tu casa` : `Has comprado: ${item.name.es}`);
    } catch (e) {
      toast(e instanceof PurchaseError ? "No puedes comprarlo ahora." : "Error en la compra.");
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      {game.profile === "debug" && <Text style={s.debugBanner}>MODO DEBUG · partida de pruebas · reloj simulado</Text>}
      <View style={s.top}>
        <Pressable style={s.ribbon} onPress={() => t && setSheet("profile")} accessibilityRole="button" accessibilityLabel={t ? `Ficha de ${t.name}` : "Huevo"} testID="profile">
          <Text style={s.name} numberOfLines={1}>{t ? t.name : state.phase === "naming" ? "¡Ha nacido!" : "Tu primer huevo"}</Text>
          <Text style={s.sub}>{t ? `${t.formName ?? "Chispín"} · ${STAGE[t.stage]} · Cuidador nv ${lvl}` : "Huevo · en casa"}</Text>
          <View style={s.xpTrack} accessibilityLabel={`Nivel de cuidador ${lvl}`}>
            <View style={[s.xpFill, { width: `${xpPct}%` }]} />
          </View>
        </Pressable>
        <Pressable style={s.wallet} onPress={() => setSheet("history")} accessibilityRole="button" accessibilityLabel={`${state.economy.wallet.balances.tamcoin} Tamcoins, ver historial`}>
          <Coin />
          <Text style={s.coins}>{state.economy.wallet.balances.tamcoin}</Text>
        </Pressable>
        {gain && (
          <Text key={gain.k} style={s.gain} pointerEvents="none">
            +{gain.n}
          </Text>
        )}
        <Btn label="DEV" small tone="dark" onPress={() => setSheet("debug")} testID="dev" />
      </View>

      <View style={{ flex: 1 }}>
        {tab === "home" && <HomeScreen toast={toast} preview={preview} onPreviewDone={() => setPreview(null)} onOpenGames={() => setGames(true)} onEvolve={() => setRitual({ force: false })} />}
        {tab === "farm" && <FarmScreen toast={toast} goHome={() => setTab("home")} />}
        {tab === "shop" && (
          <ShopView
            onBuy={onBuy}
            onPreview={(item) => {
              if (!t) return toast("Abre primero tu huevo en casa.");
              setPreview(item);
              setTab("home");
            }}
          />
        )}
        {tab === "arena" && <ArenaScreen toast={toast} onBattle={setFighting} />}
        {tab === "connect" && <ConnectScreen />}
      </View>

      {!fighting && (
        <View style={s.tabs} accessibilityRole="tablist">
          {TABS.map((x) => {
            const on = tab === x.id;
            return (
              <Pressable
                key={x.id}
                onPress={() => setTab(x.id)}
                style={[s.tab, NO_SELECT]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={x.label}
                testID={`tab-${x.id}`}
              >
                <View style={[s.tabIcon, on && s.tabIconOn]}>
                  <Icon name={x.icon} size={24} color={on ? brand.core : brand.textSoft} accent={on ? brand.core : brand.cyan} />
                </View>
                <Text style={[s.tabLabel, on && s.tabLabelOn]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {sheet === "profile" && t && <ProfileSheet onClose={() => setSheet(null)} />}
      {sheet === "history" && <HistorySheet onClose={() => setSheet(null)} />}
      {sheet === "debug" && (
        <DebugPanel
          onClose={() => setSheet(null)}
          toast={toast}
          onLustreLab={() => { setSheet(null); setLab(true); }}
          onEvolutionLab={() => { setSheet(null); setEvoLab(true); }}
          onForceEvolution={() => { setSheet(null); setTab("home"); setRitual({ force: true }); }}
        />
      )}
      {evoLab && <EvolutionLab onClose={() => setEvoLab(false)} />}
      {ritual && <EvolutionRitual force={ritual.force} onClose={() => setRitual(null)} />}
      {lab && <LustreLab alleleId={state.alleleId} onClose={() => setLab(false)} />}
      {games && <MinigameHub onClose={() => setGames(false)} />}
      {levelUp && (
        <View style={s.lvBack}>
          <View style={s.lvCard}>
            <Text style={s.lvKicker}>¡Subes de nivel como cuidador!</Text>
            <Text style={s.lvBig}>Nivel {levelUp}</Text>
            {[...LEVEL_FEATURES.filter((f) => f.level === levelUp).map((f) => f.label), ...[...SLICE_CATALOG.values()].filter((i) => i.level === levelUp && i.price.amount > 0).map((i) => i.name.es)].map((x) => (
              <Text key={x} style={s.lvItem}>Nuevo: {x}</Text>
            ))}
            <Btn label="¡Genial!" tone="coral" onPress={() => setLevelUp(null)} testID="levelup-ok" />
          </View>
        </View>
      )}
      <Toast text={toastText} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.core },
  debugBanner: { backgroundColor: brand.violet, color: brand.cloud, textAlign: "center", fontFamily: fonts.bodyBold, fontSize: 11, paddingVertical: 3 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 6 },
  ribbon: { flex: 1, backgroundColor: brand.violet, borderRadius: 18, borderWidth: 1.5, borderBottomWidth: 4, borderColor: "#6E2BD6", paddingHorizontal: 14, paddingVertical: 4 },
  name: { fontFamily: fonts.displayBold, fontSize: 22, color: brand.cloud, lineHeight: 28 },
  sub: { fontFamily: fonts.body, fontSize: 11, color: "#E6DCFF", marginTop: -3 },
  wallet: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: brand.panel, borderRadius: 18, borderWidth: 1.5, borderBottomWidth: 4, borderColor: brand.line, paddingHorizontal: 12, height: 48 },
  coins: { fontFamily: fonts.displayBold, fontSize: 18, color: brand.cloud, fontVariant: ["tabular-nums"] },
  xpTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(23,19,43,0.45)", marginTop: 2, marginBottom: 3, overflow: "hidden" },
  xpFill: { height: 4, borderRadius: 2, backgroundColor: brand.gold },
  gain: { position: "absolute", right: 70, top: 48, fontFamily: fonts.displayBold, fontSize: 20, color: brand.gold, textShadowColor: "#000", textShadowRadius: 4 },
  lvBack: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,7,24,0.7)", alignItems: "center", justifyContent: "center" },
  lvCard: { backgroundColor: brand.panel, borderRadius: 24, padding: 22, gap: 8, minWidth: 270, alignItems: "center", borderWidth: 2, borderColor: brand.gold },
  lvKicker: { fontFamily: fonts.bodyBold, fontSize: 14, color: brand.gold },
  lvBig: { fontFamily: fonts.displayBold, fontSize: 40, color: brand.cloud, lineHeight: 48 },
  lvItem: { fontFamily: fonts.bodyBold, fontSize: 14, color: brand.mint },
  tabs: { flexDirection: "row", backgroundColor: brand.panel, borderTopWidth: 1, borderColor: brand.line, paddingTop: 6, paddingBottom: 4 },
  tab: { flex: 1, alignItems: "center", gap: 2, minHeight: 52 },
  tabIcon: { width: 44, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tabIconOn: { backgroundColor: brand.cyan },
  tabLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: brand.textSoft },
  tabLabelOn: { color: brand.cloud },
});
