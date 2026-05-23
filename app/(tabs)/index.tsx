import { useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { ContinueReadingRow } from "@/components/home/ContinueReadingRow";
import { DownloadedNovelsRow } from "@/components/home/DownloadedNovelsRow";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PopularNovelsRow } from "@/components/home/PopularNovelsRow";
import { RecentlyOpenedRow } from "@/components/home/RecentlyOpenedRow";
import { useHomeRows } from "@/hooks/useHomeRows";

export default function HomeScreen() {
  const rows = useHomeRows();
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  const onRefresh = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setRefreshing(true);
    try {
      await rows.refresh();
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

