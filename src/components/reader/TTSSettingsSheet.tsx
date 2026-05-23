import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import type { Voice } from "expo-speech";
import { useAnimatedSheet } from "@/hooks/useAnimatedSheet";
import { pronunciationRepo } from "@/db/repositories/pronunciationRepo";
import { tts } from "@/services/tts";
import {
  defaultTtsCleaning,
  useSettingsStore,
  type HighlightMode,
  type TtsCleaningToggles,
} from "@/stores/settingsStore";
import { useTtsStore, type SleepTimerValue } from "@/stores/ttsStore";

interface TTSSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS = ["en-US", "en-GB", "en-AU", "hi-IN"];

const SLEEP_OPTIONS: { label: string; value: SleepTimerValue }[] = [
  { label: "Off", value: null },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "30m", value: 1800 },
  { label: "60m", value: 3600 },
  { label: "EOC", value: "eoc" },
];

const PAUSE_OPTIONS: { label: string; value: number }[] = [
  { label: "Off", value: 0 },
  { label: "100ms", value: 100 },
  { label: "200ms", value: 200 },
  { label: "400ms", value: 400 },
  { label: "800ms", value: 800 },
];

const HIGHLIGHT_OPTIONS: { label: string; value: HighlightMode }[] = [
  { label: "Sentence", value: "sentence" },
  { label: "Paragraph", value: "paragraph" },
  { label: "Underline para.", value: "underlineParagraph" },
  { label: "Comma", value: "comma" },
];

const CLEANING_ROWS: { key: keyof TtsCleaningToggles; label: string; subtitle?: string }[] = [
  { key: "symbols", label: "Skip symbols", subtitle: "Strip non-letter, non-number characters." },
  { key: "emojis", label: "Skip emojis" },
  { key: "superscript", label: "Skip superscript" },
  { key: "urls", label: "Skip URLs", subtitle: "Removes http:// and www. links." },
  { key: "brackets", label: "Skip [bracketed] text" },
  { key: "parens", label: "Skip (parenthetical) text" },
  {
    key: "spacedUppercase",
    label: "Collapse S P A C E D letters",
    subtitle: "H E L L O → HELLO.",
  },
  { key: "hyphens", label: "Soften hyphens" },
  { key: "lineBreakHyphens", label: "Re-join line-break hyphens" },
  { key: "linkedRefs", label: "Skip linked refs (^1, [1])" },
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

function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="mb-2 flex-row items-center justify-between rounded-2xl bg-white/5 p-3">
      <View className="flex-1 pr-3">
        <Text className="text-sm font-black text-white">{label}</Text>
        {subtitle ? <Text className="mt-0.5 text-xs text-white/60">{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#1E293B", true: "#FDE68A" }}
        thumbColor={value ? "#020617" : "#94A3B8"}
      />
    </View>
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
  const router = useRouter();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [showCleaning, setShowCleaning] = useState(false);
  const [pronunciationCounts, setPronunciationCounts] = useState({ total: 0, enabled: 0 });

  useEffect(() => {
    if (!visible) return;
    void tts.getVoices().then(setVoices);
    void Promise.all([pronunciationRepo.count(), pronunciationRepo.countEnabled()]).then(
      ([total, enabled]) => setPronunciationCounts({ total, enabled })
    );
  }, [visible]);

  const openPronunciation = () => {
    onClose();
    // Typed routes file does not refresh until next `expo start`.
    // Cast keeps tsc happy; the route resolves at runtime.
    router.push("/tts-pronunciation" as never);
  };

  const ttsDefaults = settings.ttsDefaults;
  const cleaning = ttsDefaults.cleaning ?? defaultTtsCleaning;

  const updateTtsDefault = async (
    partial: Partial<{
      speed: number;
      pitch: number;
      language: string;
      autoPlayNext: boolean;
      autoStartOnOpen: boolean;
      sentencePauseMs: number;
      highlightMode: HighlightMode;
      cleaning: TtsCleaningToggles;
    }>
  ) => {
    await updateSettings({ ttsDefaults: { ...ttsDefaults, ...partial } });
  };

  const updateCleaning = async (key: keyof TtsCleaningToggles, value: boolean) => {
    await updateTtsDefault({ cleaning: { ...cleaning, [key]: value } });
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
  const sleepLabel =
    sleepTimerSec === "eoc"
      ? " · sleep at chapter end"
      : sleepRemainingSec
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

            <Text className="mb-2 text-xs font-black uppercase text-white/60">
              Pause between sentences
            </Text>
            <View className="mb-4 flex-row flex-wrap rounded-2xl bg-white/5 p-2">
              {PAUSE_OPTIONS.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  selected={ttsDefaults.sentencePauseMs === option.value}
                  onPress={() => void updateTtsDefault({ sentencePauseMs: option.value })}
                />
              ))}
            </View>

            <Text className="mb-2 text-xs font-black uppercase text-white/60">Highlight</Text>
            <View className="mb-4 flex-row flex-wrap rounded-2xl bg-white/5 p-2">
              {HIGHLIGHT_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={ttsDefaults.highlightMode === option.value}
                  onPress={() => void updateTtsDefault({ highlightMode: option.value })}
                />
              ))}
            </View>

            <Text className="mb-2 text-xs font-black uppercase text-white/60">Sleep timer</Text>
            <View className="mb-4 flex-row flex-wrap rounded-2xl bg-white/5 p-2">
              {SLEEP_OPTIONS.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  accent="cyan"
                  selected={sleepTimerSec === option.value}
                  onPress={() => setSleepTimer(option.value)}
                />
              ))}
            </View>

            <Pressable
              onPress={openPronunciation}
              accessibilityRole="button"
              accessibilityLabel="Open pronunciation rules"
              className="mb-2 mt-1 flex-row items-center rounded-2xl bg-white/5 p-3 active:opacity-75"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Feather name="mic" size={16} color="#FDE68A" />
              </View>
              <View className="ml-3 flex-1 pr-2">
                <Text className="text-sm font-black text-white">Pronunciation rules</Text>
                <Text className="mt-0.5 text-xs text-white/60">
                  {pronunciationCounts.total === 0
                    ? "None yet — fix awkward TTS pronunciations."
                    : `${pronunciationCounts.enabled} active · ${pronunciationCounts.total} total`}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="rgba(248, 250, 252, 0.5)" />
            </Pressable>

            <ToggleRow
              label="Auto-start on chapter open"
              subtitle="Begin reading aloud as soon as a chapter loads."
              value={ttsDefaults.autoStartOnOpen}
              onChange={(v) => void updateTtsDefault({ autoStartOnOpen: v })}
            />
            <ToggleRow
              label="Auto-play next chapter"
              subtitle="Continue reading when the current chapter ends."
              value={autoPlayNext}
              onChange={(v) => {
                setAutoPlayNext(v);
                void updateTtsDefault({ autoPlayNext: v });
              }}
            />

            <Pressable
              onPress={() => setShowCleaning((open) => !open)}
              className="mb-2 mt-3 flex-row items-center justify-between rounded-2xl bg-white/5 p-3 active:opacity-75"
              accessibilityRole="button"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-black text-white">Text cleaning</Text>
                <Text className="mt-0.5 text-xs text-white/60">
                  Strip noise from the chapter before sending to TTS.
                </Text>
              </View>
              <Feather
                name={showCleaning ? "chevron-up" : "chevron-down"}
                size={18}
                color="#FDE68A"
              />
            </Pressable>

            {showCleaning ? (
              <View className="mb-8">
                {CLEANING_ROWS.map((row) => (
                  <ToggleRow
                    key={row.key}
                    label={row.label}
                    subtitle={row.subtitle}
                    value={cleaning[row.key]}
                    onChange={(v) => void updateCleaning(row.key, v)}
                  />
                ))}
              </View>
            ) : (
              <View className="mb-8" />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
