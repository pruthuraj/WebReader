import type { ComponentProps } from "react";
import { Pressable, Text, View, type DimensionValue } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { ChapterMeta } from "@/data/types";
import { percentLabel } from "@/utils/format";

interface ReaderExpandedControlsProps {
  visible: boolean;
  percent: number;
  novelTitle: string;
  chapterTitle: string;
  chapterIdx: number;
  totalChapters: number;
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
  onClose: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenAppearance: () => void;
  onOpenTtsSettings: () => void;
  onOpenContents: () => void;
  onOpenAbout: () => void;
  onOpenDownloads: () => void;
}

function ToolTile({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-1 rounded-2xl bg-white/10 p-4 active:opacity-75"
      accessibilityRole="button"
    >
      <Feather name={icon} size={22} color="#F8FAFC" />
      <Text className="mt-3 text-sm font-black text-white" numberOfLines={1}>
        {label}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-xs text-white/60" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ReaderExpandedControls({
  visible,
  percent,
  novelTitle,
  chapterTitle,
  chapterIdx,
  totalChapters,
  prev,
  next,
  onClose,
  onPrevChapter,
  onNextChapter,
  onOpenAppearance,
  onOpenTtsSettings,
  onOpenContents,
  onOpenAbout,
  onOpenDownloads,
}: ReaderExpandedControlsProps) {
  if (!visible) return null;

  const clampedPercent = Math.max(0, Math.min(1, percent));
  const progressWidth = `${clampedPercent * 100}%` as DimensionValue;

  return (
    <View pointerEvents="box-none" className="absolute inset-0 z-40">
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(120)}
        className="absolute inset-0 bg-black/40"
      />
      <Pressable
        className="absolute inset-0"
        onPress={onClose}
        accessibilityLabel="Collapse reader controls"
      />

      <View pointerEvents="box-none" className="absolute inset-x-0 bottom-24">
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          className="mx-3 overflow-hidden rounded-[30px] p-4"
          style={{ backgroundColor: "rgba(2, 6, 23, 0.94)" }}
        >
          <View className="mb-4 rounded-3xl bg-white/10 p-4">
            <Text className="text-xs font-black uppercase text-yellow-300">
              {percentLabel(clampedPercent)}, Ch.{chapterIdx} of {totalChapters}
            </Text>
            <Text className="mt-1 text-lg font-black text-white" numberOfLines={1}>
              {chapterTitle}
            </Text>
            <Text className="mt-1 text-xs text-white/60" numberOfLines={1}>
              {novelTitle}
            </Text>

            <View className="mt-4 flex-row items-center">
              <Pressable
                disabled={!prev}
                onPress={onPrevChapter}
                className={`h-10 w-10 items-center justify-center rounded-full bg-white/10 ${
                  prev ? "" : "opacity-30"
                }`}
                accessibilityLabel="Previous chapter"
              >
                <Feather name="chevron-left" size={26} color="#FDE68A" />
              </Pressable>
              <View className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
                <View
                  className="h-[3px] rounded-full bg-yellow-300"
                  style={{ width: progressWidth }}
                />
              </View>
              <Pressable
                disabled={!next}
                onPress={onNextChapter}
                className={`h-10 w-10 items-center justify-center rounded-full bg-white/10 ${
                  next ? "" : "opacity-30"
                }`}
                accessibilityLabel="Next chapter"
              >
                <Feather name="chevron-right" size={26} color="#FDE68A" />
              </Pressable>
            </View>
          </View>

          <View className="flex-row gap-3">
            <ToolTile
              icon="list"
              label="Contents"
              subtitle={`${totalChapters} chapters`}
              onPress={onOpenContents}
            />
            <ToolTile icon="info" label="About" subtitle="Book details" onPress={onOpenAbout} />
          </View>
          <View className="flex-row gap-3">
            <ToolTile
              icon="volume-2"
              label="TTS"
              subtitle="Voice settings"
              onPress={onOpenTtsSettings}
            />
            <ToolTile
              icon="type"
              label="Appearance"
              subtitle="Aa theme"
              onPress={onOpenAppearance}
            />
            <ToolTile
              icon="download"
              label="Downloads"
              subtitle="Queue"
              onPress={onOpenDownloads}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
