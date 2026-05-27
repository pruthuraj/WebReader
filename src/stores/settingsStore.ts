import { create } from "zustand";
import { kvRepo } from "@/db/repositories/kvRepo";
import {
  defaultAppTheme,
  defaultCustomPalette,
  type AppPalette,
  type AppThemeName,
} from "@/theme/appThemes";
import {
  defaultAppearance,
  defaultFocus,
  normalizeFontStyle,
  type ReaderAppearance,
} from "./readerStore";

export type HighlightMode = "sentence" | "paragraph" | "underlineParagraph" | "comma";

export interface TtsCleaningToggles {
  symbols: boolean;
  emojis: boolean;
  superscript: boolean;
  urls: boolean;
  brackets: boolean;
  parens: boolean;
  spacedUppercase: boolean;
  hyphens: boolean;
  lineBreakHyphens: boolean;
  linkedRefs: boolean;
}

export const defaultTtsCleaning: TtsCleaningToggles = {
  symbols: false,
  emojis: false,
  superscript: false,
  urls: false,
  brackets: false,
  parens: false,
  spacedUppercase: false,
  hyphens: false,
  lineBreakHyphens: false,
  linkedRefs: false,
};

export interface TtsDefaults {
  speed: number;
  pitch: number;
  language: string;
  autoPlayNext: boolean;
  autoStartOnOpen: boolean;
  sentencePauseMs: number;
  highlightMode: HighlightMode;
  cleaning: TtsCleaningToggles;
  backgroundPlayback: boolean;
}

export const defaultTtsDefaults: TtsDefaults = {
  speed: 1.0,
  pitch: 1.0,
  language: "en-US",
  autoPlayNext: false,
  autoStartOnOpen: false,
  sentencePauseMs: 0,
  highlightMode: "sentence",
  cleaning: { ...defaultTtsCleaning },
  backgroundPlayback: false,
};

export interface AppSettings {
  readerDefaults: ReaderAppearance;
  ttsDefaults: TtsDefaults;
  wifiOnlyDownloads: boolean;
  autoRetryFailed: boolean;
  // Percent (0-1) of a chapter that must scroll past before unmount logs a
  // `chapter_read` event. Was hardcoded to 0.8.
  chapterReadThreshold: number;
  devMode: boolean;
  // App-chrome theme (Phase 2d). Distinct from readerDefaults.theme.
  appTheme: AppThemeName;
  customPalette: AppPalette;
}

export const defaultSettings: AppSettings = {
  readerDefaults: { ...defaultAppearance },
  ttsDefaults: { ...defaultTtsDefaults },
  wifiOnlyDownloads: false,
  autoRetryFailed: true,
  chapterReadThreshold: 0.8,
  devMode: __DEV__,
  appTheme: defaultAppTheme,
  customPalette: { ...defaultCustomPalette },
};

const KV_KEY = "settings.v1";

function mergeTtsDefaults(stored: Partial<TtsDefaults> | undefined): TtsDefaults {
  if (!stored) return { ...defaultTtsDefaults };
  return {
    ...defaultTtsDefaults,
    ...stored,
    cleaning: { ...defaultTtsCleaning, ...(stored.cleaning ?? {}) },
  };
}

function mergeReaderDefaults(stored: Partial<ReaderAppearance> | undefined): ReaderAppearance {
  const merged = { ...defaultAppearance, ...(stored ?? {}) };
  return {
    ...merged,
    fontStyle: normalizeFontStyle(merged.fontStyle),
    focus: { ...defaultFocus, ...(stored?.focus ?? {}) },
  };
}

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
    const stored = await kvRepo.get<Partial<AppSettings>>(KV_KEY);
    if (stored) {
      set({
        settings: {
          ...defaultSettings,
          ...stored,
          readerDefaults: mergeReaderDefaults(stored.readerDefaults),
          ttsDefaults: mergeTtsDefaults(stored.ttsDefaults),
          customPalette: { ...defaultCustomPalette, ...(stored.customPalette ?? {}) },
        },
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },
  update: async (partial) => {
    const current = get().settings;
    const next: AppSettings = {
      ...current,
      ...partial,
      ttsDefaults: partial.ttsDefaults
        ? mergeTtsDefaults({ ...current.ttsDefaults, ...partial.ttsDefaults })
        : current.ttsDefaults,
      readerDefaults: partial.readerDefaults
        ? { ...current.readerDefaults, ...partial.readerDefaults }
        : current.readerDefaults,
    };
    set({ settings: next });
    await kvRepo.set(KV_KEY, next);
  },
  reset: async () => {
    set({ settings: { ...defaultSettings } });
    await kvRepo.set(KV_KEY, defaultSettings);
  },
}));
