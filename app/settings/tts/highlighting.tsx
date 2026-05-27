import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SelectRow } from "@/components/ui/settings";
import { useSettingsStore, type HighlightMode } from "@/stores/settingsStore";

const LABELS: Record<HighlightMode, string> = {
  sentence: "Sentence",
  paragraph: "Paragraph",
  underlineParagraph: "Underline paragraph",
  comma: "Comma clause",
};

const ORDER: HighlightMode[] = ["sentence", "paragraph", "underlineParagraph", "comma"];

export default function TtsHighlightingScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const current = settings.ttsDefaults.highlightMode;

  return (
    <DetailScreen title="Highlighting">
      <SettingsGroup
        title="Mode"
        footnote="If the selected voice doesn't report word boundaries, the app falls back to sentence highlighting automatically."
      >
        <SelectRow
          label="Highlight Level"
          value={LABELS[current]}
          options={ORDER.map((m) => LABELS[m])}
          onChange={(label) => {
            const mode = ORDER.find((m) => LABELS[m] === label);
            if (mode) void updateSettings({ ttsDefaults: { ...settings.ttsDefaults, highlightMode: mode } });
          }}
        />
      </SettingsGroup>
    </DetailScreen>
  );
}
