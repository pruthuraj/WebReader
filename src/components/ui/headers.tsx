import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppPalette } from "@/theme/useAppPalette";

/**
 * Large-title header for tab screens (ref `AppHeader`). Includes top safe-area
 * padding so tab routes can run with the navigator header hidden.
 */
export function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-2">
      <View className="flex-row items-start justify-between">
        <View className="min-w-0 flex-1">
          <Text className="text-[28px] font-black tracking-tight text-app-text">{title}</Text>
          {subtitle ? (
            <Text className="mt-1 text-[13px] leading-5 text-app-text-muted">{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/**
 * Stack-screen header (ref `ScreenHeader`): back chevron · centered title · right
 * slot. Includes top safe-area padding so the route can hide the navigator header.
 */
export function ScreenHeader({
  title,
  right,
  onBack,
}: {
  title?: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const palette = useAppPalette();
  const back = onBack ?? (() => router.back());
  return (
    <View
      style={{ paddingTop: insets.top + 4 }}
      className="flex-row items-center justify-between border-b border-app-border bg-app-bg px-2 pb-2.5"
    >
      <Pressable
        onPress={back}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="h-10 w-10 items-center justify-center active:opacity-70"
      >
        <Feather name="chevron-left" size={24} color={palette.text} />
      </Pressable>
      <Text className="text-base font-bold text-app-text" numberOfLines={1}>
        {title}
      </Text>
      <View className="min-h-10 min-w-10 flex-row items-center justify-end pr-1">{right}</View>
    </View>
  );
}

/** Section heading row used on home/dashboard/etc. (ref `SectionHeader`). */
export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-baseline justify-between px-5 pb-3 pt-5">
      <Text className="text-[17px] font-bold tracking-tight text-app-text">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text className="text-[13px] font-medium text-app-text-muted">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
