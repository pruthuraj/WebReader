// Charts via react-native-svg (hand-rolled bars).
// victory-native was evaluated and skipped: a single bar chart does not
// justify the dependency footprint. If charts proliferate, revisit.

import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useAppPalette } from "@/theme/useAppPalette";
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
  const palette = useAppPalette();
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
      <View className="rounded-2xl border border-app-border p-4">
        <Text className="text-xs text-app-text-muted">Open a chapter to see drop-off here.</Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-app-border bg-app-surface p-4">
      <View className="mb-3 flex-row flex-wrap">
        {candidates.map((entry) => {
          const selected = entry.novel.id === selectedNovelId;
          return (
            <Pressable
              key={entry.novel.id}
              onPress={() => setSelectedNovelId(entry.novel.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`mb-2 mr-2 rounded-full px-3 py-1.5 active:opacity-75 ${
                selected ? "bg-app-accent" : "bg-app-surface-2"
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  selected ? "text-app-on-accent" : "text-app-text-dim"
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
        <Text className="py-6 text-center text-xs text-app-text-muted">Loading chart…</Text>
      ) : data.length === 0 ? (
        <Text className="py-6 text-center text-xs text-app-text-muted">
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
                  barColor={entry.opens > 0 ? palette.accent : palette.surface3}
                  labelColor={palette.textMuted}
                  valueColor={palette.textDim}
                />
              );
            })}
          </Svg>
        </ScrollView>
      )}

      <Text className="mt-2 text-[10px] text-app-text-muted">
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
  barColor,
  labelColor,
  valueColor,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  labelY: number;
  opens: number;
  barColor: string;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <>
      <Rect x={x} y={y} width={width} height={height} rx={4} fill={barColor} />
      <SvgText x={x + width / 2} y={labelY} fontSize={10} fill={labelColor} textAnchor="middle">
        {label}
      </SvgText>
      {opens > 0 ? (
        <SvgText
          x={x + width / 2}
          y={y - 4}
          fontSize={9}
          fontWeight="bold"
          fill={valueColor}
          textAnchor="middle"
        >
          {opens}
        </SvgText>
      ) : null}
    </>
  );
}
