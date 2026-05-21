// Charts via react-native-svg (hand-rolled bars).
// victory-native was evaluated and skipped: a single bar chart does not
// justify the dependency footprint. If charts proliferate, revisit.

import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { analytics, type TopNovelEntry, type DropOffEntry } from "@/services/analytics";

interface DropOffChartProps {
  candidates: TopNovelEntry[];
}

const BAR_HEIGHT = 160;
const BAR_WIDTH = 22;
const BAR_GAP = 6;
const PADDING_X = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

export function DropOffChart({ candidates }: DropOffChartProps) {
  const fallbackId = candidates[0]?.novel.id ?? null;
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(fallbackId);
  const [data, setData] = useState<DropOffEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fallbackId) return;
    if (selectedNovelId === null) setSelectedNovelId(fallbackId);
  }, [fallbackId, selectedNovelId]);

  useEffect(() => {
    if (!selectedNovelId) {
      setData([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    analytics
      .dropOffByChapter(selectedNovelId)
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedNovelId]);

  const maxOpens = useMemo(() => Math.max(1, ...data.map((d) => d.opens)), [data]);
  const chartWidth = PADDING_X * 2 + data.length * BAR_WIDTH + Math.max(0, data.length - 1) * BAR_GAP;
  const chartHeight = BAR_HEIGHT + PADDING_TOP + PADDING_BOTTOM;

  if (!candidates.length) {
    return (
      <View className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          Open a chapter to see drop-off here.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-white p-4 dark:bg-slate-900">
      <View className="mb-3 flex-row flex-wrap">
        {candidates.map((entry) => {
          const selected = entry.novel.id === selectedNovelId;
          return (
            <Pressable
              key={entry.novel.id}
              onPress={() => setSelectedNovelId(entry.novel.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`mr-2 mb-2 rounded-full px-3 py-1.5 ${
                selected
                  ? "bg-indigo-500 dark:bg-indigo-400"
                  : "bg-slate-100 dark:bg-slate-800"
              } active:opacity-75`}
            >
              <Text
                className={`text-[11px] font-black ${
                  selected ? "text-white" : "text-slate-600 dark:text-slate-300"
                }`}
                numberOfLines={1}
              >
                {entry.novel.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <Text className="py-6 text-center text-xs text-slate-400">Loading chart…</Text>
      ) : data.length === 0 ? (
        <Text className="py-6 text-center text-xs text-slate-400">
          No chapter opens for this novel yet.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={chartWidth} height={chartHeight}>
            {data.map((entry, index) => {
              const ratio = entry.opens / maxOpens;
              const barH = Math.max(2, ratio * BAR_HEIGHT);
              const x = PADDING_X + index * (BAR_WIDTH + BAR_GAP);
              const y = PADDING_TOP + (BAR_HEIGHT - barH);
              return (
                <SvgGroupedBar
                  key={entry.chapterId}
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barH}
                  label={`${entry.idx}`}
                  labelY={PADDING_TOP + BAR_HEIGHT + 16}
                  opens={entry.opens}
                />
              );
            })}
          </Svg>
        </ScrollView>
      )}

      <Text className="mt-2 text-[10px] text-slate-400">
        Bars show opens per chapter index. Tall first bar + tapering = healthy drop-off.
      </Text>
    </View>
  );
}

function SvgGroupedBar({
  x,
  y,
  width,
  height,
  label,
  labelY,
  opens,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  labelY: number;
  opens: number;
}) {
  return (
    <>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={opens > 0 ? "#6366F1" : "#CBD5E1"}
      />
      <SvgText
        x={x + width / 2}
        y={labelY}
        fontSize={10}
        fill="#94A3B8"
        textAnchor="middle"
      >
        {label}
      </SvgText>
      {opens > 0 ? (
        <SvgText
          x={x + width / 2}
          y={y - 4}
          fontSize={9}
          fontWeight="bold"
          fill="#475569"
          textAnchor="middle"
        >
          {opens}
        </SvgText>
      ) : null}
    </>
  );
}
