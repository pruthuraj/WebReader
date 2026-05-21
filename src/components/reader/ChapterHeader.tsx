import { Text, View } from "react-native";
import { chapterOfText } from "@/utils/format";

interface ChapterHeaderProps {
  novelTitle: string;
  chapterTitle: string;
  idx: number;
  total: number;
}

export function ChapterHeader({ novelTitle, chapterTitle, idx, total }: ChapterHeaderProps) {
  return (
    <View className="mb-8 border-b border-reader-muted/20 pb-5">
      <Text className="text-xs font-bold uppercase text-reader-muted" numberOfLines={1}>
        {novelTitle}
      </Text>
      <Text className="mt-2 text-3xl font-black leading-10 text-reader-fg">{chapterTitle}</Text>
      <Text className="mt-2 text-sm text-reader-muted">{chapterOfText(idx, total)}</Text>
    </View>
  );
}

