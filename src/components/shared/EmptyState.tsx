import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useAppPalette } from "@/theme/useAppPalette";

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const palette = useAppPalette();
  return (
    <View className="items-center justify-center rounded-2xl border border-app-border bg-app-surface p-5">
      <Feather name={icon} size={22} color={palette.textMuted} />
      <Text className="mt-3 text-center text-sm font-semibold text-app-text">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-xs leading-5 text-app-text-muted">{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-4 rounded-full bg-app-accent px-4 py-2 active:opacity-80"
        >
          <Text className="text-xs font-bold text-app-on-accent">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
