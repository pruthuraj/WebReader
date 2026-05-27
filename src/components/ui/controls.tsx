import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useAppPalette } from "@/theme/useAppPalette";

/** Pill toggle matching the ref (green track when on, white thumb). */
export function Toggle({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel?: string;
}) {
  const palette = useAppPalette();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: value ? palette.success : "rgba(127,127,127,0.28)",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#fff",
          marginLeft: value ? 20 : 2,
        }}
      />
    </Pressable>
  );
}

/** − value + stepper (ref `stepper`). */
export function Stepper({
  value,
  onMinus,
  onPlus,
}: {
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const palette = useAppPalette();
  const btn = "h-7 w-7 items-center justify-center rounded-lg bg-app-surface-2 active:opacity-70";
  return (
    <View className="flex-row items-center">
      <Pressable onPress={onMinus} className={btn} accessibilityLabel="Decrease">
        <Text style={{ color: palette.text, fontSize: 16, fontWeight: "600" }}>−</Text>
      </Pressable>
      <Text className="mx-3 min-w-[44px] text-center text-sm text-app-text">{value}</Text>
      <Pressable onPress={onPlus} className={btn} accessibilityLabel="Increase">
        <Text style={{ color: palette.text, fontSize: 16, fontWeight: "600" }}>+</Text>
      </Pressable>
    </View>
  );
}

/** Inline segmented selector inside a surface-2 track (ref `SSegmented`). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-[10px] border border-app-border bg-app-surface-2 p-[3px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`flex-1 items-center rounded-[7px] py-[7px] ${on ? "bg-app-surface-3" : ""}`}
          >
            <Text
              className={`text-xs font-semibold ${on ? "text-app-text" : "text-app-text-muted"}`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pill chip (ref `Chip`). */
export function Chip({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <View
      className={`mr-1.5 mt-2 rounded-full px-2.5 py-1 ${
        accent ? "bg-app-accent-dim" : "bg-app-surface-2"
      }`}
    >
      <Text
        className={`text-[11px] font-semibold tracking-wide ${
          accent ? "text-app-accent" : "text-app-text-dim"
        }`}
      >
        {children}
      </Text>
    </View>
  );
}
