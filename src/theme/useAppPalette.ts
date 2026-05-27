import { useSettingsStore } from "@/stores/settingsStore";
import { resolveAppPalette, type AppPalette } from "./appThemes";

/**
 * Active app-chrome palette object. Use for inline styles where Tailwind `app.*`
 * tokens don't reach — StatusBar, gradients, charts, navigator screenOptions.
 */
export function useAppPalette(): AppPalette {
  const appTheme = useSettingsStore((s) => s.settings.appTheme);
  const customPalette = useSettingsStore((s) => s.settings.customPalette);
  return resolveAppPalette(appTheme, customPalette);
}
