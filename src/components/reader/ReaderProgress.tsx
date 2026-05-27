import { Text, View } from "react-native";
import { percentLabel } from "@/utils/format";

interface ReaderProgressProps {
  percent: number;
}

export function ReaderProgress({ percent }: ReaderProgressProps) {
  const clamped = Math.max(0, Math.min(1, percent));

  return (
    <View className="flex-row items-center px-4 pb-3" style={{ gap: 10 }}>
      <View className="h-[2px] flex-1 overflow-hidden rounded-full bg-reader-muted/20">
        <View className="h-[2px] bg-reader-accent" style={{ width: `${clamped * 100}%` }} />
      </View>
      <Text className="text-[11px] font-medium text-reader-muted">{percentLabel(clamped)}</Text>
    </View>
  );
}
