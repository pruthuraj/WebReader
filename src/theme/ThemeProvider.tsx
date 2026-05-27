import { ReactNode, useEffect } from "react";
import { View } from "react-native";
import { colorScheme as nwColorScheme, useColorScheme, vars } from "nativewind";
import { useReaderStore } from "@/stores/readerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { isDarkPalette, paletteToVars, resolveAppPalette } from "./appThemes";
import { readerThemeClass } from "./readerThemes";

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Drives two independent theme layers:
 *  - App chrome (Phase 2d): `settings.appTheme` → `--app-*` CSS vars applied via
 *    vars() on the root subtree, consumed by Tailwind `app.*` tokens. Also syncs
 *    NativeWind's color scheme so legacy `dark:` utilities on not-yet-reskinned
 *    screens stay coherent.
 *  - Reader theme: `readerStore.appearance.theme` → `--reader-*` vars via a class,
 *    consumed by `reader.*` tokens inside the reader.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const appTheme = useSettingsStore((s) => s.settings.appTheme);
  const customPalette = useSettingsStore((s) => s.settings.customPalette);
  const readerTheme = useReaderStore((s) => s.appearance.theme);
  const { setColorScheme } = useColorScheme();

  const palette = resolveAppPalette(appTheme, customPalette);
  const dark = isDarkPalette(palette);

  useEffect(() => {
    const scheme = dark ? "dark" : "light";
    setColorScheme(scheme);
    nwColorScheme.set(scheme);
  }, [dark, setColorScheme]);

  return (
    <View
      className={`flex-1 ${readerThemeClass[readerTheme]}`}
      style={[{ flex: 1 }, vars(paletteToVars(palette))]}
    >
      {children}
    </View>
  );
}
