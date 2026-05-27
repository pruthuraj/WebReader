// App-chrome theme system (Phase 2d). Distinct from the reader theme set in
// `readerThemes.ts`: this drives the app shell (tabs, home, search, settings, …),
// the reader keeps its own light/sepia/dark/oled palettes.
//
// Colors are surfaced to NativeWind as CSS variables via `vars()` applied on the
// root View in `ThemeProvider`. Tailwind `app.*` tokens reference `var(--app-*)`.
// The default chrome is `navy`, copied verbatim from `ref/components.jsx` NR_THEME.

export type AppThemeName = "light" | "dark" | "navy" | "custom";

export interface AppPalette {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderStrong: string;
  text: string;
  textDim: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  /** Text/icon color rendered on top of a solid `accent` fill. */
  onAccent: string;
  success: string;
  warn: string;
  danger: string;
}

// Dark-navy — the ref's NR_THEME, verbatim. Default chrome.
const navy: AppPalette = {
  bg: "#0B1220",
  surface: "#141C2E",
  surface2: "#1B2438",
  surface3: "#222D44",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#E8EBF1",
  textDim: "#B0B8C9",
  textMuted: "#7782A0",
  accent: "#8B95FF",
  accentDim: "rgba(139,149,255,0.18)",
  onAccent: "#0B1220",
  success: "#4CD7A0",
  warn: "#FFB454",
  danger: "#FF7676",
};

// Neutral dark — same accent, grey-black surfaces (no blue tint) to read as a
// distinct option from navy.
const dark: AppPalette = {
  bg: "#0E0E11",
  surface: "#17171B",
  surface2: "#1F1F25",
  surface3: "#2A2A31",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#ECECF1",
  textDim: "#B5B5BE",
  textMuted: "#7C7C88",
  accent: "#8B95FF",
  accentDim: "rgba(139,149,255,0.18)",
  onAccent: "#0E0E11",
  success: "#4CD7A0",
  warn: "#FFB454",
  danger: "#FF7676",
};

const light: AppPalette = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  surface2: "#F1F2F5",
  surface3: "#E6E8EE",
  border: "rgba(0,0,0,0.08)",
  borderStrong: "rgba(0,0,0,0.14)",
  text: "#1A1F2E",
  textDim: "#3D4458",
  textMuted: "#6B7280",
  accent: "#5B63E8",
  accentDim: "rgba(91,99,232,0.14)",
  onAccent: "#FFFFFF",
  success: "#1F9D6B",
  warn: "#C77A12",
  danger: "#D64545",
};

/** Built-in (non-custom) palettes. `custom` defaults to a copy of `navy`. */
export const appPalettes: Record<Exclude<AppThemeName, "custom">, AppPalette> = {
  navy,
  dark,
  light,
};

export const defaultAppTheme: AppThemeName = "navy";

/** Seed for the user-editable custom palette. */
export const defaultCustomPalette: AppPalette = { ...navy };

export const appThemeLabels: Record<AppThemeName, string> = {
  navy: "Dark Navy",
  dark: "Dark",
  light: "Light",
  custom: "Custom",
};

/** Resolve the active palette given the selected theme + the stored custom palette. */
export function resolveAppPalette(theme: AppThemeName, custom: AppPalette): AppPalette {
  if (theme === "custom") return custom;
  return appPalettes[theme];
}

/** Whether the palette is dark enough to want light status-bar content. */
export function isDarkPalette(palette: AppPalette): boolean {
  const hex = palette.bg.replace("#", "");
  if (hex.length < 6) return true;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Perceived luminance (0–255). < 140 → treat as dark.
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

/** Map a palette to the `--app-*` CSS variables consumed by Tailwind `app.*` tokens. */
export function paletteToVars(palette: AppPalette): Record<string, string> {
  return {
    "--app-bg": palette.bg,
    "--app-surface": palette.surface,
    "--app-surface-2": palette.surface2,
    "--app-surface-3": palette.surface3,
    "--app-border": palette.border,
    "--app-border-strong": palette.borderStrong,
    "--app-text": palette.text,
    "--app-text-dim": palette.textDim,
    "--app-text-muted": palette.textMuted,
    "--app-accent": palette.accent,
    "--app-accent-dim": palette.accentDim,
    "--app-on-accent": palette.onAccent,
    "--app-success": palette.success,
    "--app-warn": palette.warn,
    "--app-danger": palette.danger,
  };
}

/** Ordered palette slots for the custom-theme color editor (S9). */
export const customPaletteSlots: { key: keyof AppPalette; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "surface2", label: "Surface 2" },
  { key: "surface3", label: "Surface 3" },
  { key: "text", label: "Text" },
  { key: "textDim", label: "Text dim" },
  { key: "textMuted", label: "Text muted" },
  { key: "accent", label: "Accent" },
  { key: "onAccent", label: "On accent" },
  { key: "success", label: "Success" },
  { key: "warn", label: "Warning" },
  { key: "danger", label: "Danger" },
];
