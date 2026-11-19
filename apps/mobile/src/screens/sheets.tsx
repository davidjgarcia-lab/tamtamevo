import {
  careProfile, CHISPIN_GENOME, FAMILIES, familyOdds, type FamilyId,
  arenaStrength, ageInDays, DEFAULT_CARE_CONFIG, FORM_QUALITY, formQuality, lifeMark, LUSTRE_NAMES, MARK_NAMES, lustre, SKILL_VARIANT_NAMES, FOODS, history, itemStatus, placedCount, quantity, rename, satisfaction, SLICE_CATALOG,
  validateName, xpToNext, type CatalogItem, type ShopCategory,
} from "@tamtam/core";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Bar, Btn, Coin, Sheet } from "../ui/kit";
import { FoodIcon } from "../ui/FoodIcon";
import { ItemIcon } from "../ui/ItemIcon";

const RARITY: Record<string, string> = { common: "Común", uncommon: "Poco común", rare: "Raro", epic: "Épico" };

export function FoodSheet({ onClose, onFeed }: { onClose: () => void; onFeed: (foodId: string) => void }) {
  const { state } = useGame();
  const foods = Object.values(FOODS).filter((f) => quantity(state.economy.inventory, f.id) > 0);
  return (
    <Sheet title="¿Qué le das de comer?" onClose={onClose}>
      {foods.length === 0 ? (
        <Text style={k.empty}>No te queda comida. Compra más en la Tienda (categoría Comida).</Text>
      ) : (
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          {foods.map((f) => (
            <View key={f.id} style={k.card}>
              <FoodIcon id={f.id} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={k.name}>
                  {f.item.name.es} <Text style={k.qty}>×{quantity(state.economy.inventory, f.id)}</Text>
                </Text>
                <Text style={k.desc}>
                  Hambre +{f.hunger}
                  {f.energy ? ` · Energía +${f.energy}` : ""}
                  {f.favoriteOf.includes("fire") ? " · Favorita" : ""}
                  {f.dislikedBy.includes("fire") ? " · No le gusta" : ""}
                  {f.buff ? " · +5% FUE próximo combate" : ""}
                </Text>
              </View>
              <Btn label="Dar" tone="coral" small onPress={() => onFeed(f.id)} testID={`feed-${f.id}`} />
            </View>
          ))}
        </ScrollView>
      )}
    </Sheet>
  );
}

const CATS: { id: ShopCategory; label: string }[] = [
  { id: "food", label: "Comida" },
  { id: "furniture", label: "Mobiliario" },
  { id: "decoration", label: "Decoración" },
  { id: "lighting", label: "Iluminación" },
  { id: "equipment", label: "Equipamiento" },
];

/** Tienda (its own section of the app, outside the room). */
export function ShopView({ onBuy, onPreview }: { onBuy: (item: CatalogItem) => void; onPreview: (item: CatalogItem) => void }) {
  const { state } = useGame();
  const [cat, setCat] = useState<ShopCategory>("food");
  const items = [...SLICE_CATALOG.values()].filter((i) => i.category === cat && i.price.amount > 0);
  return (
    <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}>
      <Text style={k.screenTitle}>Tienda</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>
        {CATS.map((c) => (
          <Btn key={c.id} label={c.label} small tone={c.id === cat ? "dark" : "light"} onPress={() => setCat(c.id)} />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
        {items.length === 0 && <Text style={k.empty}>No hay artículos en esta categoría todavía.</Text>}
        {items.map((it) => {
          const st = itemStatus(state.economy, it);
          const owned = quantity(state.economy.inventory, it.id);
          const label =
            st.status === "available" ? `Comprar · ${it.price.amount}` : st.status === "owned" ? "Máximo alcanzado" : st.status === "too_expensive" ? `Faltan ${st.missing}` : "Bloqueado";
          return (
            <View key={it.id} style={k.card}>
              <View style={k.thumb}>
                <ItemIcon id={it.id} size={56} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={k.name}>{it.name.es}</Text>
                <Text style={k.desc}>
                  {RARITY[it.rarity]} · {it.price.amount} TC{owned ? ` · Tienes ${owned}` : ""}
                  {it.furniture?.comfort ? ` · Confort +${it.furniture.comfort}` : ""}
                </Text>
                {it.description.es ? <Text style={k.desc}>{it.description.es}</Text> : null}
              </View>
              <View style={{ gap: 6 }}>
                {it.furniture && st.status !== "owned" && <Btn label="Probar en mi casa" small onPress={() => onPreview(it)} />}
                <Btn label={label} small tone="gold" disabled={st.status !== "available"} onPress={() => onBuy(it)} testID={`buy-${it.id}`} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function HistorySheet({ onClose }: { onClose: () => void }) {
  const { state } = useGame();
  const rows = history(state.economy.wallet, "tamcoin", 60);
  const label = (src: string) =>
    src === "welcome" ? "Regalo de bienvenida" : src === "activity:gym" ? "Gimnasio" : src === "activity:academy" ? "Estudio" : src === "arena" ? "Arena" : src.startsWith("minigame:") ? "Minijuego" : src === "debug" ? "Ajuste (modo debug)" : src.startsWith("shop:") ? SLICE_CATALOG.get(src.slice(5))?.name.es ?? src : src.startsWith("upgrade:gym") ? "Mejora del Gym" : src;
  return (
    <Sheet title="Monedero" onClose={onClose} tall>
      <View style={k.balance}>
        <Coin size={22} />
        <Text style={k.balanceText}>{state.economy.wallet.balances.tamcoin} Tamcoins</Text>
      </View>
      <ScrollView contentContainerStyle={{ gap: 4 }}>
        {rows.map((e) => (
          <View key={e.id} style={k.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={k.txLabel}>{label(e.source)}</Text>
              <Text style={k.txDate}>{new Date(e.ts).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</Text>
            </View>
            <Text style={[k.txAmount, { color: e.amount > 0 ? brand.mint : brand.pink }]}>
              {e.amount > 0 ? "+" : ""}
              {e.amount}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const ATTR: { id: "str" | "int" | "cre" | "nat" | "man"; label: string }[] = [
  { id: "str", label: "Fuerza" },
  { id: "int", label: "Inteligencia" },
  { id: "cre", label: "Creatividad" },
  { id: "nat", label: "Af. natural" },
  { id: "man", label: "H. manual" },
];

export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { state, act, now } = useGame();
  const t = state.tamtam!;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(t.name);
  const [err, setErr] = useState<string | null>(null);
  const arena = arenaStrength(state);
  const need = DEFAULT_CARE_CONFIG.maturityThresholds.baby;
  const stageNames: Record<string, string> = { baby: "Bebé", child: "Infantil", juvenile: "Juvenil", adult: "Adulto" };
  const save = () => {
    const r = validateName(draft);
    if (!r.ok) return setErr("Nombre no válido (2–16 caracteres, sin símbolos raros).");
    act((s) => rename(s, draft, now()));
    setEditing(false);
    setErr(null);
  };
  return (
    <Sheet title={t.name} onClose={onClose} tall>
      <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
        <Text style={k.desc}>
          {t.formName ?? "Brasálido · Chispín"} ({stageNames[t.stage]}) · Nivel {t.level} · {ageInDays(t, now())} días · Juguetón, Glotón
        </Text>
        {editing ? (
          <View style={{ gap: 6 }}>
            <TextInput value={draft} onChangeText={setDraft} style={k.input} accessibilityLabel="Nuevo nombre" autoFocus />
            {err && <Text style={k.err}>{err}</Text>}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Btn label="Cancelar" small onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <Btn label="Guardar nombre" tone="coral" small onPress={save} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <Btn label="Cambiar nombre" small onPress={() => { setDraft(t.name); setEditing(true); }} />
        )}

        <Text style={k.section}>Necesidades</Text>
        <Bar label="Hambre" value={state.care.needs.hunger} color={brand.orange} />
        <Bar label="Higiene" value={state.care.needs.hygiene} color={brand.cyan} />
        <Bar label="Felicidad" value={state.care.needs.happiness} color={brand.gold} />
        <Bar label="Cariño" value={state.care.needs.affection} color={brand.pink} />
        <Bar label="Energía" value={state.care.needs.energy} color={brand.violet} />
        <Bar label="Actividad" value={state.care.needs.activity} color={brand.mint} />
        <Text style={k.desc}>Satisfacción media: {Math.round(satisfaction(state.care.needs))}</Text>

        <Text style={k.section}>Lustre · {LUSTRE_NAMES[lustre(state.care, t).tier]}</Text>
        {(() => {
          const l = lustre(state.care, t);
          return (
            <>
              <Bar label="Lustre" value={l.score} color={brand.gold} />
              <Text style={k.desc}>
                Cuidados {Math.round(l.care)} · Actividades {Math.round(l.activity)} · Arena {Math.round(l.arena)} · Vínculo {Math.round(l.bond)}
                {l.toNext > 0 ? ` · faltan ${Math.ceil(l.toNext)} puntos para el siguiente nivel` : ""}
              </Text>
              <Text style={k.desc}>Marca de vida: {MARK_NAMES[lifeMark(t)]}.</Text>
              <Text style={k.desc}>
                Al evolucionar, el Lustre de ese momento se graba en la nueva forma: aspecto (adornos, halo, brillo), estadísticas de combate y habilidades. Calidad de la forma actual:{" "}
                {t.formQuality ? LUSTRE_NAMES[t.formQuality] : "aún sin Ritual"} · stats ×{FORM_QUALITY[formQuality(t)].statMul} · habilidades {SKILL_VARIANT_NAMES[FORM_QUALITY[formQuality(t)].variant]}.
              </Text>
            </>
          );
        })()}

        <Text style={k.section}>Crecimiento y evolución</Text>
        {(() => {
          const need = t.stage === "adult" ? 1 : t.stage === "baby" ? DEFAULT_CARE_CONFIG.maturityThresholds.baby : t.stage === "child" ? DEFAULT_CARE_CONFIG.maturityThresholds.child - DEFAULT_CARE_CONFIG.maturityThresholds.baby : DEFAULT_CARE_CONFIG.maturityThresholds.juvenile - DEFAULT_CARE_CONFIG.maturityThresholds.child;
          const prof = careProfile(state.care.log, state.care);
          const odds = familyOdds(prof, t.genome ?? CHISPIN_GENOME);
          const top = (Object.keys(odds) as FamilyId[]).sort((a, b) => odds[b] - odds[a]).slice(0, 4);
          return (
            <>
              <Bar label="Madurez" value={t.stage === "adult" ? 100 : (Math.min(state.care.maturity, need) / need) * 100} color="#FF6B35" />
              <Text style={k.desc}>
                {t.stage === "adult" ? "Forma adulta definitiva." : state.care.maturity >= need ? "¡Listo para el Ritual de Evolución! Búscalo en Casa." : "Crece más rápido con buenos cuidados y tiempo de juego."}
              </Text>
              {t.genome && (
                <Text style={k.desc}>
                  Forma {t.formName}: cuerpo {FAMILIES[t.genome.parts.body].name}, cabeza {FAMILIES[t.genome.parts.head].name}, patas {FAMILIES[t.genome.parts.legs].name}, cola {FAMILIES[t.genome.parts.tail].name}, lomo {FAMILIES[t.genome.parts.back].name}.
                </Text>
              )}
              {t.stage !== "adult" && (
                <>
                  <Text style={k.desc}>Cómo lo estás criando en esta etapa:</Text>
                  <Bar label="Cuidados" value={prof.care * 100} color={brand.mint} />
                  <Bar label="Mimos" value={prof.affection * 100} color={brand.pink} />
                  <Bar label="Higiene" value={prof.hygiene * 100} color={brand.cyan} />
                  <Bar label="Entreno" value={prof.training * 100} color={brand.orange} />
                  <Bar label="Combate" value={prof.fighting * 100} color="#FF6B35" />
                  <Bar label="Estudio" value={prof.study * 100} color={brand.blue} />
                  <Bar label="Juego" value={prof.play * 100} color={brand.gold} />
                  <Text style={k.desc}>
                    Tendencia de la próxima evolución: {top.map((f) => `${FAMILIES[f].name} ${Math.round(odds[f] * 100)}%`).join(" · ")}. Cada pieza (cuerpo, cabeza, patas, cola, lomo) se sortea con estas probabilidades; algunas se heredan y alguna puede mutar.
                  </Text>
                </>
              )}
            </>
          );
        })()}

        <Text style={k.section}>Atributos aprendidos</Text>
        {ATTR.map((a) => (
          <Bar key={a.id} label={`${a.label} ${t.attributes[a.id].level}`} value={(t.attributes[a.id].xp / xpToNext(t.attributes[a.id].level)) * 100} color={brand.blue} />
        ))}

        <Text style={k.section}>Fuerza en Arena</Text>
        <Text style={k.desc}>
          FUE {arena.total} = base {arena.base} (calidad de forma ×{FORM_QUALITY[formQuality(t)].statMul}) + atributo Fuerza {arena.fromAttribute} + Gym {arena.fromTraining} + comida {arena.fromFood}
        </Text>
        <Text style={k.desc}>Sesiones de Gym: {state.gym.sessions} · cada 10 sesiones, +1 FUE permanente.</Text>
        <Text style={k.section}>Historial de evolución</Text>
        <Text style={k.desc}>{t.evolutionHistory.length === 0 ? "Aún no ha evolucionado." : t.evolutionHistory.map((h) => `${h.from} → ${h.to}`).join("\n")}</Text>
      </ScrollView>
    </Sheet>
  );
}

export function InventoryTray({ onPick, selected }: { onPick: (itemId: string) => void; selected: string | null }) {
  const { state } = useGame();
  const free = [...SLICE_CATALOG.values()].filter((i) => i.furniture && quantity(state.economy.inventory, i.id) - placedCount(state.room, i.id) > 0);
  if (free.length === 0) return <Text style={[k.desc, { textAlign: "center" }]}>Todos tus muebles están colocados. Compra más en la Tienda.</Text>;
  return (
    <ScrollView horizontal contentContainerStyle={{ gap: 6 }} showsHorizontalScrollIndicator={false}>
      {free.map((i) => (
        <Btn key={i.id} small label={`${i.name.es} ×${quantity(state.economy.inventory, i.id) - placedCount(state.room, i.id)}`} tone={selected === i.id ? "dark" : "light"} onPress={() => onPick(i.id)} />
      ))}
    </ScrollView>
  );
}

const k = StyleSheet.create({
  empty: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 14, paddingVertical: 12 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 12 },
  name: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  qty: { fontFamily: fonts.bodyBold, color: colors.inkSoft, fontSize: 14 },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  balance: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  balanceText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  txLabel: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  txDate: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  txAmount: { fontFamily: fonts.displayBold, fontSize: 18, fontVariant: ["tabular-nums"] },
  screenTitle: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginBottom: 6 },
  thumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: brand.core, alignItems: "center", justifyContent: "center" },
  section: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.ink, marginTop: 8 },
  input: { height: 48, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: brand.core, paddingHorizontal: 14, fontSize: 18, fontFamily: fonts.display, color: colors.ink },
  err: { color: brand.pink, fontFamily: fonts.body, fontSize: 13 },
});
