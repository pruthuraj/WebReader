import { useState } from "react";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { ChapterMeta } from "@/data/types";
import { useTtsStore } from "@/stores/ttsStore";

interface ReaderPlaybackBarProps {
  text: string;
  novelId: string;
  chapterId: string;
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

type ButtonVariant = "default" | "primary" | "stop";

function PlaybackButton({
  icon,
  label,
  variant = "default",
  disabled,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onPress: () => void;
}) {
  let bg = "bg-white/10";
  let color = "#F8FAFC";
  if (variant === "primary") {
    bg = "bg-white";
    color = "#020617";
  } else if (variant === "stop") {
    bg = "bg-white/10";
    color = "#FCA5A5";
  }

  const opacityClass = disabled ? "opacity-40" : "active:opacity-75";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-11 w-11 items-center justify-center rounded-full ${bg} ${opacityClass}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Feather name={icon} size={variant === "primary" ? 22 : 18} color={color} />
    </Pressable>
  );
}

const SLEEP_OPTIONS = [
  { label: "Off", seconds: null },
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "30m", seconds: 1800 },
  { label: "60m", seconds: 3600 },
];

export function ReaderPlaybackBar({
  text,
  novelId,
  chapterId,
  prev,
  next,
  onPrevChapter,
  onNextChapter,
}: ReaderPlaybackBarProps) {
  const [sleepOpen, setSleepOpen] = useState(false);
  const status = useTtsStore((s) => s.status);
  const sleepTimerSec = useTtsStore((s) => s.sleepTimerSec);
  const sleepRemainingSec = useTtsStore((s) => s.sleepRemainingSec);
  const highlightedSentenceIdx = useTtsStore((s) => s.highlightSentenceIdx);
  const playFromSentence = useTtsStore((s) => s.playFromSentence);
  const pause = useTtsStore((s) => s.pause);
  const resume = useTtsStore((s) => s.resume);
  const stop = useTtsStore((s) => s.stop);
  const setSleepTimer = useTtsStore((s) => s.setSleepTimer);

  const showStop = status !== "idle";
  const playIcon = status === "playing" ? "pause" : "play";

  const playPause = () => {
    if (status === "playing") {
      void pause();
      return;
    }
    if (status === "paused") {
      void resume();
      return;
    }
    void playFromSentence(text, highlightedSentenceIdx ?? 0, { novelId, chapterId });
  };

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 z-50">
      {sleepOpen ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          className="mx-3 mb-2 flex-row flex-wrap rounded-2xl p-2"
          style={{ backgroundColor: "rgba(2, 6, 23, 0.94)" }}
        >
          {SLEEP_OPTIONS.map((option) => {
            const selected = sleepTimerSec === option.seconds;
            return (
              <Pressable
                key={option.label}
                onPress={() => {
                  setSleepTimer(option.seconds);
                  setSleepOpen(false);
                }}
                className={`m-1 rounded-full px-3 py-2 ${
                  selected ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    selected ? "text-slate-950" : "text-white"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      ) : null}

      <View
        className="mx-3 mb-5 flex-row items-center gap-2 rounded-full p-2"
        style={{ backgroundColor: "rgba(2, 6, 23, 0.94)" }}
      >
        <PlaybackButton
          icon="chevron-left"
          label="Previous chapter"
          disabled={!prev}
          onPress={onPrevChapter}
        />
        <PlaybackButton
          icon={playIcon}
          label={status === "playing" ? "Pause" : "Play"}
          variant="primary"
          onPress={playPause}
        />
        <PlaybackButton
          icon="chevron-right"
          label="Next chapter"
          disabled={!next}
          onPress={onNextChapter}
        />
        {showStop ? (
          <PlaybackButton
            icon="square"
            label="Stop"
            variant="stop"
            onPress={() => {
              void stop();
              setSleepOpen(false);
            }}
          />
        ) : null}
        <View className="flex-1" />
        <Pressable
          onPress={() => setSleepOpen((open) => !open)}
          className="h-11 min-w-[44px] items-center justify-center rounded-full bg-cyan-500 px-3 active:opacity-75"
          accessibilityRole="button"
          accessibilityLabel="Sleep timer"
        >
          <Feather name="clock" size={17} color="#FFFFFF" />
          {sleepRemainingSec ? (
            <Text className="mt-0.5 text-[9px] font-black text-white">
              {Math.ceil(sleepRemainingSec / 60)}m
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
