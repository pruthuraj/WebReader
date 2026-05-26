import "../global.css";

import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider } from "@/theme/ThemeProvider";
import { bootstrap, type BootstrapResult } from "@/bootstrap";

export default function RootLayout() {
  const [ready, setReady] = useState<BootstrapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-lg font-bold text-red-600">Startup failed</Text>
        <Text className="mt-2 text-center text-sm text-gray-700">{error}</Text>
      </View>
    );
  }

  if (!ready) {
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
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#0F172A" },
              headerTintColor: "#F8FAFC",
              headerTitleStyle: { fontWeight: "600" },
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="novel/[id]" options={{ title: "Novel" }} />
            <Stack.Screen
              name="reader/[novelId]/[chapterId]"
              options={{ title: "Reader", headerBackTitle: "Back" }}
            />
            <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Stack.Screen name="sources" options={{ title: "Sources" }} />
            <Stack.Screen name="shelves" options={{ title: "Shelves" }} />
            <Stack.Screen name="shelf/[id]" options={{ title: "Shelf" }} />
            <Stack.Screen
              name="tts-pronunciation"
              options={{ title: "Pronunciation rules" }}
            />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
