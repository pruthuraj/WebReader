// Reader font registry (Phase 2d). Fonts apply to READER TEXT ONLY — the app
// chrome stays on the system UI font. Families are bundled via @expo-google-fonts
// and loaded with useFonts() in app/_layout.tsx. The keys below ARE the runtime
// fontFamily names once loaded (that's how @expo-google-fonts names its assets).

import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from "@expo-google-fonts/raleway";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import {
  LibreCaslonText_400Regular,
  LibreCaslonText_700Bold,
} from "@expo-google-fonts/libre-caslon-text";
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_700Bold,
} from "@expo-google-fonts/libre-baskerville";

import type { FontStyle } from "@/stores/readerStore";

/** Font asset map handed to `useFonts()` at boot. Keys = runtime family names. */
export const readerFontAssets = {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  LibreCaslonText_400Regular,
  LibreCaslonText_700Bold,
  LibreBaskerville_400Regular,
  LibreBaskerville_700Bold,
};

type Weight = "regular" | "medium" | "semibold" | "bold";

// Per family, the loaded asset name for each weight. Libre Caslon / Baskerville
// only ship 400 + 700, so medium/semibold fall back to the nearest available.
const families: Record<Exclude<FontStyle, "system">, Record<Weight, string>> = {
  lora: {
    regular: "Lora_400Regular",
    medium: "Lora_500Medium",
    semibold: "Lora_600SemiBold",
    bold: "Lora_700Bold",
  },
  inter: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  raleway: {
    regular: "Raleway_400Regular",
    medium: "Raleway_500Medium",
    semibold: "Raleway_600SemiBold",
    bold: "Raleway_700Bold",
  },
  montserrat: {
    regular: "Montserrat_400Regular",
    medium: "Montserrat_500Medium",
    semibold: "Montserrat_600SemiBold",
    bold: "Montserrat_700Bold",
  },
  caslon: {
    regular: "LibreCaslonText_400Regular",
    medium: "LibreCaslonText_400Regular",
    semibold: "LibreCaslonText_700Bold",
    bold: "LibreCaslonText_700Bold",
  },
  baskerville: {
    regular: "LibreBaskerville_400Regular",
    medium: "LibreBaskerville_400Regular",
    semibold: "LibreBaskerville_700Bold",
    bold: "LibreBaskerville_700Bold",
  },
};

/**
 * Resolve a reader fontFamily for a given style + weight. `"system"` returns
 * undefined so RN uses the platform default face (and native fontWeight applies).
 */
export function readerFontFamily(
  fontStyle: FontStyle,
  weight: Weight = "regular"
): string | undefined {
  if (fontStyle === "system") return undefined;
  return families[fontStyle]?.[weight] ?? families.lora[weight];
}

export const readerFontOptions: { key: FontStyle; label: string }[] = [
  { key: "lora", label: "Lora" },
  { key: "caslon", label: "Caslon" },
  { key: "baskerville", label: "Baskerville" },
  { key: "inter", label: "Inter" },
  { key: "raleway", label: "Raleway" },
  { key: "montserrat", label: "Montserrat" },
  { key: "system", label: "System" },
];

export const readerFontLabels: Record<FontStyle, string> = {
  lora: "Lora",
  caslon: "Caslon",
  baskerville: "Baskerville",
  inter: "Inter",
  raleway: "Raleway",
  montserrat: "Montserrat",
  system: "System",
};
