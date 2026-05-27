import { Text, View } from "react-native";
import { chapterOfText } from "@/utils/format";
import { readerFontFamily } from "@/theme/readerFonts";
import type { FontStyle } from "@/stores/readerStore";

interface ChapterHeaderProps {
  novelTitle: string;
  chapterTitle: string;
  idx: number;
  total: number;
  fontStyle: FontStyle;
}

export function ChapterHeader({
  novelTitle,
  chapterTitle,
  idx,
  total,
  fontStyle,
}: ChapterHeaderProps) {
  return (
    <View className="mb-8 items-center border-b border-reader-muted/20 pb-6">
      <Text className="text-xs font-bold uppercase text-reader-muted" numberOfLines={1}>
        {novelTitle}
      </Text>
      <Text
        className="mt-2 text-center text-3xl leading-10 text-reader-fg"
        style={{ fontFamily: readerFontFamily(fontStyle, "bold"), fontWeight: "700" }}
      >
        {chapterTitle}
      </Text>
      <Text className="mt-2 text-sm text-reader-muted">{chapterOfText(idx, total)}</Text>
    </View>
  );
}
