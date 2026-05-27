import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { ScreenHeader } from "@/components/ui/headers";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DropOffChart } from "@/components/dashboard/DropOffChart";
import { EventStreamPreview } from "@/components/dashboard/EventStreamPreview";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RangePicker } from "@/components/dashboard/RangePicker";
import { TopNovelsList } from "@/components/dashboard/TopNovelsList";
import {
  analytics,
  type AnalyticsSummary,
  type Range,
  type TopNovelEntry,
} from "@/services/analytics";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAppPalette } from "@/theme/useAppPalette";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-2 mt-6">
      <Text className="text-base font-bold text-app-text">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-xs text-app-text-muted">{subtitle}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const palette = useAppPalette();
  const devMode = useSettingsStore((s) => s.settings.devMode);
  const [range, setRange] = useState<Range>("all");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topNovels, setTopNovels] = useState<TopNovelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [nextSummary, nextTop] = await Promise.all([
      analytics.summary(range),
      analytics.topNovels(range, 5),
    ]);
    setSummary(nextSummary);
    setTopNovels(nextTop);
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isEmpty = summary !== null && summary.totalEvents === 0;
  const avgSessionMinutes = summary
    ? Math.round((summary.averageSessionMs / 60000) * 10) / 10
    : 0;

  return (
    <View className="flex-1 bg-app-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Dashboard" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textMuted} />
        }
      >
        <RangePicker value={range} onChange={setRange} />

        {loading && !summary ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color={palette.accent} />
          </View>
        ) : isEmpty ? (
          <DashboardEmptyState />
        ) : summary ? (
          <>
            <SectionHeader title="Activity" subtitle="Counts in selected range." />
            <View className="flex-row flex-wrap gap-3">
              <MetricCard label="Searches" value={summary.searches} />
              <MetricCard label="Novel opens" value={summary.novelOpens} />
              <MetricCard label="Chapters read" value={summary.chaptersRead} />
              <MetricCard label="TTS minutes" value={summary.ttsMinutes} suffix="min" emphasis="muted" />
              <MetricCard label="Avg session" value={avgSessionMinutes} suffix="min" emphasis="muted" />
            </View>

            <SectionHeader title="Top novels" subtitle="Most opened in this range." />
            <TopNovelsList items={topNovels} />

            <SectionHeader
              title="Drop-off"
              subtitle="Chapter index vs opens for your most-opened novel."
            />
            <DropOffChart candidates={topNovels} />

            {devMode ? (
              <>
                <SectionHeader title="Recent events" subtitle="Dev-mode stream of the last 20." />
                <EventStreamPreview />
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
