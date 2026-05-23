import { catalogue } from "@/services/catalogue";
import { network } from "@/services/network";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { downloadQueueRepo } from "@/db/repositories/downloadQueueRepo";
import { useDownloadStore } from "@/stores/downloadStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { DownloadQueueItem } from "@/data/types";

const MAX_CONCURRENT = 2;
const MAX_BACKOFF_MS = 60_000;
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
let networkUnsubscribe: (() => void) | null = null;
const running = new Set<string>();
// In-memory retry book-keeping. Not persisted — a relaunch resets attempts,
// which is the desired behavior for Phase 1.
const retryState = new Map<string, { attempts: number; nextAttemptAt: number }>();

function key(item: Pick<DownloadQueueItem, "novelId" | "chapterId">) {
  return `${item.novelId}::${item.chapterId}`;
}

function backoffMs(attempts: number) {
  return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.max(0, attempts - 1));
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
    retryState.delete(id);
  } catch (error) {
    const previous = retryState.get(id);
    const attempts = (previous?.attempts ?? 0) + 1;
    retryState.set(id, {
      attempts,
      nextAttemptAt: Date.now() + backoffMs(attempts),
    });
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

async function maybeRetryFailed() {
  if (!useSettingsStore.getState().settings.autoRetryFailed) return;
  const failed = await downloadQueueRepo.listByStatus("failed");
  if (!failed.length) return;
  const now = Date.now();
  let promoted = 0;
  for (const item of failed) {
    const entry = retryState.get(key(item));
    if (entry && entry.nextAttemptAt > now) continue;
    await downloadQueueRepo.setStatus(item.novelId, item.chapterId, "queued");
    promoted += 1;
  }
  if (promoted) await useDownloadStore.getState().refresh();
}

async function tick() {
  await maybeRetryFailed();

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
    networkUnsubscribe = network.subscribe(() => {
      void tick();
    });
    void tick();
  },

  stop() {
    started = false;
    if (timer) clearInterval(timer);
    timer = null;
    networkUnsubscribe?.();
    networkUnsubscribe = null;
  },

  poke() {
    void tick();
  },
};

