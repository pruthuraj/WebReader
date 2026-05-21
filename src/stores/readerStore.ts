import { create } from "zustand";
import type { ReaderThemeName } from "@/theme/readerThemes";

export type FontStyle = "system" | "serif" | "sans" | "mono";
export type TextAlignment = "left" | "justify";

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
}

export interface ReaderState {
  currentNovelId: string | null;
  currentChapterId: string | null;
  scrollOffset: number;
  appearance: ReaderAppearance;
  setCurrent: (novelId: string | null, chapterId: string | null) => void;
  setScrollOffset: (offset: number) => void;
  setAppearance: (partial: Partial<ReaderAppearance>) => void;
  resetAppearance: () => void;
}

export const defaultAppearance: ReaderAppearance = {
  fontSize: 18,
  lineHeight: 1.7,
  fontStyle: "serif",
  theme: "light",
  alignment: "left",
  margin: 20,
  brightness: null,
  keepAwake: false,
  screenBlur: 0,
};

export const useReaderStore = create<ReaderState>((set) => ({
  currentNovelId: null,
  currentChapterId: null,
  scrollOffset: 0,
  appearance: { ...defaultAppearance },
  setCurrent: (novelId, chapterId) =>
    set({ currentNovelId: novelId, currentChapterId: chapterId, scrollOffset: 0 }),
  setScrollOffset: (offset) => set({ scrollOffset: offset }),
  setAppearance: (partial) =>
    set((s) => ({ appearance: { ...s.appearance, ...partial } })),
  resetAppearance: () => set({ appearance: { ...defaultAppearance } }),
}));
