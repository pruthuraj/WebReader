import { initDb } from "./db/client";
import { seedIfEmpty } from "./db/seed";
import { useSettingsStore } from "./stores/settingsStore";
import { useDownloadStore } from "./stores/downloadStore";
import { eventRepo } from "./db/repositories/eventRepo";
import { useReaderStore } from "./stores/readerStore";
import { useTtsStore } from "./stores/ttsStore";
import { network } from "./services/network";
import { downloader } from "./services/downloader";

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
  const settings = useSettingsStore.getState().settings;
  useReaderStore.getState().setAppearance(settings.readerDefaults);
  useTtsStore.getState().setSpeed(settings.ttsDefaults.speed);
  useTtsStore.getState().setPitch(settings.ttsDefaults.pitch);
  useTtsStore.getState().setLanguage(settings.ttsDefaults.language);
  useTtsStore.getState().setAutoPlayNext(settings.ttsDefaults.autoPlayNext);
  await useDownloadStore.getState().refresh();
  network.start();
  await downloader.start();
  const totalEvents = await eventRepo.totalCount();
  await eventRepo.record({ type: "session", payload: { event: "app_launch" } });
  return {
    dbReady: true,
    seeded: seedResult.seeded,
    novels: seedResult.novels,
    totalEvents,
  };
}
