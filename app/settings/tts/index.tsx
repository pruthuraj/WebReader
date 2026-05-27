import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SelectRow, SettingLinkRow, StepperRow, ToggleRow } from "@/components/ui/settings";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";

const LANGUAGE_OPTIONS = ["en-US", "en-GB", "en-AU", "hi-IN"];

export default function TtsSettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const speed = useTtsStore((s) => s.speed);
  const pitch = useTtsStore((s) => s.pitch);
  const autoPlayNext = useTtsStore((s) => s.autoPlayNext);
  const setSpeed = useTtsStore((s) => s.setSpeed);
  const setPitch = useTtsStore((s) => s.setPitch);
  const setLanguage = useTtsStore((s) => s.setLanguage);
  const setAutoPlayNext = useTtsStore((s) => s.setAutoPlayNext);
  const ttsDefaults = settings.ttsDefaults;

  const updateTts = async (partial: Partial<typeof ttsDefaults>) => {
    await updateSettings({ ttsDefaults: { ...ttsDefaults, ...partial } });
  };

  return (
    <DetailScreen title="Text-to-Speech">
      <SettingsGroup title="Basic">
        <SelectRow
          label="Default Language"
          value={ttsDefaults.language}
          options={LANGUAGE_OPTIONS}
          onChange={(language) => {
            setLanguage(language);
            void updateTts({ language });
          }}
        />
        <StepperRow
          label="Speech Speed"
          value={`${speed.toFixed(1)}x`}
          onMinus={() => {
            const next = Math.max(0.5, Math.round((speed - 0.1) * 10) / 10);
            setSpeed(next);
            void updateTts({ speed: next });
          }}
          onPlus={() => {
            const next = Math.min(2, Math.round((speed + 0.1) * 10) / 10);
            setSpeed(next);
            void updateTts({ speed: next });
          }}
        />
        <StepperRow
          label="Pitch"
          value={pitch.toFixed(1)}
          onMinus={() => {
            const next = Math.max(0.5, Math.round((pitch - 0.1) * 10) / 10);
            setPitch(next);
            void updateTts({ pitch: next });
          }}
          onPlus={() => {
            const next = Math.min(2, Math.round((pitch + 0.1) * 10) / 10);
            setPitch(next);
            void updateTts({ pitch: next });
          }}
        />
        <ToggleRow
          label="Auto-play Next Chapter"
          value={autoPlayNext}
          onChange={(v) => {
            setAutoPlayNext(v);
            void updateTts({ autoPlayNext: v });
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="Advanced">
        <SettingLinkRow label="Playback" sub="Pauses, auto-start" chevron onPress={() => router.push("/settings/tts/playback" as never)} />
        <SettingLinkRow label="Voice" sub="Engine and available voices" chevron onPress={() => router.push("/settings/tts/voice" as never)} />
        <SettingLinkRow label="Pronunciation" sub="Custom rules for names and symbols" chevron onPress={() => router.push("/tts-pronunciation" as never)} />
        <SettingLinkRow label="Text Cleaning" sub="Strip ads, URLs, brackets, footnotes" chevron onPress={() => router.push("/settings/tts/cleaning" as never)} />
        <SettingLinkRow label="Highlighting" sub="Follow spoken text visually" chevron onPress={() => router.push("/settings/tts/highlighting" as never)} />
        <SettingLinkRow label="Queue / Playlist" sub="Continuous chapter playback" chevron onPress={() => router.push("/settings/tts/queue" as never)} />
        <SettingLinkRow label="Device Support" sub="Background, battery, bluetooth" chevron onPress={() => router.push("/settings/tts/device" as never)} />
      </SettingsGroup>
    </DetailScreen>
  );
}
