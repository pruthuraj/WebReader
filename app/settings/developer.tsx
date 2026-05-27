import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SettingLinkRow, ToggleRow } from "@/components/ui/settings";
import { resetDb } from "@/db/client";
import { eventRepo } from "@/db/repositories/eventRepo";
import { seedIfEmpty } from "@/db/seed";
import { useDownloadStore } from "@/stores/downloadStore";
import { useReaderStore } from "@/stores/readerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";

export default function DeveloperSettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const resetSettings = useSettingsStore((s) => s.reset);
  const setAppearance = useReaderStore((s) => s.setAppearance);
  const setSpeed = useTtsStore((s) => s.setSpeed);
  const setPitch = useTtsStore((s) => s.setPitch);
  const setLanguage = useTtsStore((s) => s.setLanguage);
  const setAutoPlayNext = useTtsStore((s) => s.setAutoPlayNext);
  const refreshDownloads = useDownloadStore((s) => s.refresh);
  const [eventCount, setEventCount] = useState<number | null>(null);

  useEffect(() => {
    void eventRepo.totalCount().then(setEventCount);
  }, []);

  const clearDb = () =>
    Alert.alert("Clear database?", "This rebuilds the schema and reseeds. Cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await resetDb();
          await seedIfEmpty();
          await refreshDownloads();
          Alert.alert("Database reset", "Schema rebuilt and mock catalogue seeded.");
        },
      },
    ]);

  const dumpEvents = async () => {
    const events = await eventRepo.recent(50);
    console.log("WebReader recent events", events);
    Alert.alert("Events dumped", "Last 50 events were printed to the Metro console.");
  };

  const resetAll = () =>
    Alert.alert("Reset settings?", "Restores reader and TTS defaults.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await resetSettings();
          const next = useSettingsStore.getState().settings;
          setAppearance(next.readerDefaults);
          setSpeed(next.ttsDefaults.speed);
          setPitch(next.ttsDefaults.pitch);
          setLanguage(next.ttsDefaults.language);
          setAutoPlayNext(next.ttsDefaults.autoPlayNext);
        },
      },
    ]);

  return (
    <DetailScreen title="Developer Tools">
      <SettingsGroup title="Mode" footnote="Dev tools surface internal debugging features.">
        <ToggleRow
          label="Dev Mode"
          sub="Enables the dashboard event stream and debug output."
          value={settings.devMode}
          onChange={(devMode) => void updateSettings({ devMode })}
        />
      </SettingsGroup>

      <SettingsGroup title="Database Status">
        <SettingLinkRow label="Events" value={eventCount === null ? "…" : `${eventCount}`} />
        <SettingLinkRow
          label="Chapter-read threshold"
          value={`${Math.round(settings.chapterReadThreshold * 100)}%`}
        />
      </SettingsGroup>

      <SettingsGroup title="Diagnostics">
        <SettingLinkRow
          label="Dump Recent Events"
          sub="Print the last 50 events to the Metro console."
          accent
          chevron
          onPress={() => void dumpEvents()}
        />
      </SettingsGroup>

      <SettingsGroup title="Reset">
        <SettingLinkRow label="Force Reseed" sub="Re-add mock novels and chapters." onPress={() => void seedIfEmpty()} />
        <SettingLinkRow label="Reset Settings" sub="Restore all defaults." danger onPress={resetAll} />
        <SettingLinkRow label="Clear Database" sub="Delete all local data." danger onPress={clearDb} />
      </SettingsGroup>
    </DetailScreen>
  );
}
