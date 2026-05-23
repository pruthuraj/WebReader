import { create } from "zustand";

export interface PlaylistItem {
  novelId: string;
  chapterId: string;
}

function key(item: PlaylistItem) {
  return `${item.novelId}::${item.chapterId}`;
}

export interface PlaylistState {
  queue: PlaylistItem[];
  enqueue: (item: PlaylistItem) => void;
  enqueueMany: (items: PlaylistItem[]) => void;
  removeAt: (index: number) => void;
  removeByKey: (novelId: string, chapterId: string) => void;
  clear: () => void;
  popNext: () => PlaylistItem | null;
  has: (novelId: string, chapterId: string) => boolean;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  queue: [],

  enqueue: (item) =>
    set((state) => {
      if (state.queue.some((q) => key(q) === key(item))) return state;
      return { queue: [...state.queue, item] };
    }),

  enqueueMany: (items) =>
    set((state) => {
      const existing = new Set(state.queue.map(key));
      const next = state.queue.slice();
      for (const item of items) {
        if (existing.has(key(item))) continue;
        next.push(item);
        existing.add(key(item));
      }
      return { queue: next };
    }),

  removeAt: (index) =>
    set((state) => {
      if (index < 0 || index >= state.queue.length) return state;
      const next = state.queue.slice();
      next.splice(index, 1);
      return { queue: next };
    }),

  removeByKey: (novelId, chapterId) =>
    set((state) => ({
      queue: state.queue.filter((q) => q.novelId !== novelId || q.chapterId !== chapterId),
    })),

  clear: () => set({ queue: [] }),

  popNext: () => {
    const queue = get().queue;
    if (!queue.length) return null;
    const [head, ...rest] = queue;
    set({ queue: rest });
    return head;
  },

  has: (novelId, chapterId) =>
    get().queue.some((q) => q.novelId === novelId && q.chapterId === chapterId),
}));
