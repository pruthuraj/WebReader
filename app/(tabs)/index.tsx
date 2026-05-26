import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { ContinueReadingRow } from "@/components/home/ContinueReadingRow";
import { DownloadedNovelsRow } from "@/components/home/DownloadedNovelsRow";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PopularNovelsRow } from "@/components/home/PopularNovelsRow";
import { RecentlyOpenedRow } from "@/components/home/RecentlyOpenedRow";
import { useHomeRows } from "@/hooks/useHomeRows";
import { useLibraryStore } from "@/stores/libraryStore";

export default function HomeScreen() {
  const router = useRouter();
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
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <HomeHeader />

      <Pressable
        onPress={() => router.push("/shelves" as never)}
        className="mb-6 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 active:opacity-80 dark:border-slate-800 dark:bg-slate-900"
        accessibilityRole="button"
        accessibilityLabel="Your shelves"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950">
          <Feather name="folder" size={18} color="#6366F1" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm font-black text-slate-900 dark:text-slate-50">Your shelves</Text>
          <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {shelves.length} {shelves.length === 1 ? "shelf" : "shelves"}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#94A3B8" />
      </Pressable>

      {rows.loading ? (
        <View className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <ActivityIndicator />
          <Text className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
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

