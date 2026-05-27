import { Alert } from "react-native";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SettingLinkRow, ToggleRow } from "@/components/ui/settings";
import { usePlaylistStore } from "@/stores/playlistStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";

export default function TtsQueueScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const autoPlayNext = useTtsStore((s) => s.autoPlayNext);
  const setAutoPlayNext = useTtsStore((s) => s.setAutoPlayNext);
  const queueLength = usePlaylistStore((s) => s.queue.length);
  const clearQueue = usePlaylistStore((s) => s.clear);

  const handleClear = () => {
    if (!queueLength) return;
    Alert.alert("Clear listening queue?", `${queueLength} chapter(s) will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearQueue() },
    ]);
  };

  return (
    <DetailScreen title="Queue / Playlist">
      <SettingsGroup title="Playback Flow">
        <ToggleRow
          label="Auto-play Next Chapter"
          value={autoPlayNext}
          onChange={(v) => {
            setAutoPlayNext(v);
            void updateSettings({ ttsDefaults: { ...settings.ttsDefaults, autoPlayNext: v } });
          }}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Queue"
        footnote="The listening queue is in-memory and clears on app restart. Add chapters from the reader's Listen sheet."
      >
        <SettingLinkRow label="Chapters queued" value={`${queueLength}`} />
        <SettingLinkRow label="Clear Listening Queue" danger onPress={handleClear} />
      </SettingsGroup>
    </DetailScreen>
  );
}
