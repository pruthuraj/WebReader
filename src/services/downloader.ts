import { catalogue } from "@/services/catalogue";
import { network } from "@/services/network";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { downloadQueueRepo } from "@/db/repositories/downloadQueueRepo";
import { useDownloadStore } from "@/stores/downloadStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { DownloadQueueItem } from "@/data/types";

const MAX_CONCURRENT = 2;
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
const running = new Set<string>();

function key(item: Pick<DownloadQueueItem, "novelId" | "chapterId">) {
  return `${item.novelId}::${item.chapterId}`;
}

async function processItem(item: DownloadQueueItem) {
  const id = key(item);
  if (running.has(id)) return;
  running.add(id);

  try {
    const wifiOnly = useSettingsStore.getState().settings.wifiOnlyDownloads;
    const allowed = await network.shouldAllowDownload(wifiOnly);
    if (!allowed) return;

    await downloadQueueRepo.setStatus(item.novelId, item.chapterId, "downloading");
    await useDownloadStore.getState().refresh();

    const chapter = catalogue.getChapter(item.novelId, item.chapterId);
    if (!chapter?.body) throw new Error("Chapter body missing from catalogue");

    await chapterRepo.setBody(item.novelId, item.chapterId, chapter.body);
    await downloadQueueRepo.setStatus(item.novelId, item.chapterId, "done");
  } catch (error) {
    await downloadQueueRepo.setStatus(
      item.novelId,
      item.chapterId,
      "failed",
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    running.delete(id);
    await useDownloadStore.getState().refresh();
  }
}

async function tick() {
  if (running.size >= MAX_CONCURRENT) return;

  const wifiOnly = useSettingsStore.getState().settings.wifiOnlyDownloads;
  const allowed = await network.shouldAllowDownload(wifiOnly);
  if (!allowed) return;

  const queued = await downloadQueueRepo.listByStatus("queued");
  const slots = MAX_CONCURRENT - running.size;
  for (const item of queued.slice(0, slots)) {
    void processItem(item);
  }
}

export const downloader = {
  async start() {
    if (started) return;
    started = true;
    await downloadQueueRepo.resetDownloadingToQueued();
    timer = setInterval(() => void tick(), 500);
    void tick();
  },

  stop() {
    started = false;
    if (timer) clearInterval(timer);
    timer = null;
  },

  poke() {
    void tick();
  },
};

