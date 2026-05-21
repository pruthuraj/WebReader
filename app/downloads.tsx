import { ScrollView, Text, View } from "react-native";

export default function DownloadsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16 }}
    >
      <Text className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
        Downloads
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400">
        Queued, downloading, downloaded, and failed chapters live here.
      </Text>
      <View className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          Phase C wires the downloader service and DownloadRow groups.
        </Text>
      </View>
    </ScrollView>
  );
}
