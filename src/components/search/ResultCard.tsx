import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Novel } from "@/data/types";
import { CoverPlaceholder } from "@/components/shared/CoverPlaceholder";
import { Tag } from "@/components/shared/Tag";

interface ResultCardProps {
  novel: Novel;
  onPress: () => void;
}

export function ResultCard({ novel, onPress }: ResultCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(220)}>
      <Pressable
        onPress={onPress}
        className="flex-row border-b border-app-border px-5 py-3 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={`Open ${novel.title}`}
        style={{ gap: 12 }}
      >
        <CoverPlaceholder
          title={novel.title}
          coverHint={novel.coverHint}
          width={56}
          height={80}
          radius={6}
        />
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-semibold leading-5 text-app-text" numberOfLines={2}>
            {novel.title}
          </Text>
          <Text className="mt-0.5 text-xs text-app-text-muted" numberOfLines={1}>
            {novel.author ?? "Unknown author"}
          </Text>
          {novel.source || novel.language ? (
            <Text className="mt-1 text-[11px] text-app-text-muted" numberOfLines={1}>
              {[novel.source, novel.language].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          <View className="mt-1 flex-row flex-wrap">
            {novel.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
