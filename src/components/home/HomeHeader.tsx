import { Text, View } from "react-native";

export function HomeHeader() {
  return (
    <View className="mb-5">
      <Text className="text-4xl font-black text-slate-950 dark:text-slate-50">WebReader</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Local-first web novels with progress that follows you back into the chapter.
      </Text>
    </View>
  );
}

