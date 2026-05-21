import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { eventRepo } from "@/db/repositories/eventRepo";

interface DashSummary {
  searches: number;
  novelOpens: number;
  chaptersRead: number;
  totalEvents: number;
}

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [searches, novelOpens, chaptersRead, totalEvents] = await Promise.all([
        eventRepo.countByType("search"),
        eventRepo.countByType("novel_open"),
        eventRepo.countByType("chapter_read"),
        eventRepo.totalCount(),
      ]);
      if (!cancelled) setSummary({ searches, novelOpens, chaptersRead, totalEvents });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16 }}
    >
      <Text className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400">
        Local-only metrics. No data leaves the device.
      </Text>

      {!summary ? (
        <View className="mt-8 items-center">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="mt-6 flex-row flex-wrap gap-3">
          <Metric label="Searches" value={summary.searches} />
          <Metric label="Novel opens" value={summary.novelOpens} />
          <Metric label="Chapters read" value={summary.chaptersRead} />
          <Metric label="Total events" value={summary.totalEvents} />
        </View>
      )}

      <Text className="mt-6 text-xs text-slate-400">
        Phase D will add charts, top novels, drop-off, and TTS minutes.
      </Text>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View className="min-w-[45%] flex-grow rounded-xl bg-white p-4 dark:bg-slate-800">
      <Text className="text-xs uppercase tracking-wider text-slate-400">{label}</Text>
      <Text className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</Text>
    </View>
  );
}
