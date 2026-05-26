import { create } from "zustand";
import { shelfRepo, type ShelfWithCount } from "@/db/repositories/shelfRepo";

interface LibraryState {
  shelves: ShelfWithCount[];
  loaded: boolean;
  refresh: () => Promise<void>;
  create: (name: string) => Promise<number>;
  rename: (id: number, name: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
  addNovel: (shelfId: number, novelId: string) => Promise<void>;
  removeNovel: (shelfId: number, novelId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  shelves: [],
  loaded: false,

  refresh: async () => {
    set({ shelves: await shelfRepo.list(), loaded: true });
  },

  create: async (name) => {
    const id = await shelfRepo.create(name);
    await get().refresh();
    return id;
  },

  rename: async (id, name) => {
    await shelfRepo.rename(id, name);
    await get().refresh();
  },

  remove: async (id) => {
    await shelfRepo.remove(id);
    await get().refresh();
  },

  addNovel: async (shelfId, novelId) => {
    await shelfRepo.addNovel(shelfId, novelId);
    await get().refresh();
  },

  removeNovel: async (shelfId, novelId) => {
    await shelfRepo.removeNovel(shelfId, novelId);
    await get().refresh();
  },
}));
