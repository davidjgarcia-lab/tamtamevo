import { DEFAULT_NAMES, nameNewTamtam, starterOf, validateName, type NameError } from "@tamtam/core";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useGame } from "../game/GameProvider";
import { brand, colors, fonts } from "../theme";
import { Btn } from "../ui/kit";

const ERRORS: Record<NameError, string> = {
  empty: "Escribe un nombre o pulsa «Sugerir».",
  too_short: "Necesita al menos 2 caracteres.",
  too_long: "Máximo 16 caracteres.",
  invalid_characters: "Hay caracteres que no se pueden usar.",
  no_letters: "Incluye al menos una letra o número.",
  blocked: "Ese nombre no está permitido.",
};

/** Naming happens right in the room, under the newborn Tamtam (no separate screen). */
export function NamingPanel() {
  const { act, now, state } = useGame();
  const starter = starterOf(state.egg?.formId);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const result = validateName(name);
  const len = [...name.normalize("NFC")].length;
  const bad = touched && !result.ok && name !== "";

  const suggest = () => {
    const key = ({ plant: "nature", shadow: "dark", rock: "earth", plasma: "cosmos" } as Record<string, string>)[starter?.family ?? ""] ?? starter?.family ?? "fire";
    const list = DEFAULT_NAMES[key] ?? DEFAULT_NAMES.fire!;
    setName(list[Math.floor(Math.random() * list.length)]!);
    setTouched(true);
  };
  const confirm = () => {
    setTouched(true);
    if (name.trim() !== "" && !result.ok) return;
    act((s) => nameNewTamtam(s, name, now()));
  };

  return (
    <View style={st.form}>
      <Text style={st.kicker}>{starter ? `¡Ha nacido un ${starter.species}!` : "¡Ha nacido un Brasálido!"}</Text>
      {starter && <Text style={st.label}>{starter.title} · {starter.traitLabels.join(", ")}</Text>}
      <Text style={st.label} nativeID="nameLabel">¿Cómo se llamará tu Tamtam?</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched(true)}
        placeholder="p. ej. Brasa"
        placeholderTextColor={brand.textDim}
        maxLength={40}
        style={[st.input, bad && st.inputError]}
        accessibilityLabelledBy="nameLabel"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={confirm}
        testID="name-input"
      />
      <Text style={[st.help, bad && st.helpError]}>{bad ? ERRORS[result.error] : `${len}/16 · Si lo dejas vacío, elegiremos uno por ti.`}</Text>
      <View style={st.row}>
        <Btn label="Sugerir" onPress={suggest} style={{ flex: 1 }} />
        <Btn label="Confirmar nombre" tone="coral" onPress={confirm} style={{ flex: 2 }} testID="confirm-name" />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  form: { backgroundColor: brand.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 6 },
  kicker: { fontFamily: fonts.displayBold, color: brand.cyan, fontSize: 20 },
  label: { fontFamily: fonts.bodyBold, color: colors.inkSoft, fontSize: 13 },
  input: { height: 52, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: brand.core, paddingHorizontal: 16, fontSize: 20, fontFamily: fonts.display, color: colors.ink },
  inputError: { borderColor: brand.pink },
  help: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 12 },
  helpError: { color: brand.pink },
  row: { flexDirection: "row", gap: 10, marginTop: 4 },
});
