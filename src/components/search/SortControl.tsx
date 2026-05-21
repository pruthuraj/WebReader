import { Pressable, Text, View } from "react-native";
import type { SortKey } from "@/services/catalogue";

const options: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevant" },
  { key: "popularity", label: "Popular" },
  { key: "updated", label: "Updated" },
  { key: "alpha", label: "A-Z" },
];

interface SortControlProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <View className="flex-row rounded-full bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`rounded-full px-3 py-2 ${selected ? "bg-white dark:bg-slate-950" : ""}`}
            accessibilityRole="button"
          >
            <Text
              className={`text-xs font-bold ${
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

