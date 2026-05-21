import { Text, View } from "react-native";
import { percentLabel } from "@/utils/format";

interface ReaderProgressProps {
  percent: number;
}

export function ReaderProgress({ percent }: ReaderProgressProps) {
  const clamped = Math.max(0, Math.min(1, percent));

  return (
    <View className="absolute left-0 right-0 top-0 z-20 bg-reader-bg/90">
      <View className="h-[2px] bg-reader-muted/20">
        <View className="h-[2px] bg-reader-accent" style={{ width: `${clamped * 100}%` }} />
      </View>
      <View className="items-end px-4 py-1">
        <Text className="text-[10px] font-bold text-reader-muted">{percentLabel(clamped)}</Text>
      </View>
    </View>
  );
}

