import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand, fonts } from "../theme";
import { Icon, type ICONS } from "../ui/icons";
import { NO_SELECT } from "./GymPanel";

/** Square care action: icon on a coloured badge + short label. */
export function IconAction({
  icon, label, color, onPress, disabled, badge, testID,
}: { icon: keyof typeof ICONS; label: string; color: string; onPress: () => void; disabled?: boolean; badge?: number; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [a.btn, NO_SELECT, pressed && !disabled && a.pressed, disabled && a.disabled]}
    >
      <View style={[a.badge, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color={brand.core} accent={brand.cloud} stroke={2.4} />
      </View>
      <Text style={a.label} numberOfLines={1}>{label}</Text>
      {badge ? (
        <View style={a.count}>
          <Text style={a.countText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const a = StyleSheet.create({
  btn: { flex: 1, minHeight: 64, borderRadius: 16, backgroundColor: brand.panelHi, borderWidth: 1.5, borderBottomWidth: 4, borderColor: brand.line, alignItems: "center", justifyContent: "center", paddingVertical: 5, gap: 2 },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  disabled: { opacity: 0.45 },
  badge: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: brand.cloud },
  count: { position: "absolute", top: -4, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: brand.pink, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  countText: { fontFamily: fonts.bodyBold, fontSize: 11, color: brand.cloud },
});
