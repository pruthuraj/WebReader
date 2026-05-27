import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, ToggleRow } from "@/components/ui/settings";
import {
  defaultTtsCleaning,
  useSettingsStore,
  type TtsCleaningToggles,
} from "@/stores/settingsStore";

const SYMBOL_ROWS: { key: keyof TtsCleaningToggles; label: string; sub?: string }[] = [
  { key: "symbols", label: "Skip Symbols", sub: "Strip non-letter, non-number characters." },
  { key: "emojis", label: "Skip Emojis" },
  { key: "superscript", label: "Skip Superscript", sub: "Footnote-like text." },
];

const LINK_ROWS: { key: keyof TtsCleaningToggles; label: string; sub?: string }[] = [
  { key: "urls", label: "Skip URLs", sub: "Removes http:// and www. links." },
  { key: "linkedRefs", label: "Skip Linked / Reference Text", sub: "Anchor text inside links." },
];

const BRACKET_ROWS: { key: keyof TtsCleaningToggles; label: string }[] = [
  { key: "brackets", label: "Skip [bracket text]" },
  { key: "parens", label: "Skip (parentheses)" },
];

const FORMAT_ROWS: { key: keyof TtsCleaningToggles; label: string; sub?: string }[] = [
  { key: "lineBreakHyphens", label: "Re-join Line-break Hyphens" },
  { key: "hyphens", label: "Soften Hyphens" },
  { key: "spacedUppercase", label: "Collapse S P A C E D Letters", sub: "Read A B C as a word." },
];

export default function TtsCleaningScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const cleaning = settings.ttsDefaults.cleaning ?? defaultTtsCleaning;

  const set = (key: keyof TtsCleaningToggles, value: boolean) =>
    updateSettings({ ttsDefaults: { ...settings.ttsDefaults, cleaning: { ...cleaning, [key]: value } } });

  const rows = (list: { key: keyof TtsCleaningToggles; label: string; sub?: string }[]) =>
    list.map((r) => (
      <ToggleRow
        key={r.key}
        label={r.label}
        sub={r.sub}
        value={cleaning[r.key]}
        onChange={(v) => void set(r.key, v)}
      />
    ));

  return (
    <DetailScreen title="Text Cleaning">
      <SettingsGroup
        title="Strip Symbols"
        footnote="These changes only apply to TTS playback. The on-screen text is not modified."
      >
        {rows(SYMBOL_ROWS)}
      </SettingsGroup>
      <SettingsGroup title="Strip Links & References">{rows(LINK_ROWS)}</SettingsGroup>
      <SettingsGroup title="Strip Brackets">{rows(BRACKET_ROWS)}</SettingsGroup>
      <SettingsGroup title="Formatting Fixes">{rows(FORMAT_ROWS)}</SettingsGroup>
    </DetailScreen>
  );
}
