import { Alert } from "react-native";
import { resetDb } from "@/db/client";
import { eventRepo } from "@/db/repositories/eventRepo";
import { seedIfEmpty } from "@/db/seed";
import { useDownloadStore } from "@/stores/downloadStore";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";

export function DeveloperPanel() {
  const refreshDownloads = useDownloadStore((s) => s.refresh);

  const clearDb = async () => {
    await resetDb();
    await seedIfEmpty();
    await refreshDownloads();
    Alert.alert("Database reset", "Schema rebuilt and mock catalogue seeded.");
  };

  const showEventCount = async () => {
    const count = await eventRepo.totalCount();
    Alert.alert("Events", `${count} local events stored.`);
  };

  const dumpEvents = async () => {
    const events = await eventRepo.recent(50);
    console.log("WebReader recent events", events);
    Alert.alert("Events dumped", "Last 50 events were printed to the Metro console.");
  };

  return (
    <SettingsSection title="Developer" subtitle="Local utilities for Phase C QA.">
      <SettingsRow type="tap" label="Clear DB and reseed" danger onPress={clearDb} />
      <SettingsRow type="tap" label="Force reseed" onPress={() => seedIfEmpty()} />
      <SettingsRow type="tap" label="Show event count" onPress={showEventCount} />
      <SettingsRow type="tap" label="Dump last 50 events" onPress={dumpEvents} />
    </SettingsSection>
  );
}

