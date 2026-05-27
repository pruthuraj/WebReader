import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/ui/headers";
import { ContinueReadingRow } from "@/components/home/ContinueReadingRow";
import { DownloadedNovelsRow } from "@/components/home/DownloadedNovelsRow";
import { PopularNovelsRow } from "@/components/home/PopularNovelsRow";
import { RecentlyOpenedRow } from "@/components/home/RecentlyOpenedRow";
import { useHomeRows } from "@/hooks/useHomeRows";
import { useLibraryStore } from "@/stores/libraryStore";
import { useAppPalette } from "@/theme/useAppPalette";

export default function HomeScreen() {
  const router = useRouter();
  const palette = useAppPalette();
  const rows = useHomeRows();
  const shelves = useLibraryStore((s) => s.shelves);
  const refreshShelves = useLibraryStore((s) => s.refresh);
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    void refreshShelves();
  }, [refreshShelves]);

  const onRefresh = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setRefreshing(true);
    try {
      await Promise.all([rows.refresh(), refreshShelves()]);
    } finally {
      setRefreshing(false);
      inFlightRef.current = false;
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={palette.textMuted}
        />
      }
    >
      <AppHeader
        title="NovelReader"
        subtitle="Read, listen, and collect web novels — offline first."
        right={
          <Pressable
            onPress={() => router.push("/search")}
            accessibilityRole="button"
            accessibilityLabel="Search"
            className="h-10 w-10 items-center justify-center active:opacity-70"
          >
            <Feather name="search" size={22} color={palette.text} />
          </Pressable>
        }
      />

      <View className="px-5 pt-2">
        <Pressable
          onPress={() => router.push("/shelves" as never)}
          className="flex-row items-center rounded-2xl border border-app-border bg-app-surface p-4 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Your shelves"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-app-accent-dim">
            <Feather name="folder" size={18} color={palette.accent} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-app-text">Your shelves</Text>
            <Text className="mt-0.5 text-xs text-app-text-muted">
              {shelves.length} {shelves.length === 1 ? "shelf" : "shelves"}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={palette.textMuted} />
        </Pressable>
      </View>

      {rows.loading ? (
        <View className="mx-5 mt-4 rounded-2xl border border-app-border bg-app-surface p-5">
          <ActivityIndicator color={palette.accent} />
          <Text className="mt-3 text-center text-xs text-app-text-muted">
            Loading your local library
          </Text>
        </View>
      ) : null}

      <ContinueReadingRow data={rows.continueReading} />
      <RecentlyOpenedRow data={rows.recentlyOpened} />
      <PopularNovelsRow data={rows.popular} />
      <DownloadedNovelsRow data={rows.downloaded} />
    </ScrollView>
  );
}
