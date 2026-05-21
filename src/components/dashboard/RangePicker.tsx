import { Pressable, Text, View } from "react-native";
import type { Range } from "@/services/analytics";

interface RangePickerProps {
  value: Range;
  onChange: (range: Range) => void;
}

const OPTIONS: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "all", label: "All" },
];

export function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <View className="flex-row rounded-full bg-slate-200 p-1 dark:bg-slate-800">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`flex-1 items-center rounded-full px-3 py-2 ${
              selected ? "bg-white dark:bg-slate-950" : ""
            } active:opacity-75`}
          >
            <Text
              className={`text-xs font-black ${
                selected
                  ? "text-slate-950 dark:text-slate-50"
                  : "text-slate-500 dark:text-slate-400"
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
