import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { analytics } from "@/services/analytics";
import type { AnalyticsEvent } from "@/data/types";
import { shortDate } from "@/utils/format";

const REFRESH_INTERVAL_MS = 2000;

interface EventStreamPreviewProps {
  limit?: number;
}

function payloadPreview(event: AnalyticsEvent): string {
  const parts: string[] = [];
  if (event.novelId) parts.push(event.novelId);
  if (event.chapterId) parts.push(event.chapterId);
  if (event.durationMs !== null && event.durationMs !== undefined) {
    parts.push(`${Math.round(event.durationMs / 100) / 10}s`);
  }
  if (event.payload) {
    for (const [k, v] of Object.entries(event.payload)) {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      if (s.length > 0 && s.length < 32) parts.push(`${k}=${s}`);
    }
  }
  return parts.join(" · ");
}

export function EventStreamPreview({ limit = 20 }: EventStreamPreviewProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const rows = await analytics.recentEvents(limit);
      if (!cancelled) setEvents(rows);
    }
    void load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [limit]);

  if (!events.length) {
    return (
      <View className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          No events recorded yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
      {events.map((event, index) => (
        <View
          key={event.id ?? `${event.type}-${index}`}
          className={`flex-row items-start px-4 py-2.5 ${
            index > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""
          }`}
        >
          <Text className="w-24 text-[11px] font-black uppercase text-indigo-500 dark:text-indigo-300">
            {event.type}
          </Text>
          <View className="flex-1 pr-2">
            <Text className="text-xs text-slate-700 dark:text-slate-200" numberOfLines={2}>
              {payloadPreview(event) || "(no payload)"}
            </Text>
          </View>
          <Text className="text-[10px] text-slate-400">{shortDate(event.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}
