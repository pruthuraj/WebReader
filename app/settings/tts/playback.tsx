import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, StepperRow, ToggleRow } from "@/components/ui/settings";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";

export default function TtsPlaybackScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const autoPlayNext = useTtsStore((s) => s.autoPlayNext);
  const setAutoPlayNext = useTtsStore((s) => s.setAutoPlayNext);
  const ttsDefaults = settings.ttsDefaults;

  const updateTts = async (partial: Partial<typeof ttsDefaults>) => {
    await updateSettings({ ttsDefaults: { ...ttsDefaults, ...partial } });
  };

  const pauseSec = (ttsDefaults.sentencePauseMs / 1000).toFixed(1);

  return (
    <DetailScreen title="Playback">
      <SettingsGroup
        title="Behavior"
        footnote="Sentence-level skip controls live in the advanced reader surface, not the playback bar."
      >
        <StepperRow
          label="Pause Between Sentences"
          value={`${pauseSec}s`}
          onMinus={() =>
            void updateTts({ sentencePauseMs: Math.max(0, ttsDefaults.sentencePauseMs - 100) })
          }
          onPlus={() =>
            void updateTts({ sentencePauseMs: Math.min(2000, ttsDefaults.sentencePauseMs + 100) })
          }
        />
        <ToggleRow
          label="Auto-start Reading"
          sub="Start TTS when a chapter opens."
          value={ttsDefaults.autoStartOnOpen}
          onChange={(v) => void updateTts({ autoStartOnOpen: v })}
        />
        <ToggleRow
          label="Auto-play Next Chapter"
          sub="Continue reading when the current chapter ends."
          value={autoPlayNext}
          onChange={(v) => {
            setAutoPlayNext(v);
            void updateTts({ autoPlayNext: v });
          }}
        />
      </SettingsGroup>
    </DetailScreen>
  );
}
