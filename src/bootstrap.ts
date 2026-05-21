import { initDb } from "./db/client";
import { seedIfEmpty } from "./db/seed";
import { useSettingsStore } from "./stores/settingsStore";
import { useDownloadStore } from "./stores/downloadStore";
import { eventRepo } from "./db/repositories/eventRepo";

export interface BootstrapResult {
  dbReady: boolean;
  seeded: boolean;
  novels: number;
  totalEvents: number;
}

export async function bootstrap(): Promise<BootstrapResult> {
  await initDb();
  const seedResult = await seedIfEmpty();
  await useSettingsStore.getState().hydrate();
  await useDownloadStore.getState().refresh();
  const totalEvents = await eventRepo.totalCount();
  await eventRepo.record({ type: "session", payload: { event: "app_launch" } });
  return {
    dbReady: true,
    seeded: seedResult.seeded,
    novels: seedResult.novels,
    totalEvents,
  };
}
