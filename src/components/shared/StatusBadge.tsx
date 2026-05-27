import { Text, View } from "react-native";
import { useAppPalette } from "@/theme/useAppPalette";

type StatusVariant =
  | "downloaded"
  | "available"
  | "in-progress"
  | "queued"
  | "downloading"
  | "failed";

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const palette = useAppPalette();
  const color: Record<StatusVariant, string> = {
    downloaded: palette.success,
    available: palette.textMuted,
    "in-progress": palette.accent,
    queued: palette.textMuted,
    downloading: palette.accent,
    failed: palette.danger,
  };
  const c = color[status];
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
      <Text style={{ color: c, fontSize: 11, fontWeight: "600" }}>{label ?? status}</Text>
    </View>
  );
}
