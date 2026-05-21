import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export function SearchEntry() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/search")}
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 active:opacity-80 dark:border-slate-800 dark:bg-slate-900"
      accessibilityRole="button"
      accessibilityLabel="Search novels"
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Feather name="search" size={20} color="#475569" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
            What do you want to read?
          </Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Search title, author, genre, or description
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#94A3B8" />
      </View>
    </Pressable>
  );
}

