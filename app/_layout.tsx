import "../global.css";

import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider } from "@/theme/ThemeProvider";
import { readerFontAssets } from "@/theme/readerFonts";
import { isDarkPalette } from "@/theme/appThemes";
import { useAppPalette } from "@/theme/useAppPalette";
import { bootstrap, type BootstrapResult } from "@/bootstrap";

export default function RootLayout() {
  const [ready, setReady] = useState<BootstrapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts(readerFontAssets);

  useEffect(() => {
    let cancelled = false;
    bootstrap()
      .then((res) => {
        if (!cancelled) setReady(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-lg font-bold text-red-600">Startup failed</Text>
        <Text className="mt-2 text-center text-sm text-gray-700">
          {error ?? fontError?.message}
        </Text>
      </View>
    );
  }

  if (!ready || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
        <Text className="mt-3 text-sm text-gray-500">Preparing your library…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppStack() {
  const palette = useAppPalette();
  const dark = isDarkPalette(palette);
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          headerTitleStyle: { fontWeight: "600", color: palette.text },
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* These render their own in-content header (ScreenHeader). */}
        <Stack.Screen name="novel/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="reader/[novelId]/[chapterId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="sources" options={{ title: "Sources" }} />
        <Stack.Screen name="shelves" options={{ title: "Shelves" }} />
        <Stack.Screen name="shelf/[id]" options={{ title: "Shelf" }} />
        <Stack.Screen name="tts-pronunciation" options={{ title: "Pronunciation rules" }} />
      </Stack>
    </>
  );
}
