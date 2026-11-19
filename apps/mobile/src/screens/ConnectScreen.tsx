import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn } from "../ui/kit";
import { Icon } from "../ui/icons";

/** Friend code derived from the Tamtam/save (stable, 8 characters, no ambiguous letters). */
function friendCode(seed: string): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += abc[h % abc.length];
    h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0;
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

/**
 * Conectar: two players who know each other link by friend code, then visit each other's room
 * (their Tamtams play together) or hold a friendly fight. Requires the online service, which is
 * NOT part of this offline prototype: the screen is honest about it.
 */
export function ConnectScreen() {
  const { state } = useGame();
  const [code, setCode] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const mine = friendCode(`${state.createdAt}:${state.tamtam?.id ?? state.egg?.tamtamId ?? ""}`);
  const valid = /^[A-Z2-9]{4}-?[A-Z2-9]{4}$/.test(code.trim().toUpperCase());
  return (
    <ScrollView contentContainerStyle={c.root} keyboardShouldPersistTaps="handled">
      <Text style={c.title}>Conectar</Text>
      <Text style={c.lead}>Juega con amigos que conoces: que vuestros Tamtams jueguen juntos en la misma habitación o que se enfrenten en un combate amistoso.</Text>
      <View style={c.card}>
        <Text style={c.label}>Tu código de amigo</Text>
        <Text style={c.code} selectable>{mine}</Text>
        <Text style={c.desc}>Compártelo solo con personas que conozcas.</Text>
      </View>
      <View style={c.card}>
        <Text style={c.label} nativeID="friendLabel">Añadir amigo</Text>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          placeholder="ABCD-1234"
          placeholderTextColor={brand.textDim}
          autoCapitalize="characters"
          maxLength={9}
          style={c.input}
          accessibilityLabelledBy="friendLabel"
          testID="friend-code"
        />
        <Btn
          label="Guardar amigo"
          tone="coral"
          disabled={!valid}
          onPress={() => {
            const v = code.trim().toUpperCase().replace(/^(\w{4})(\w{4})$/, "$1-$2");
            if (!friends.includes(v)) setFriends([...friends, v]);
            setCode("");
          }}
        />
      </View>
      {friends.map((f) => (
        <View key={f} style={c.friend}>
          <Icon name="connect" size={26} accent={brand.cyan} />
          <Text style={[c.label, { flex: 1 }]}>{f}</Text>
          <Btn small label="Jugar juntos" disabled onPress={() => undefined} />
          <Btn small label="Combate" disabled tone="pink" onPress={() => undefined} />
        </View>
      ))}
      <View style={c.notice}>
        <Icon name="lock" size={28} accent={brand.gold} />
        <Text style={[c.desc, { flex: 1 }]}>
          Requiere el servicio online (cuentas, emparejamiento y sincronización en tiempo real), que todavía no existe en esta versión de prueba. Los amigos que guardes aquí solo se recuerdan en esta sesión y los botones de visita y combate están desactivados hasta que el servidor esté listo.
        </Text>
      </View>
    </ScrollView>
  );
}

const c = StyleSheet.create({
  root: { padding: 12, gap: 10 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink },
  lead: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  card: { backgroundColor: brand.panel, borderRadius: 18, borderWidth: 1.5, borderColor: brand.line, padding: 14, gap: 8 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  code: { fontFamily: fonts.displayBold, fontSize: 34, color: brand.cyan, letterSpacing: 3 },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  input: { height: 52, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: brand.core, paddingHorizontal: 16, fontSize: 22, fontFamily: fonts.display, color: colors.ink, letterSpacing: 2 },
  friend: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: brand.panel, borderRadius: 18, padding: 10 },
  notice: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: brand.gold },
});
