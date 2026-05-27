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
      <View className="rounded-2xl border border-app-border p-4">
        <Text className="text-xs text-app-text-muted">No events recorded yet.</Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
      {events.map((event, index) => (
        <View
          key={event.id ?? `${event.type}-${index}`}
          className={`flex-row items-start px-4 py-2.5 ${
            index > 0 ? "border-t border-app-border" : ""
          }`}
        >
          <Text className="w-24 text-[11px] font-bold uppercase text-app-accent">{event.type}</Text>
          <View className="flex-1 pr-2">
            <Text className="text-xs text-app-text-dim" numberOfLines={2}>
              {payloadPreview(event) || "(no payload)"}
            </Text>
          </View>
          <Text className="text-[10px] text-app-text-muted">{shortDate(event.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}
