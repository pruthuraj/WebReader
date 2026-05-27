import { Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SegmentRow, SettingsGroup, SliderRow, ToggleRow } from "@/components/ui/settings";
import {
  useReaderStore,
  type FocusMode,
  type FocusSettings,
  type FocusTarget,
  type FocusWindow,
} from "@/stores/readerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { readerFontFamily } from "@/theme/readerFonts";
import { readerPalettes } from "@/theme/readerThemes";

const PREVIEW_LINES = [
  "Aris climbed the spire on a morning the color of cold tea.",
  "He carried a tablet and a stolen coin he had kept for years.",
  "Halfway up he paused at the bend the locals called the Step of Forgetting.",
  "A name spoke back from the stone.",
];

function FocusPreview({ focus, theme }: { focus: FocusSettings; theme: keyof typeof readerPalettes }) {
  const palette = readerPalettes[theme];
  const blurAll = focus.mode === "blurAll";
  const dimAlpha = Math.min(0.9, (focus.dim / 100) * 0.85 + (focus.blur / 15) * 0.25);
  const activeLine = 1;
  return (
    <View
      className="overflow-hidden rounded-2xl border border-app-border p-4"
      style={{ backgroundColor: palette.bg }}
    >
      {PREVIEW_LINES.map((line, i) => {
        const clear = !focus.enabled || blurAll ? !blurAll : i === activeLine;
        const dimmed = focus.enabled && (blurAll || i !== activeLine);
        return (
          <Text
            key={i}
            style={{
              color: palette.fg,
              fontFamily: readerFontFamily("lora"),
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 6,
              opacity: dimmed ? 1 - dimAlpha : 1,
              backgroundColor: clear && focus.enabled && i === activeLine ? palette.accent + "2E" : "transparent",
            }}
          >
            {line}
          </Text>
        );
      })}
      {focus.enabled && blurAll ? (
        <BlurView
          intensity={Math.round((focus.blur / 15) * 100)}
          tint={theme === "light" || theme === "sepia" ? "light" : "dark"}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      <Text className="mt-1 text-[11px] font-bold uppercase tracking-wide text-app-text-muted">
        Preview · {blurAll ? "Blur all" : "Focus"}
      </Text>
    </View>
  );
}

export default function FocusSettingsScreen() {
  const appearance = useReaderStore((s) => s.appearance);
  const setAppearance = useReaderStore((s) => s.setAppearance);
  const updateSettings = useSettingsStore((s) => s.update);
  const focus = appearance.focus;

  const updateFocus = async (partial: Partial<FocusSettings>) => {
    const nextFocus = { ...focus, ...partial };
    setAppearance({ focus: nextFocus });
    await updateSettings({ readerDefaults: { ...appearance, focus: nextFocus } });
  };

  const isFocusMode = focus.mode === "focus";

  return (
    <DetailScreen title="Focus Blur">
      <View className="px-4 pt-4">
        <FocusPreview focus={focus} theme={appearance.theme} />
      </View>

      <SettingsGroup
        title="Focus Blur"
        footnote="RN can't blur individual paragraphs, so Focus mode dims the surrounding text; Blur All overlays a real blur across the reader."
      >
        <ToggleRow label="Enable Focus Blur" value={focus.enabled} onChange={(v) => void updateFocus({ enabled: v })} />
      </SettingsGroup>

      <SettingsGroup title="Mode">
        <SegmentRow<FocusMode>
          label="Blur Mode"
          value={focus.mode}
          options={[
            { value: "focus", label: "Focus" },
            { value: "blurAll", label: "Blur all" },
          ]}
          onChange={(mode) => void updateFocus({ mode })}
        />
      </SettingsGroup>

      <SettingsGroup title={isFocusMode ? "Effect" : "Blur All Amount"}>
        <SliderRow
          label={isFocusMode ? "Blur Strength" : "Whole Reader Blur"}
          value={focus.blur}
          onChange={(v) => void updateFocus({ blur: Math.round(v) })}
          min={0}
          max={15}
          step={1}
          suffix="px"
          disabled={!focus.enabled}
        />
        {isFocusMode ? (
          <SliderRow
            label="Dim Outside Area"
            value={focus.dim}
            onChange={(v) => void updateFocus({ dim: Math.round(v) })}
            disabled={!focus.enabled}
          />
        ) : null}
      </SettingsGroup>

      {isFocusMode ? (
        <SettingsGroup title="Focus Area">
          <SegmentRow<FocusTarget>
            label="Focus Target"
            sub="What stays clear at any moment"
            value={focus.target}
            options={[
              { value: "line", label: "Line" },
              { value: "sentence", label: "Sentence" },
              { value: "paragraph", label: "Paragraph" },
              { value: "visible", label: "Visible" },
            ]}
            onChange={(target) => void updateFocus({ target })}
          />
          <SegmentRow<FocusWindow>
            label="Focus Window"
            sub="How much text around the target stays clear"
            value={focus.window}
            options={[
              { value: "narrow", label: "Narrow" },
              { value: "medium", label: "Medium" },
              { value: "wide", label: "Wide" },
            ]}
            onChange={(window) => void updateFocus({ window })}
          />
          <ToggleRow
            label="Animate Focus Movement"
            value={focus.animate}
            onChange={(v) => void updateFocus({ animate: v })}
          />
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="When to Use">
        <ToggleRow
          label="During TTS Playback"
          sub={isFocusMode ? "Currently spoken sentence stays clear" : "Blur the reader while TTS plays"}
          value={focus.duringTTS}
          onChange={(v) => void updateFocus({ duringTTS: v })}
        />
        <ToggleRow
          label="During Manual Reading"
          sub="Applies while reading without TTS"
          value={focus.duringManual}
          onChange={(v) => void updateFocus({ duringManual: v })}
        />
      </SettingsGroup>
    </DetailScreen>
  );
}
