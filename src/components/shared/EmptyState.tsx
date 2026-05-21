import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

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
  return (
    <View className="items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <Feather name={icon} size={22} color="#64748B" />
      <Text className="mt-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-4 rounded-full bg-slate-900 px-4 py-2 active:opacity-80 dark:bg-slate-100"
        >
          <Text className="text-xs font-semibold text-white dark:text-slate-900">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

