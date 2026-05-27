import { Pressable, Text } from "react-native";
import type { Novel } from "@/data/types";
import { CoverPlaceholder } from "./CoverPlaceholder";

interface NovelCardProps {
  novel: Novel;
  meta?: string;
  onPress: () => void;
  /** Rail item width; cover height derives at a 1.4 ratio (ref proportions). */
  width?: number;
}

export function NovelCard({ novel, meta, onPress, width = 96 }: NovelCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width }}
      className="mr-3.5 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`Open ${novel.title}`}
    >
      <CoverPlaceholder
        title={novel.title}
        coverHint={novel.coverHint}
        width={width}
        height={Math.round(width * 1.4)}
        radius={8}
      />
      <Text className="mt-2 text-xs font-semibold leading-4 text-app-text" numberOfLines={2}>
        {novel.title}
      </Text>
      {meta ? (
        <Text className="mt-0.5 text-[11px] text-app-text-muted" numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}
