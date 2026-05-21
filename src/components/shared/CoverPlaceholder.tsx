import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

const gradients: Record<string, readonly [string, string]> = {
  "gradient-indigo": ["#4338CA", "#111827"],
  "gradient-slate": ["#475569", "#020617"],
  "gradient-emerald": ["#047857", "#052E16"],
  "gradient-amber": ["#D97706", "#451A03"],
  "gradient-rose": ["#BE123C", "#3F0A17"],
};

function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

interface CoverPlaceholderProps {
  title: string;
  coverHint?: string | null;
  compact?: boolean;
}

export function CoverPlaceholder({ title, coverHint, compact }: CoverPlaceholderProps) {
  const colors = gradients[coverHint ?? ""] ?? ["#334155", "#0F172A"];
  const sizeClass = compact ? "h-24 w-20" : "h-40 w-28";

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className={`${sizeClass} overflow-hidden rounded-lg border border-white/20`}
    >
      <View className="flex-1 justify-between p-3">
        <Text className="text-[10px] font-semibold uppercase text-white/70">WebReader</Text>
        <Text className="text-3xl font-black text-white">{initials(title)}</Text>
      </View>
    </LinearGradient>
  );
}

