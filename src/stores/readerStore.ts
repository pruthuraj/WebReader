import { create } from "zustand";
import type { ReaderThemeName } from "@/theme/readerThemes";
import { progressRepo } from "@/db/repositories/progressRepo";

export type FontStyle =
  | "system"
  | "lora"
  | "inter"
  | "raleway"
  | "montserrat"
  | "caslon"
  | "baskerville";
export type TextAlignment = "left" | "justify" | "center";

export type FocusMode = "focus" | "blurAll";
export type FocusTarget = "line" | "sentence" | "paragraph" | "visible";
export type FocusWindow = "narrow" | "medium" | "wide";

export interface FocusSettings {
  enabled: boolean;
  mode: FocusMode;
  /** 0–15. In RN this drives dim strength on non-focused text (true blur is
   *  not available per-paragraph); `blurAll` mode uses a real BlurView overlay. */
  blur: number;
  /** 0–100 dim percentage applied outside the focus area. */
  dim: number;
  target: FocusTarget;
  window: FocusWindow;
  animate: boolean;
  duringTTS: boolean;
  duringManual: boolean;
}

export const defaultFocus: FocusSettings = {
  enabled: false,
  mode: "focus",
  blur: 5,
  dim: 30,
  target: "paragraph",
  window: "medium",
  animate: true,
  duringTTS: true,
  duringManual: false,
};

export interface ReaderAppearance {
  fontSize: number;
  lineHeight: number;
  fontStyle: FontStyle;
  theme: ReaderThemeName;
  alignment: TextAlignment;
  margin: number;
  brightness: number | null;
  keepAwake: boolean;
  screenBlur: number;
  focus: FocusSettings;
}

export interface ReaderState {
  currentNovelId: string | null;
  currentChapterId: string | null;
  scrollOffset: number;
  appearance: ReaderAppearance;
  setCurrent: (novelId: string | null, chapterId: string | null) => void;
  setScrollOffset: (offset: number) => void;
  setProgress: (
    novelId: string,
    chapterId: string,
    scrollOffset: number,
    percent: number
  ) => Promise<void>;
  setAppearance: (partial: Partial<ReaderAppearance>) => void;
  resetAppearance: () => void;
}

export const defaultAppearance: ReaderAppearance = {
  fontSize: 18,
  lineHeight: 1.7,
  fontStyle: "lora",
  theme: "dark",
  alignment: "left",
  margin: 20,
  brightness: null,
  keepAwake: false,
  screenBlur: 0,
  focus: { ...defaultFocus },
};

// Migrate legacy persisted fontStyle values (Phase 2c and earlier used
// serif/sans/mono) to the Phase 2d font keys so hydration never yields a
// fontStyle the resolver can't map.
export function normalizeFontStyle(value: unknown): FontStyle {
  switch (value) {
    case "serif":
      return "lora";
    case "sans":
      return "inter";
    case "mono":
      return "system";
    case "system":
    case "lora":
    case "inter":
    case "raleway":
    case "montserrat":
    case "caslon":
    case "baskerville":
      return value;
    default:
      return "lora";
  }
}

export const useReaderStore = create<ReaderState>((set) => ({
  currentNovelId: null,
  currentChapterId: null,
  scrollOffset: 0,
  appearance: { ...defaultAppearance },
  setCurrent: (novelId, chapterId) =>
    set({ currentNovelId: novelId, currentChapterId: chapterId, scrollOffset: 0 }),
  setScrollOffset: (offset) => set({ scrollOffset: offset }),
  setProgress: async (novelId, chapterId, scrollOffset, percent) => {
    await progressRepo.upsert({
      novelId,
      chapterId,
      scrollOffset,
      percent,
      updatedAt: Date.now(),
    });
    set({ scrollOffset });
  },
  setAppearance: (partial) =>
    set((s) => ({ appearance: { ...s.appearance, ...partial } })),
  resetAppearance: () => set({ appearance: { ...defaultAppearance } }),
}));
