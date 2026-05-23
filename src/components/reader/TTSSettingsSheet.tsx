import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import type { Voice } from "expo-speech";
import { useAnimatedSheet } from "@/hooks/useAnimatedSheet";
import { pronunciationRepo } from "@/db/repositories/pronunciationRepo";
import type { ChapterMeta } from "@/data/types";
import { intent } from "@/services/intent";
import { tts } from "@/services/tts";
import { usePlaylistStore } from "@/stores/playlistStore";
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
  novelId?: string;
  chapterId?: string;
  nextChapter?: ChapterMeta | null;
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

function ActionRow({
  icon,
  label,
  subtitle,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  subtitle?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      className={`mb-2 flex-row items-center rounded-2xl bg-white/5 p-3 ${
        disabled ? "opacity-50" : "active:opacity-75"
      }`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Feather name={icon} size={16} color="#FDE68A" />
      </View>
      <View className="ml-3 flex-1 pr-2">
        <Text className="text-sm font-black text-white">{label}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-white/60">{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="external-link" size={16} color="rgba(248, 250, 252, 0.5)" />
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

export function TTSSettingsSheet({
  visible,
  onClose,
  novelId,
  chapterId,
  nextChapter,
}: TTSSettingsSheetProps) {
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
  const [showDevice, setShowDevice] = useState(false);
  const [pronunciationCounts, setPronunciationCounts] = useState({ total: 0, enabled: 0 });
  const queueLength = usePlaylistStore((s) => s.queue.length);
  const enqueue = usePlaylistStore((s) => s.enqueue);
  const clearQueue = usePlaylistStore((s) => s.clear);
  const queueHas = usePlaylistStore((s) => s.has);

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

  const currentInQueue =
    novelId && chapterId ? queueHas(novelId, chapterId) : false;

  const addCurrentToQueue = () => {
    if (!novelId || !chapterId) return;
    if (currentInQueue) {
      Alert.alert("Already queued", "This chapter is already in the listening queue.");
      return;
    }
    enqueue({ novelId, chapterId });
  };

  const addNextToQueue = () => {
    if (!nextChapter) return;
    enqueue({ novelId: nextChapter.novelId, chapterId: nextChapter.chapterId });
  };

  const handleClearQueue = () => {
    if (!queueLength) return;
    Alert.alert("Clear listening queue?", `${queueLength} chapter(s) will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearQueue() },
    ]);
  };

  const runIntent = (
    action: () => Promise<boolean>,
    failureMessage: string,
    iosMessage = "Available on Android only."
  ) => {
    if (!intent.isAndroid) {
      Alert.alert("Not available", iosMessage);
      return;
    }
    void action().then((ok) => {
      if (!ok) Alert.alert("Couldn't open", failureMessage);
    });
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
      backgroundPlayback: boolean;
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
              {filteredVoices.map((voice) => {
                const enhanced = (voice.quality ?? "").toLowerCase().includes("enhanced");
                const label = enhanced ? `${voice.name} · HQ` : voice.name;
                return (
                  <Chip
                    key={voice.identifier}
                    label={label}
                    selected={voiceId === voice.identifier}
                    onPress={() => setVoice(voice.identifier)}
                  />
                );
              })}
              {filteredVoices.length === 0 && !voiceId ? (
                <Text className="m-2 text-xs text-white/40">
                  No additional voices match {language}.
                </Text>
              ) : null}
              <Text className="m-2 text-[10px] text-white/40">
                Voices marked HQ are higher quality and may require Wi-Fi the first time.
              </Text>
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
              <View className="mb-3">
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
            ) : null}

            <Text className="mb-2 mt-3 text-xs font-black uppercase text-white/60">
              Listening queue
            </Text>
            <View className="mb-2 rounded-2xl bg-white/5 p-3">
              <Text className="text-sm font-black text-white">
                {queueLength} chapter{queueLength === 1 ? "" : "s"} queued
              </Text>
              <Text className="mt-0.5 text-xs text-white/60">
                Plays after the current chapter ends. In-memory only; clears on app restart.
              </Text>
              <View className="mt-3 flex-row flex-wrap">
                <Pressable
                  onPress={addCurrentToQueue}
                  disabled={!novelId || !chapterId || currentInQueue}
                  className={`mr-2 mt-2 rounded-full px-3 py-2 ${
                    !novelId || !chapterId || currentInQueue
                      ? "bg-white/5"
                      : "bg-yellow-300 active:opacity-75"
                  }`}
                  accessibilityRole="button"
                >
                  <Text
                    className={`text-xs font-black ${
                      !novelId || !chapterId || currentInQueue ? "text-white/40" : "text-slate-950"
                    }`}
                  >
                    {currentInQueue ? "Already queued" : "Add current chapter"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={addNextToQueue}
                  disabled={!nextChapter}
                  className={`mr-2 mt-2 rounded-full px-3 py-2 ${
                    !nextChapter ? "bg-white/5" : "bg-white/10 active:opacity-75"
                  }`}
                  accessibilityRole="button"
                >
                  <Text
                    className={`text-xs font-black ${
                      !nextChapter ? "text-white/40" : "text-white"
                    }`}
                  >
                    Add next chapter
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleClearQueue}
                  disabled={!queueLength}
                  className={`mr-2 mt-2 rounded-full px-3 py-2 ${
                    !queueLength ? "bg-white/5" : "bg-pink-500/25 active:opacity-75"
                  }`}
                  accessibilityRole="button"
                >
                  <Text
                    className={`text-xs font-black ${
                      !queueLength ? "text-white/40" : "text-pink-200"
                    }`}
                  >
                    Clear queue
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => setShowDevice((open) => !open)}
              className="mb-2 mt-3 flex-row items-center justify-between rounded-2xl bg-white/5 p-3 active:opacity-75"
              accessibilityRole="button"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-black text-white">Device & engine</Text>
                <Text className="mt-0.5 text-xs text-white/60">
                  Background playback, Android intents, Bluetooth note.
                </Text>
              </View>
              <Feather
                name={showDevice ? "chevron-up" : "chevron-down"}
                size={18}
                color="#FDE68A"
              />
            </Pressable>

            {showDevice ? (
              <View className="mb-8">
                <ToggleRow
                  label="Background playback"
                  subtitle={
                    intent.isIos
                      ? "Stored preference. iOS needs a prebuild with UIBackgroundModes: audio to actually keep playing."
                      : "Stored preference. Android needs a foreground-service module (not in Expo Go) to keep playing when locked."
                  }
                  value={ttsDefaults.backgroundPlayback}
                  onChange={(v) => void updateTtsDefault({ backgroundPlayback: v })}
                />

                <ActionRow
                  icon="settings"
                  label="Open TTS engine settings"
                  subtitle="Android: switch engine, change defaults."
                  disabled={!intent.isAndroid}
                  onPress={() =>
                    runIntent(intent.openTtsSettings, "Could not open TTS engine settings.")
                  }
                />
                <ActionRow
                  icon="download-cloud"
                  label="Download more voices"
                  subtitle="Android: install offline voice data for the active engine."
                  disabled={!intent.isAndroid}
                  onPress={() =>
                    runIntent(
                      intent.openVoiceDataSettings,
                      "Could not open voice data installer."
                    )
                  }
                />
                <ActionRow
                  icon="refresh-cw"
                  label="Update Google TTS engine"
                  subtitle="Android: deep-link to the Play Store listing."
                  disabled={!intent.isAndroid}
                  onPress={() =>
                    runIntent(
                      intent.openGoogleTtsListing,
                      "Could not open the Play Store listing."
                    )
                  }
                />
                <ActionRow
                  icon="battery-charging"
                  label="Disable battery optimization"
                  subtitle="Android: stops the OS from killing long playback sessions."
                  disabled={!intent.isAndroid}
                  onPress={() =>
                    runIntent(
                      intent.openBatteryOptimization,
                      "Could not open battery optimization settings."
                    )
                  }
                />

                <View className="mt-2 rounded-2xl bg-white/5 p-3">
                  <Text className="text-sm font-black text-white">
                    Pause / resume on Bluetooth disconnect
                  </Text>
                  <Text className="mt-0.5 text-xs text-white/60">
                    Requires a native Bluetooth-state module not available in Expo Go. Enable
                    after switching to a prebuild.
                  </Text>
                </View>
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
