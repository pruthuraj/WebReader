import { create } from "zustand";
import { kvRepo } from "@/db/repositories/kvRepo";
import { defaultAppearance, type ReaderAppearance } from "./readerStore";

export interface TtsDefaults {
  speed: number;
  pitch: number;
  language: string;
  autoPlayNext: boolean;
}

export const defaultTtsDefaults: TtsDefaults = {
  speed: 1.0,
  pitch: 1.0,
  language: "en-US",
  autoPlayNext: false,
};

export interface AppSettings {
  readerDefaults: ReaderAppearance;
  ttsDefaults: TtsDefaults;
  wifiOnlyDownloads: boolean;
  autoRetryFailed: boolean;
  devMode: boolean;
}

export const defaultSettings: AppSettings = {
  readerDefaults: { ...defaultAppearance },
  ttsDefaults: { ...defaultTtsDefaults },
  wifiOnlyDownloads: false,
  autoRetryFailed: true,
  devMode: __DEV__,
};

const KV_KEY = "settings.v1";

export interface SettingsState {
  hydrated: boolean;
  settings: AppSettings;
  hydrate: () => Promise<void>;
  update: (partial: Partial<AppSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  settings: { ...defaultSettings },
  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await kvRepo.get<AppSettings>(KV_KEY);
    if (stored) {
      set({
        settings: { ...defaultSettings, ...stored },
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },
  update: async (partial) => {
    const next: AppSettings = { ...get().settings, ...partial };
    set({ settings: next });
    await kvRepo.set(KV_KEY, next);
  },
  reset: async () => {
    set({ settings: { ...defaultSettings } });
    await kvRepo.set(KV_KEY, defaultSettings);
  },
}));
