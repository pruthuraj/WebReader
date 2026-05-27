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
  const primary = variant === "primary";
  const color = primary ? "#0B1220" : variant === "stop" ? "#7782A0" : "#E8EBF1";
  const sizeClass = primary ? "h-14 w-14" : "h-11 w-11";
  const bgStyle = primary ? { backgroundColor: "#8B95FF" } : undefined;
  const opacityClass = disabled ? "opacity-40" : "active:opacity-75";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={bgStyle}
      className={`${sizeClass} items-center justify-center rounded-full ${opacityClass}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Feather name={icon} size={primary ? 24 : 22} color={color} />
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
                style={selected ? { backgroundColor: "#8B95FF" } : undefined}
                className={`m-1 rounded-full px-3 py-2 ${selected ? "" : "bg-white/10"}`}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: selected ? "#0B1220" : "#E8EBF1" }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      ) : null}

      <View
        className="mx-3.5 mb-6 flex-row items-center justify-between rounded-[24px] px-4 py-3"
        style={{
          backgroundColor: "rgba(20,28,46,0.97)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
        }}
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
        <PlaybackButton
          icon="square"
          label="Stop"
          variant="stop"
          disabled={!showStop}
          onPress={() => {
            void stop();
            setSleepOpen(false);
          }}
        />
        <Pressable
          onPress={() => setSleepOpen((open) => !open)}
          className="h-11 min-w-[44px] items-center justify-center rounded-full px-2 active:opacity-75"
          accessibilityRole="button"
          accessibilityLabel="Sleep timer"
        >
          <Feather name="clock" size={20} color={sleepRemainingSec ? "#8B95FF" : "#7782A0"} />
          {sleepRemainingSec ? (
            <Text className="mt-0.5 text-[9px] font-bold" style={{ color: "#8B95FF" }}>
              {Math.ceil(sleepRemainingSec / 60)}m
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
