import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup } from "@/components/ui/settings";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  customPaletteSlots,
  defaultCustomPalette,
  type AppPalette,
} from "@/theme/appThemes";

function isColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value) || /^rgba?\(/.test(value);
}

export default function CustomThemeScreen() {
  const customPalette = useSettingsStore((s) => s.settings.customPalette);
  const appTheme = useSettingsStore((s) => s.settings.appTheme);
  const updateSettings = useSettingsStore((s) => s.update);
  const [draft, setDraft] = useState<AppPalette>(customPalette);

  const commit = (next: AppPalette) => {
    setDraft(next);
    // Persist immediately; only flip the active theme to custom on first edit so
    // the user sees the change live.
    void updateSettings({ customPalette: next, appTheme: "custom" });
  };

  const onChangeSlot = (key: keyof AppPalette, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (isColor(value)) void updateSettings({ customPalette: next, appTheme: "custom" });
  };

  return (
    <DetailScreen title="Custom Theme">
      {/* Live preview built from the draft palette. */}
      <View className="px-4 pt-4">
        <View
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: draft.bg, borderWidth: 1, borderColor: draft.border }}
        >
          <View className="p-4" style={{ backgroundColor: draft.surface }}>
            <Text style={{ color: draft.text, fontSize: 16, fontWeight: "700" }}>Sample surface</Text>
            <Text style={{ color: draft.textMuted, fontSize: 12, marginTop: 4 }}>
              Muted secondary text
            </Text>
            <View
              className="mt-3 self-start rounded-full px-4 py-2"
              style={{ backgroundColor: draft.accent }}
            >
              <Text style={{ color: draft.onAccent, fontSize: 13, fontWeight: "700" }}>Accent</Text>
            </View>
          </View>
        </View>
        {appTheme !== "custom" ? (
          <Pressable
            onPress={() => void updateSettings({ appTheme: "custom", customPalette: draft })}
            className="mt-3 rounded-xl bg-app-accent px-4 py-3 active:opacity-80"
          >
            <Text className="text-center text-sm font-bold text-app-on-accent">
              Use this theme
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => commit({ ...defaultCustomPalette })}
          className="mt-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-semibold text-app-text">Reset to default</Text>
        </Pressable>
      </View>

      <SettingsGroup title="Colors" footnote="Enter hex (#RRGGBB) or rgba() values. Changes apply live.">
        {customPaletteSlots.map((slot) => (
          <View key={slot.key} className="min-h-[44px] flex-row items-center px-3.5 py-2.5" style={{ gap: 10 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                backgroundColor: draft[slot.key],
                borderWidth: 1,
                borderColor: "rgba(127,127,127,0.3)",
              }}
            />
            <Text className="flex-1 text-[14.5px] text-app-text">{slot.label}</Text>
            <TextInput
              value={draft[slot.key]}
              onChangeText={(v) => onChangeSlot(slot.key, v)}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#7782A0"
              className="min-w-[110px] rounded-lg bg-app-surface-2 px-2.5 py-1.5 text-right text-[13px] text-app-text"
              style={{ fontFamily: "monospace" }}
            />
          </View>
        ))}
      </SettingsGroup>
    </DetailScreen>
  );
}
