import { Pressable, Text, View } from "react-native";
import type { Range } from "@/services/analytics";

interface RangePickerProps {
  value: Range;
  onChange: (range: Range) => void;
}

const OPTIONS: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" },
];

export function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`rounded-full px-4 py-2 active:opacity-75 ${
              selected ? "bg-app-accent" : "bg-app-surface-2"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selected ? "text-app-on-accent" : "text-app-text-dim"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
