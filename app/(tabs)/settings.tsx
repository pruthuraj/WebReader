import { useRouter } from "expo-router";
import { Alert, ScrollView, Text } from "react-native";
import { DeveloperPanel } from "@/components/settings/DeveloperPanel";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { downloadQueueRepo } from "@/db/repositories/downloadQueueRepo";
import { useDownloadStore } from "@/stores/downloadStore";
import type { FontStyle, ReaderAppearance, TextAlignment } from "@/stores/readerStore";
import { useReaderStore } from "@/stores/readerStore";
import { useSettingsStore, type TtsDefaults } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";
import type { ReaderThemeName } from "@/theme/readerThemes";
import { readerFontSizes, readerLineHeights } from "@/theme/tokens";

function nextNumber(values: readonly number[], current: number, delta: number) {
  const index = Math.max(0, values.indexOf(current));
  const next = Math.max(0, Math.min(values.length - 1, index + delta));
  return values[next];
}

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const updateSettings = useSettingsStore((s) => s.update);
  const resetSettings = useSettingsStore((s) => s.reset);
  const setAppearance = useReaderStore((s) => s.setAppearance);
  const setSpeed = useTtsStore((s) => s.setSpeed);
  const setPitch = useTtsStore((s) => s.setPitch);
  const setLanguage = useTtsStore((s) => s.setLanguage);
  const setAutoPlayNext = useTtsStore((s) => s.setAutoPlayNext);
  const refreshDownloads = useDownloadStore((s) => s.refresh);

  const updateReader = async (partial: Partial<ReaderAppearance>) => {
    const readerDefaults = { ...settings.readerDefaults, ...partial };
    await updateSettings({ readerDefaults });
    setAppearance(partial);
  };

  const updateTts = async (partial: Partial<TtsDefaults>) => {
    const ttsDefaults = { ...settings.ttsDefaults, ...partial };
    await updateSettings({ ttsDefaults });
    if (partial.speed !== undefined) setSpeed(partial.speed);
    if (partial.pitch !== undefined) setPitch(partial.pitch);
    if (partial.language !== undefined) setLanguage(partial.language);
    if (partial.autoPlayNext !== undefined) setAutoPlayNext(partial.autoPlayNext);
  };

  const clearPendingQueue = async () => {
    await downloadQueueRepo.clearStatuses(["queued", "failed"]);
    await refreshDownloads();
    Alert.alert("Queue cleared", "Queued and failed download items were removed.");
  };

  const resetAllSettings = async () => {
    await resetSettings();
    const next = useSettingsStore.getState().settings;
    setAppearance(next.readerDefaults);
    setSpeed(next.ttsDefaults.speed);
    setPitch(next.ttsDefaults.pitch);
    setLanguage(next.ttsDefaults.language);
    setAutoPlayNext(next.ttsDefaults.autoPlayNext);
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text className="text-3xl font-black text-slate-950 dark:text-slate-50">Settings</Text>
      <Text className="mb-6 mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {hydrated ? "Reader, TTS, and download defaults are persisted locally." : "Hydrating..."}
      </Text>

      <SettingsSection title="Reader defaults">
        <SettingsRow
          type="stepper"
          label="Font size"
          value={`${settings.readerDefaults.fontSize} pt`}
          onMinus={() =>
            updateReader({
              fontSize: nextNumber(readerFontSizes, settings.readerDefaults.fontSize, -1),
            })
          }
          onPlus={() =>
            updateReader({
              fontSize: nextNumber(readerFontSizes, settings.readerDefaults.fontSize, 1),
            })
          }
        />
        <SettingsRow
          type="stepper"
          label="Line height"
          value={`${Math.round(settings.readerDefaults.lineHeight * 100)}%`}
          onMinus={() =>
            updateReader({
              lineHeight: nextNumber(readerLineHeights, settings.readerDefaults.lineHeight, -1),
            })
          }
          onPlus={() =>
            updateReader({
              lineHeight: nextNumber(readerLineHeights, settings.readerDefaults.lineHeight, 1),
            })
          }
        />
        <SettingsRow
          type="segments"
          label="Theme"
          value={settings.readerDefaults.theme}
          options={["light", "sepia", "dark"]}
          onChange={(theme) => updateReader({ theme: theme as ReaderThemeName })}
        />
        <SettingsRow
          type="segments"
          label="Font family"
          value={settings.readerDefaults.fontStyle}
          options={["system", "serif", "sans", "mono"]}
          onChange={(fontStyle) => updateReader({ fontStyle: fontStyle as FontStyle })}
        />
        <SettingsRow
          type="segments"
          label="Alignment"
          value={settings.readerDefaults.alignment}
          options={["left", "justify"]}
          onChange={(alignment) => updateReader({ alignment: alignment as TextAlignment })}
        />
        <SettingsRow
          type="stepper"
          label="Margin"
          value={`${settings.readerDefaults.margin}px`}
          onMinus={() =>
            updateReader({ margin: Math.max(12, settings.readerDefaults.margin - 4) })
          }
          onPlus={() =>
            updateReader({ margin: Math.min(40, settings.readerDefaults.margin + 4) })
          }
        />
        <SettingsRow
          type="switch"
          label="Keep screen awake"
          value={settings.readerDefaults.keepAwake}
          onChange={(keepAwake) => updateReader({ keepAwake })}
        />
      </SettingsSection>

      <SettingsSection title="TTS defaults">
        <SettingsRow
          type="stepper"
          label="Speed"
          value={`${settings.ttsDefaults.speed.toFixed(1)}x`}
          onMinus={() => updateTts({ speed: Math.max(0.5, settings.ttsDefaults.speed - 0.1) })}
          onPlus={() => updateTts({ speed: Math.min(2, settings.ttsDefaults.speed + 0.1) })}
        />
        <SettingsRow
          type="stepper"
          label="Pitch"
          value={settings.ttsDefaults.pitch.toFixed(1)}
          onMinus={() => updateTts({ pitch: Math.max(0.5, settings.ttsDefaults.pitch - 0.1) })}
          onPlus={() => updateTts({ pitch: Math.min(2, settings.ttsDefaults.pitch + 0.1) })}
        />
        <SettingsRow
          type="segments"
          label="Language"
          value={settings.ttsDefaults.language}
          options={["en-US", "en-GB", "en-AU", "hi-IN"]}
          onChange={(language) => updateTts({ language })}
        />
        <SettingsRow
          type="switch"
          label="Auto-play next chapter"
          value={settings.ttsDefaults.autoPlayNext}
          onChange={(autoPlayNext) => updateTts({ autoPlayNext })}
        />
      </SettingsSection>

      <SettingsSection title="Downloads">
        <SettingsRow
          type="switch"
          label="Wi-Fi only"
          subtitle="When enabled, queued chapters wait until Wi-Fi is available."
          value={settings.wifiOnlyDownloads}
          onChange={(wifiOnlyDownloads) => updateSettings({ wifiOnlyDownloads })}
        />
        <SettingsRow
          type="switch"
          label="Auto-retry failed"
          value={settings.autoRetryFailed}
          onChange={(autoRetryFailed) => updateSettings({ autoRetryFailed })}
        />
        <SettingsRow
          type="tap"
          label="Clear queued and failed"
          subtitle="Downloaded chapters stay on device."
          onPress={clearPendingQueue}
        />
      </SettingsSection>

      <SettingsSection title="Sources">
        <SettingsRow
          type="tap"
          label="Manage sources"
          subtitle="Enable live sources to search and read beyond the bundled catalogue."
          onPress={() => router.push("/sources" as never)}
        />
      </SettingsSection>

      <SettingsSection title="Reading insights">
        <SettingsRow
          type="stepper"
          label="Chapter-read threshold"
          subtitle="Percent scrolled before a chapter counts toward dashboard stats."
          value={`${Math.round(settings.chapterReadThreshold * 100)}%`}
          onMinus={() =>
            updateSettings({
              chapterReadThreshold: Math.max(
                0.5,
                Math.round((settings.chapterReadThreshold - 0.05) * 100) / 100
              ),
            })
          }
          onPlus={() =>
            updateSettings({
              chapterReadThreshold: Math.min(
                1,
                Math.round((settings.chapterReadThreshold + 0.05) * 100) / 100
              ),
            })
          }
        />
        <SettingsRow
          type="tap"
          label="Open dashboard"
          subtitle="On-device reading metrics. No network calls."
          onPress={() => router.push("/dashboard")}
        />
      </SettingsSection>

      <SettingsSection title="Reset">
        <SettingsRow
          type="tap"
          label="Reset app settings"
          subtitle="Restores reader and TTS defaults."
          danger
          onPress={resetAllSettings}
        />
      </SettingsSection>

      {settings.devMode ? <DeveloperPanel /> : null}
    </ScrollView>
  );
}

