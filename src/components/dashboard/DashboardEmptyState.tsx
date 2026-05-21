import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export function DashboardEmptyState() {
  const router = useRouter();
  return (
    <View className="mt-6 items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950">
        <Feather name="bar-chart-2" size={22} color="#6366F1" />
      </View>
      <Text className="mt-4 text-base font-black text-slate-950 dark:text-slate-50">
        Use the app a bit and come back
      </Text>
      <Text className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        Your reading metrics appear here once you have searched, opened a novel, or finished a
        chapter.
      </Text>
      <Pressable
        onPress={() => router.push("/search")}
        accessibilityRole="button"
        className="mt-5 rounded-full bg-indigo-500 px-5 py-2 active:opacity-80"
      >
        <Text className="text-xs font-black uppercase text-white">Find a novel</Text>
      </Pressable>
    </View>
  );
}
