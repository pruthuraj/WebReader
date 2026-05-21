import { ReactNode, useEffect } from "react";
import { View } from "react-native";
import { colorScheme as nwColorScheme, useColorScheme } from "nativewind";
import { useReaderStore } from "@/stores/readerStore";
import { readerThemeClass } from "./readerThemes";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useReaderStore((s) => s.appearance.theme);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (theme === "dark") {
      setColorScheme("dark");
      nwColorScheme.set("dark");
    } else {
      setColorScheme("light");
      nwColorScheme.set("light");
    }
  }, [theme, setColorScheme]);

  const themeClass = readerThemeClass[theme];

  return (
    <View className={`flex-1 ${themeClass}`} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
