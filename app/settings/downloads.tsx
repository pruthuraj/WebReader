import { Alert } from "react-native";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SettingLinkRow, ToggleRow } from "@/components/ui/settings";
import { downloadQueueRepo } from "@/db/repositories/downloadQueueRepo";
import { useDownloadStore } from "@/stores/downloadStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function DownloadsSettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const refreshDownloads = useDownloadStore((s) => s.refresh);

  const clearPending = async () => {
    await downloadQueueRepo.clearStatuses(["queued", "failed"]);
    await refreshDownloads();
    Alert.alert("Queue cleared", "Queued and failed download items were removed.");
  };

  const confirmClearPending = () => {
    Alert.alert("Clear queued and failed?", "Downloaded chapters stay on device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void clearPending() },
    ]);
  };

  return (
    <DetailScreen title="Downloads">
      <SettingsGroup title="Network">
        <ToggleRow
          label="Wi-Fi Only Downloads"
          sub="Pause downloads when on cellular data."
          value={settings.wifiOnlyDownloads}
          onChange={(wifiOnlyDownloads) => void updateSettings({ wifiOnlyDownloads })}
        />
        <ToggleRow
          label="Auto-Retry Failed Downloads"
          value={settings.autoRetryFailed}
          onChange={(autoRetryFailed) => void updateSettings({ autoRetryFailed })}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Behavior"
        footnote="The download worker runs with a fixed concurrency of 2 and fetches chapter bodies through the catalogue facade — no network backend stores content."
      >
        <SettingLinkRow label="Concurrent downloads" value="2" />
        <SettingLinkRow label="Download All behavior" value="Background queue" />
      </SettingsGroup>

      <SettingsGroup title="Cleanup">
        <SettingLinkRow
          label="Clear Queued & Failed"
          sub="Removes pending queue entries; downloaded chapters stay."
          danger
          onPress={confirmClearPending}
        />
      </SettingsGroup>
    </DetailScreen>
  );
}
