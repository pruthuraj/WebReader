import { create } from "zustand";
import { sourceRepo } from "@/db/repositories/sourceRepo";
import { registry } from "@/sources/registry";
import type { StoredSource } from "@/sources/types";

interface SourceState {
  sources: StoredSource[];
  /** Source selected for browsing/searching (Browse tab). */
  activeSourceId: string | null;
  refreshing: boolean;
  lastRefreshedAt: number | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  setEnabled: (id: string, enabled: boolean) => Promise<void>;
  setActiveSource: (id: string | null) => void;
}

/** Keep activeSourceId pointing at an enabled source (or null). */
function reconcileActive(sources: StoredSource[], current: string | null): string | null {
  const enabled = sources.filter((s) => s.enabled);
  if (current && enabled.some((s) => s.id === current)) return current;
  return enabled[0]?.id ?? null;
}

export const useSourceStore = create<SourceState>((set, get) => ({
  sources: [],
  activeSourceId: null,
  refreshing: false,
  lastRefreshedAt: null,

  load: async () => {
    const sources = await sourceRepo.list();
    set({ sources, activeSourceId: reconcileActive(sources, get().activeSourceId) });
  },

  refresh: async () => {
    if (get().refreshing) return;
    set({ refreshing: true });
    try {
      await registry.refresh();
      await get().load();
      set({ lastRefreshedAt: Date.now() });
    } finally {
      set({ refreshing: false });
    }
  },

  setEnabled: async (id, enabled) => {
    await sourceRepo.setEnabled(id, enabled);
    await get().load();
  },

  setActiveSource: (id) => set({ activeSourceId: id }),
}));
