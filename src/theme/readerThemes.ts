export type ReaderThemeName = "light" | "dark" | "sepia" | "oled";

export interface ReaderPalette {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
}

export const readerPalettes: Record<ReaderThemeName, ReaderPalette> = {
  light: {
    bg: "#FFFFFF",
    fg: "#111827",
    muted: "#6B7280",
    accent: "#6366F1",
  },
  dark: {
    bg: "#111113",
    fg: "#E5E7EB",
    muted: "#9CA3AF",
    accent: "#A5B4FC",
  },
  sepia: {
    bg: "#F4E8D1",
    fg: "#3C2819",
    muted: "#785F46",
    accent: "#B46428",
  },
  oled: {
    bg: "#000000",
    fg: "#D8DCE4",
    muted: "#5A6378",
    accent: "#A5B4FC",
  },
};

export const readerThemeClass: Record<ReaderThemeName, string> = {
  light: "",
  dark: "theme-dark",
  sepia: "theme-sepia",
  oled: "theme-oled",
};
