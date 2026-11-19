import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts } from "../theme";

export function Btn({
  label, onPress, tone = "light", disabled, small, icon, style, testID,
}: {
  label: string; onPress: () => void; tone?: "light" | "coral" | "dark" | "gold"; disabled?: boolean; small?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string;
}) {
  const bg = { light: colors.card, coral: colors.coral, dark: colors.ink, gold: "#FFB627" }[tone];
  const border = { light: colors.line, coral: colors.coralDark, dark: "#14101C", gold: "#D98E00" }[tone];
  const fg = tone === "light" || tone === "gold" ? colors.ink : "#FFFFFF";
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        small && s.small,
        { backgroundColor: bg, borderColor: border },
        pressed && !disabled && s.pressed,
        disabled && s.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[s.btnText, small && s.btnTextSmall, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Sheet({ title, onClose, children, tall }: { title: string; onClose: () => void; children: ReactNode; tall?: boolean }) {
  return (
    <View style={s.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
      <View style={[s.sheet, tall && s.tall]}>
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel={`Cerrar ${title}`}>
            <Text style={s.closeText}>✕</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  );
}

export function Coin({ size = 18 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#FFB627", borderWidth: 2, borderColor: "#B86E00", alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.36, height: size * 0.36, borderRadius: size, borderWidth: 1.5, borderColor: "#B86E00" }} />
    </View>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={s.toast} pointerEvents="none" accessibilityLiveRegion="polite">
      <Text style={s.toastText}>{text}</Text>
    </View>
  );
}

export function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <View style={s.barRow} accessibilityLabel={`${label} ${Math.round(value)} de 100`}>
      <Text style={s.barLabel}>{label}</Text>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${Math.max(2, Math.min(100, value))}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.barValue}>{Math.round(value)}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: 16, borderWidth: 2, borderBottomWidth: 5, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  small: { minHeight: 40, borderRadius: 12, paddingHorizontal: 10 },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 3 },
  disabled: { opacity: 0.45 },
  btnText: { fontFamily: fonts.display, fontSize: 15 },
  btnTextSmall: { fontSize: 13 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(26,14,30,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, paddingBottom: 28, maxHeight: "78%" },
  tall: { maxHeight: "92%" },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sheetTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  closeText: { fontSize: 16, color: colors.ink, fontFamily: fonts.bodyBold },
  toast: { position: "absolute", top: 110, alignSelf: "center", backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, maxWidth: "88%" },
  toastText: { color: "#FFF4E2", fontFamily: fonts.body, fontSize: 14, textAlign: "center" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 3 },
  barLabel: { width: 82, fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  barTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: "#EADFCF", overflow: "hidden" },
  barFill: { height: 12, borderRadius: 6 },
  barValue: { width: 30, textAlign: "right", fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
});
