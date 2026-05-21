import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ReaderScreen() {
  const { novelId, chapterId } = useLocalSearchParams<{
    novelId: string;
    chapterId: string;
  }>();
  return (
    <ScrollView
      className="flex-1 bg-reader-bg"
      contentContainerStyle={{ padding: 24 }}
    >
      <Text className="mb-2 text-2xl font-bold text-reader-fg">Reader</Text>
      <Text className="text-sm text-reader-muted">
        novel: {novelId} · chapter: {chapterId}
      </Text>
      <View className="mt-6 rounded-xl border border-dashed border-reader-muted p-4">
        <Text className="text-sm text-reader-muted">
          Phase B will render ChapterHeader, ReaderContent, ReaderProgress, and ChapterNavigation.
          Phase C adds ReaderSettings and TTSSettings sheets.
        </Text>
      </View>
    </ScrollView>
  );
}
