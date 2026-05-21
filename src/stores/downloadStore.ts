import { create } from "zustand";
import { downloadQueueRepo } from "@/db/repositories/downloadQueueRepo";
import type { DownloadQueueItem } from "@/data/types";

function key(novelId: string, chapterId: string) {
  return `${novelId}::${chapterId}`;
}

export interface DownloadState {
  queue: Record<string, DownloadQueueItem>;
  refresh: () => Promise<void>;
  enqueue: (items: { novelId: string; chapterId: string }[]) => Promise<void>;
  retry: (novelId: string, chapterId: string) => Promise<void>;
  remove: (novelId: string, chapterId: string) => Promise<void>;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  queue: {},
  refresh: async () => {
    const items = await downloadQueueRepo.listAll();
    const next: Record<string, DownloadQueueItem> = {};
    for (const it of items) {
      next[key(it.novelId, it.chapterId)] = it;
    }
    set({ queue: next });
  },
  enqueue: async (items) => {
    for (const it of items) {
      await downloadQueueRepo.enqueue(it.novelId, it.chapterId);
    }
    const all = await downloadQueueRepo.listAll();
    const next: Record<string, DownloadQueueItem> = {};
    for (const it of all) next[key(it.novelId, it.chapterId)] = it;
    set({ queue: next });
  },
  retry: async (novelId, chapterId) => {
    await downloadQueueRepo.setStatus(novelId, chapterId, "queued");
    const all = await downloadQueueRepo.listAll();
    const next: Record<string, DownloadQueueItem> = {};
    for (const it of all) next[key(it.novelId, it.chapterId)] = it;
    set({ queue: next });
  },
  remove: async (novelId, chapterId) => {
    await downloadQueueRepo.remove(novelId, chapterId);
    set((s) => {
      const next = { ...s.queue };
      delete next[key(novelId, chapterId)];
      return { queue: next };
    });
  },
}));
