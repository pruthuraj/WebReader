import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import * as Brightness from "expo-brightness";
import { Feather } from "@expo/vector-icons";
import { DetailScreen } from "@/components/ui/DetailScreen";
import {
  SegmentRow,
  SelectRow,
  SettingsGroup,
  SettingLinkRow,
  StepperRow,
  ToggleRow,
} from "@/components/ui/settings";
import { useReaderStore, type ReaderAppearance, type TextAlignment } from "@/stores/readerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { readerFontFamily, readerFontLabels, readerFontOptions } from "@/theme/readerFonts";
import { appThemeLabels, type AppThemeName } from "@/theme/appThemes";
import { readerPalettes, type ReaderThemeName } from "@/theme/readerThemes";
import { readerFontSizes, readerLineHeights } from "@/theme/tokens";

function nextNumber(values: readonly number[], current: number, delta: number) {
  const i = Math.max(0, values.indexOf(current as never));
  return values[Math.max(0, Math.min(values.length - 1, i + delta))];
}

const READER_THEMES: { id: ReaderThemeName; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "sepia", label: "Sepia" },
  { id: "dark", label: "Dark" },
  { id: "oled", label: "OLED" },
];

const APP_THEMES: AppThemeName[] = ["light", "dark", "navy", "custom"];

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const appearance = useReaderStore((s) => s.appearance);
  const setAppearance = useReaderStore((s) => s.setAppearance);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);

  const updateAppearance = async (partial: Partial<ReaderAppearance>) => {
    setAppearance(partial);
    await updateSettings({ readerDefaults: { ...appearance, ...partial } });
    if (partial.brightness !== undefined) {
      try {
        if (partial.brightness === null) await Brightness.restoreSystemBrightnessAsync();
        else await Brightness.setBrightnessAsync(partial.brightness);
      } catch {
        // Brightness can be denied; the preference still persists.
      }
    }
  };

  const palette = readerPalettes[appearance.theme];
  const brightnessPct =
    appearance.brightness === null ? null : Math.round(appearance.brightness * 100);

  return (
    <DetailScreen title="Reader Appearance">
      {/* Live preview */}
      <View className="px-4 pt-4">
        <View
          className="rounded-2xl border border-app-border p-5"
          style={{ backgroundColor: palette.bg }}
        >
          <Text
            style={{
              color: palette.fg,
              fontFamily: readerFontFamily(appearance.fontStyle),
              fontSize: appearance.fontSize,
              lineHeight: appearance.fontSize * appearance.lineHeight,
              textAlign: appearance.alignment,
            }}
          >
            The wind on the eastern ridge carried a sound he could not place — not a voice, not a
            song, but something in between.
          </Text>
        </View>
      </View>

      <SettingsGroup title="Font">
        <SelectRow
          label="Font Family"
          value={readerFontLabels[appearance.fontStyle]}
          options={readerFontOptions.map((o) => o.label)}
          onChange={(label) => {
            const opt = readerFontOptions.find((o) => o.label === label);
            if (opt) void updateAppearance({ fontStyle: opt.key });
          }}
        />
        <StepperRow
          label="Font Size"
          value={`${appearance.fontSize}`}
          onMinus={() => void updateAppearance({ fontSize: nextNumber(readerFontSizes, appearance.fontSize, -1) })}
          onPlus={() => void updateAppearance({ fontSize: nextNumber(readerFontSizes, appearance.fontSize, 1) })}
        />
        <StepperRow
          label="Line Height"
          value={appearance.lineHeight.toFixed(1)}
          onMinus={() => void updateAppearance({ lineHeight: nextNumber(readerLineHeights, appearance.lineHeight, -1) })}
          onPlus={() => void updateAppearance({ lineHeight: nextNumber(readerLineHeights, appearance.lineHeight, 1) })}
        />
      </SettingsGroup>

      <SettingsGroup title="Reader Theme">
        <View className="flex-row px-3.5 py-3" style={{ gap: 8 }}>
          {READER_THEMES.map((t) => {
            const on = appearance.theme === t.id;
            const p = readerPalettes[t.id];
            return (
              <Pressable
                key={t.id}
                onPress={() => void updateAppearance({ theme: t.id })}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: on ? "#8B95FF" : "rgba(127,127,127,0.25)",
                  backgroundColor: p.bg,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: p.fg, fontSize: 18, fontWeight: "700" }}>Aa</Text>
                <Text style={{ color: p.fg, fontSize: 11, marginTop: 4 }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SettingsGroup>

      <SettingsGroup
        title="App Theme"
        footnote="Controls the app shell. The reader keeps its own theme above."
      >
        <SegmentRow<AppThemeName>
          label="Theme"
          value={settings.appTheme}
          options={APP_THEMES.map((t) => ({ value: t, label: appThemeLabels[t] }))}
          onChange={(appTheme) => void updateSettings({ appTheme })}
        />
        {settings.appTheme === "custom" ? (
          <SettingLinkRow
            label="Customize colors"
            sub="Edit each palette slot"
            accent
            chevron
            onPress={() => router.push("/settings/theme" as never)}
          />
        ) : null}
      </SettingsGroup>

      <SettingsGroup title="Layout">
        <SegmentRow<TextAlignment>
          label="Text Alignment"
          value={appearance.alignment}
          options={[
            { value: "left", label: "Left" },
            { value: "justify", label: "Justify" },
            { value: "center", label: "Center" },
          ]}
          onChange={(alignment) => void updateAppearance({ alignment })}
        />
        <StepperRow
          label="Margins"
          value={`${appearance.margin}px`}
          onMinus={() => void updateAppearance({ margin: Math.max(12, appearance.margin - 4) })}
          onPlus={() => void updateAppearance({ margin: Math.min(40, appearance.margin + 4) })}
        />
        <StepperRow
          label="Brightness"
          value={brightnessPct === null ? "System" : `${brightnessPct}%`}
          onMinus={() =>
            void updateAppearance({
              brightness:
                appearance.brightness === null
                  ? 0.5
                  : Math.max(0.1, Math.round((appearance.brightness - 0.1) * 10) / 10),
            })
          }
          onPlus={() =>
            void updateAppearance({
              brightness:
                appearance.brightness === null
                  ? 0.7
                  : Math.min(1, Math.round((appearance.brightness + 0.1) * 10) / 10),
            })
          }
        />
        <ToggleRow
          label="Keep Screen Awake"
          sub="Prevents the screen from sleeping while reading"
          value={appearance.keepAwake}
          onChange={(keepAwake) => void updateAppearance({ keepAwake })}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Focus"
        footnote="Soften surrounding text so the active paragraph stays sharp."
      >
        <SettingLinkRow
          label="Focus Blur"
          sub={
            appearance.focus?.enabled
              ? `On · ${appearance.focus.mode === "blurAll" ? "Blur all" : appearance.focus.target}`
              : "Off — keep all text equally sharp"
          }
          chevron
          onPress={() => router.push("/settings/focus" as never)}
        />
      </SettingsGroup>

      <View className="h-4" />
      <Pressable
        onPress={() => router.push("/settings/tts" as never)}
        className="mx-4 mt-2 flex-row items-center justify-center rounded-xl border border-app-border bg-app-surface px-4 py-3 active:opacity-80"
        style={{ gap: 8 }}
      >
        <Feather name="headphones" size={16} color="#8B95FF" />
        <Text className="text-sm font-semibold text-app-text">Text-to-Speech settings</Text>
      </Pressable>
    </DetailScreen>
  );
}
