import { ACCESSORIES, ALBUM, bestiaryStats, equipAccessory, FAMILIES, peekHouse, peekPlay, PIECES_PER_PAINTING, quantity, SLICE_CATALOG, type FamilyId } from "@tamtam/core";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Portrait } from "../creature/Portrait";
import { useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn } from "../ui/kit";

type Tab = "bestiary" | "album" | "wardrobe";

/** Colección: bestiary of forms seen, landscape album and wardrobe (PLAN_MEJORAS phase D). */
export function CollectionPanel({ onClose, toast }: { onClose: () => void; toast: (t: string) => void }) {
  const { state, act } = useGame();
  const [tab, setTab] = useState<Tab>("bestiary");
  const h = peekHouse(state);
  const stats = bestiaryStats(state);
  const entries = Object.values(h.bestiary).sort((a, b) => b.first - a.first);
  const pieces = peekPlay(state).album.pieces;
  const level = state.economy.caretakerLevel;
  return (
    <View style={c.root} testID="collection">
      <View style={c.tabs}>
        {([["bestiary", "Bestiario"], ["album", "Álbum"], ["wardrobe", "Armario"]] as [Tab, string][]).map(([k, label]) => (
          <Btn key={k} small label={label} tone={tab === k ? "coral" : "light"} onPress={() => setTab(k)} style={{ flex: 1 }} testID={`collection-${k}`} />
        ))}
      </View>
      <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 8 }}>
        {tab === "bestiary" && (
          <>
            <Text style={c.desc}>
              Formas vistas: {stats.seen} · criadas por ti: {stats.mine}. Cada evolución y cada rival de la Arena se anota aquí.
            </Text>
            <Text style={c.desc}>{(Object.keys(FAMILIES) as FamilyId[]).map((f) => `${FAMILIES[f].name} ${stats.byFamily[f]}`).join(" · ")}</Text>
            {entries.length === 0 && <Text style={c.desc}>Aún no hay formas. Evoluciona o lucha en la Arena.</Text>}
            <View style={c.grid}>
              {entries.slice(0, 6).map((e) => (
                <View key={e.name + e.first} style={[c.cell, e.mine && { borderColor: brand.gold }]}>
                  <Portrait alleleId={state.alleleId} size={72} genome={e.genome} />
                  <Text style={c.small} numberOfLines={1}>{e.name}</Text>
                  <Text style={[c.small, { color: brand.textDim }]}>{FAMILIES[e.family].name}</Text>
                </View>
              ))}
            </View>
            {entries.length > 6 && <Text style={c.desc}>Y {entries.length - 6} formas más.</Text>}
          </>
        )}
        {tab === "album" && (
          <>
            <Text style={c.desc}>Cada partida de 3 estrellas da una pieza. Con {PIECES_PER_PAINTING} piezas el cuadro es tuyo para colgarlo.</Text>
            {ALBUM.map((id, i) => {
              const got = Math.max(0, Math.min(PIECES_PER_PAINTING, pieces - i * PIECES_PER_PAINTING));
              return (
                <View key={id} style={c.row}>
                  <Text style={[c.name, { flex: 1, color: got === PIECES_PER_PAINTING ? brand.gold : colors.ink }]}>{SLICE_CATALOG.get(id)?.name.es ?? id}</Text>
                  <View style={c.pieces}>
                    {Array.from({ length: PIECES_PER_PAINTING }, (_, k) => <View key={k} style={[c.piece, k < got && { backgroundColor: brand.gold }]} />)}
                  </View>
                </View>
              );
            })}
          </>
        )}
        {tab === "wardrobe" && (
          <>
            {level < 8 ? (
              <Text style={c.desc}>El armario se abre en el nivel 8 de cuidador.</Text>
            ) : (
              <Text style={c.desc}>Compra accesorios en la Tienda (Especial) y pónselos aquí.</Text>
            )}
            {ACCESSORIES.map((a) => {
              const owned = quantity(state.economy.inventory, a.id) > 0;
              const on = h.accessory === a.id;
              return (
                <View key={a.id} style={c.row}>
                  <Text style={[c.name, { flex: 1 }]}>{a.name.es}</Text>
                  <Text style={c.small}>{owned ? (on ? "Puesto" : "En el armario") : `${a.price.amount} TC`}</Text>
                  <Btn small label={on ? "Quitar" : "Poner"} disabled={!owned || level < 8} onPress={() => { act((s) => equipAccessory(s, on ? null : a.id)); toast(on ? "Accesorio guardado" : `Lleva ${a.name.es}`); }} testID={`wear-${a.id}`} />
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      <Btn small label="Cerrar" onPress={onClose} testID="collection-close" />
    </View>
  );
}

const c = StyleSheet.create({
  root: { backgroundColor: brand.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 14, gap: 10 },
  tabs: { flexDirection: "row", gap: 6 },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  small: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink, maxWidth: 80 },
  name: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: 86, alignItems: "center", padding: 4, borderRadius: 14, borderWidth: 1.5, borderColor: brand.line, backgroundColor: brand.core },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  pieces: { flexDirection: "row", gap: 4 },
  piece: { width: 16, height: 16, borderRadius: 4, backgroundColor: brand.line },
});
