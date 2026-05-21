import { ScrollView, Text, View } from "react-native";
import { useSettingsStore } from "@/stores/settingsStore";

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const hydrated = useSettingsStore((s) => s.hydrated);

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16 }}
    >
      <Text className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Settings</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400">
        {hydrated ? "Persisted to kv_settings" : "Hydrating…"}
      </Text>
      <View className="mt-6 rounded-xl bg-white p-4 dark:bg-slate-800">
        <Text className="mb-1 text-xs uppercase tracking-wider text-slate-400">Reader defaults</Text>
        <Text className="text-sm text-slate-700 dark:text-slate-200">
          font {settings.readerDefaults.fontSize}pt · line {settings.readerDefaults.lineHeight} · {settings.readerDefaults.theme}
        </Text>
      </View>
      <View className="mt-3 rounded-xl bg-white p-4 dark:bg-slate-800">
        <Text className="mb-1 text-xs uppercase tracking-wider text-slate-400">TTS defaults</Text>
        <Text className="text-sm text-slate-700 dark:text-slate-200">
          speed {settings.ttsDefaults.speed}× · pitch {settings.ttsDefaults.pitch} · lang {settings.ttsDefaults.language}
        </Text>
      </View>
      <View className="mt-3 rounded-xl bg-white p-4 dark:bg-slate-800">
        <Text className="mb-1 text-xs uppercase tracking-wider text-slate-400">Downloads</Text>
        <Text className="text-sm text-slate-700 dark:text-slate-200">
          Wi-Fi only: {settings.wifiOnlyDownloads ? "on" : "off"} · auto-retry: {settings.autoRetryFailed ? "on" : "off"}
        </Text>
      </View>
      <Text className="mt-6 text-xs text-slate-400">
        Phase C adds editable sliders, theme selector, dev tools.
      </Text>
    </ScrollView>
  );
}
