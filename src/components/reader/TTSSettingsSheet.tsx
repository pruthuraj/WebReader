import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import type { Voice } from "expo-speech";
import { useAnimatedSheet } from "@/hooks/useAnimatedSheet";
import { tts } from "@/services/tts";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";

interface TTSSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS = ["en-US", "en-GB", "en-AU", "hi-IN"];

const SLEEP_OPTIONS: { label: string; sec: number | null }[] = [
  { label: "Off", sec: null },
  { label: "5m", sec: 300 },
  { label: "15m", sec: 900 },
  { label: "30m", sec: 1800 },
  { label: "60m", sec: 3600 },
];

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-black uppercase text-white/60">{label}</Text>
      <View className="flex-row items-center rounded-2xl bg-white/5 p-2">
        <Pressable
          onPress={onMinus}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
        >
          <Text className="text-xl font-black text-white">-</Text>
        </Pressable>
        <Text className="flex-1 text-center text-base font-black text-white">{value}</Text>
        <Pressable
          onPress={onPlus}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
        >
          <Text className="text-xl font-black text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({
  label,
  selected,
  accent = "yellow",
  onPress,
}: {
  label: string;
  selected: boolean;
  accent?: "yellow" | "cyan";
  onPress: () => void;
}) {
  const selectedBg = accent === "cyan" ? "bg-cyan-400" : "bg-yellow-300";
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 mt-2 rounded-full px-3 py-2 ${selected ? selectedBg : "bg-white/10"}`}
    >
      <Text className={`text-xs font-black ${selected ? "text-slate-950" : "text-white/80"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TTSSettingsSheet({ visible, onClose }: TTSSettingsSheetProps) {
  const status = useTtsStore((s) => s.status);
  const speed = useTtsStore((s) => s.speed);
  const pitch = useTtsStore((s) => s.pitch);
  const language = useTtsStore((s) => s.language);
  const voiceId = useTtsStore((s) => s.voiceId);
  const autoPlayNext = useTtsStore((s) => s.autoPlayNext);
  const sleepTimerSec = useTtsStore((s) => s.sleepTimerSec);
  const sleepRemainingSec = useTtsStore((s) => s.sleepRemainingSec);
  const setSpeed = useTtsStore((s) => s.setSpeed);
  const setPitch = useTtsStore((s) => s.setPitch);
  const setVoice = useTtsStore((s) => s.setVoice);
  const setLanguage = useTtsStore((s) => s.setLanguage);
  const setAutoPlayNext = useTtsStore((s) => s.setAutoPlayNext);
  const setSleepTimer = useTtsStore((s) => s.setSleepTimer);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const { backdropStyle, sheetStyle } = useAnimatedSheet(visible);
  const [voices, setVoices] = useState<Voice[]>([]);

  useEffect(() => {
    if (!visible) return;
    tts.getVoices().then(setVoices);
  }, [visible]);

  const updateTtsDefault = async (
    partial: Partial<{
      speed: number;
      pitch: number;
      language: string;
      autoPlayNext: boolean;
    }>
  ) => {
    await updateSettings({ ttsDefaults: { ...settings.ttsDefaults, ...partial } });
  };

  const filteredVoices = voices
    .filter((voice) => voice.language?.toLowerCase().startsWith(language.toLowerCase().slice(0, 2)))
    .slice(0, 8);

  const statusLabel =
    status === "idle"
      ? "Ready"
      : status === "playing"
        ? "Playing"
        : "Paused";
  const sleepLabel = sleepRemainingSec
    ? ` · sleep ${Math.ceil(sleepRemainingSec / 60)}m left`
    : "";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
        <Pressable className="absolute inset-0" onPress={onClose} />
        <Animated.View
          className="max-h-[88%] overflow-hidden rounded-t-[28px] p-5"
          style={[sheetStyle, { backgroundColor: "rgba(2, 6, 23, 0.96)" }]}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-black text-white">Listen</Text>
              <Text className="mt-1 text-xs text-white/60">
                {statusLabel}
                {sleepLabel}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-pink-500/25 active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel="Close TTS settings"
            >
              <Feather name="x" size={18} color="#F472B6" />
            </Pressable>
          </View>

          <Text className="mb-3 text-[11px] text-white/50">
            Use the bottom playback bar to start, pause, skip, or stop reading.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-2 text-xs font-black uppercase text-white/60">Language</Text>
            <View className="mb-4 flex-row flex-wrap rounded-2xl bg-white/5 p-2">
              {LANGUAGE_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={language === option}
                  onPress={() => {
                    setLanguage(option);
                    void updateTtsDefault({ language: option });
                  }}
                />
              ))}
            </View>

            <Text className="mb-2 text-xs font-black uppercase text-white/60">Voice</Text>
            <View className="mb-4 flex-row flex-wrap rounded-2xl bg-white/5 p-2">
              <Chip label="Default" selected={!voiceId} onPress={() => setVoice(null)} />
              {filteredVoices.map((voice) => (
                <Chip
                  key={voice.identifier}
                  label={voice.name}
                  selected={voiceId === voice.identifier}
                  onPress={() => setVoice(voice.identifier)}
                />
              ))}
              {filteredVoices.length === 0 && !voiceId ? (
                <Text className="m-2 text-xs text-white/40">
                  No additional voices match {language}.
                </Text>
              ) : null}
            </View>

            <Stepper
              label="Speech rate"
              value={`${speed.toFixed(1)}x`}
              onMinus={() => {
                const next = Math.max(0.5, Math.round((speed - 0.1) * 10) / 10);
                setSpeed(next);
                void updateTtsDefault({ speed: next });
              }}
              onPlus={() => {
                const next = Math.min(2, Math.round((speed + 0.1) * 10) / 10);
                setSpeed(next);
                void updateTtsDefault({ speed: next });
              }}
            />
            <Stepper
              label="Pitch"
              value={pitch.toFixed(1)}
              onMinus={() => {
                const next = Math.max(0.5, Math.round((pitch - 0.1) * 10) / 10);
                setPitch(next);
                void updateTtsDefault({ pitch: next });
              }}
              onPlus={() => {
                const next = Math.min(2, Math.round((pitch + 0.1) * 10) / 10);
                setPitch(next);
                void updateTtsDefault({ pitch: next });
              }}
            />

            <Text className="mb-2 text-xs font-black uppercase text-white/60">Sleep timer</Text>
            <View className="mb-4 flex-row flex-wrap rounded-2xl bg-white/5 p-2">
              {SLEEP_OPTIONS.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  accent="cyan"
                  selected={sleepTimerSec === option.sec}
                  onPress={() => setSleepTimer(option.sec)}
                />
              ))}
            </View>

            <View className="mb-8 flex-row items-center justify-between rounded-2xl bg-white/5 p-4">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-black text-white">Auto-play next chapter</Text>
                <Text className="mt-1 text-xs text-white/60">
                  Continue reading when the current chapter ends.
                </Text>
              </View>
              <Switch
                value={autoPlayNext}
                onValueChange={(next) => {
                  setAutoPlayNext(next);
                  void updateTtsDefault({ autoPlayNext: next });
                }}
                trackColor={{ false: "#1E293B", true: "#FDE68A" }}
                thumbColor={autoPlayNext ? "#020617" : "#94A3B8"}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
