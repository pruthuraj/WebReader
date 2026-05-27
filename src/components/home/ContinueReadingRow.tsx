import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SectionHeader } from "@/components/ui/headers";
import { CoverPlaceholder } from "@/components/shared/CoverPlaceholder";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ContinueReadingItem } from "@/hooks/useHomeRows";

interface ContinueReadingRowProps {
  data: ContinueReadingItem[];
}

export function ContinueReadingRow({ data }: ContinueReadingRowProps) {
  const router = useRouter();
  const item = data[0];

  return (
    <View>
      <SectionHeader title="Continue Reading" />
      <View className="px-5">
        {item ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/reader/[novelId]/[chapterId]",
                params: { novelId: item.progress.novelId, chapterId: item.progress.chapterId },
              })
            }
            className="rounded-2xl border border-app-border bg-app-surface p-3.5 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel={`Continue reading ${item.novel.title}`}
          >
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <CoverPlaceholder
                title={item.novel.title}
                coverHint={item.novel.coverHint}
                width={56}
                height={80}
                radius={6}
              />
              <View className="min-w-0 flex-1">
                <Text className="text-[17px] font-semibold leading-6 text-app-text" numberOfLines={2}>
                  {item.novel.title}
                </Text>
                <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={1}>
                  {item.novel.author ?? "Unknown author"}
                </Text>
                <Text className="mt-1.5 text-[11px] text-app-text-muted">
                  {Math.round(item.progress.percent * 100)}% complete
                </Text>
              </View>
            </View>
            <View className="mt-3 flex-row items-center" style={{ gap: 10 }}>
              <View className="h-1 flex-1 overflow-hidden rounded-full bg-app-surface-3">
                <View
                  className="h-full rounded-full bg-app-accent"
                  style={{ width: `${Math.round(item.progress.percent * 100)}%` }}
                />
              </View>
              <View className="rounded-full bg-app-accent px-4 py-2">
                <Text className="text-[13px] font-bold text-app-on-accent">Continue</Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <EmptyState
            icon="book-open"
            title="Nothing in progress yet"
            subtitle="Open a chapter and your place will appear here."
          />
        )}
      </View>
    </View>
  );
}
