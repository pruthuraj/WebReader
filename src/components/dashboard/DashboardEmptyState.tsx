import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppPalette } from "@/theme/useAppPalette";

export function DashboardEmptyState() {
  const router = useRouter();
  const palette = useAppPalette();
  return (
    <View className="mt-6 items-center rounded-2xl border border-app-border bg-app-surface p-8">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-app-accent-dim">
        <Feather name="bar-chart-2" size={22} color={palette.accent} />
      </View>
      <Text className="mt-4 text-base font-bold text-app-text">Use the app a bit and come back</Text>
      <Text className="mt-2 text-center text-xs text-app-text-muted">
        Your reading metrics appear here once you have searched, opened a novel, or finished a
        chapter.
      </Text>
      <Pressable
        onPress={() => router.push("/search")}
        accessibilityRole="button"
        className="mt-5 rounded-full bg-app-accent px-5 py-2 active:opacity-80"
      >
        <Text className="text-xs font-bold uppercase text-app-on-accent">Find a novel</Text>
      </Pressable>
    </View>
  );
}
