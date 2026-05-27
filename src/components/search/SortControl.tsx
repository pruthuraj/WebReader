import { Pressable, Text, View } from "react-native";
import { useAppPalette } from "@/theme/useAppPalette";
import type { SortKey } from "@/services/catalogue";

const options: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "popularity", label: "Popular" },
  { key: "updated", label: "Updated" },
  { key: "alpha", label: "A–Z" },
];

interface SortControlProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  const palette = useAppPalette();
  return (
    <View className="flex-row" style={{ gap: 18 }}>
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            style={{
              paddingVertical: 4,
              borderBottomWidth: 2,
              borderBottomColor: selected ? palette.accent : "transparent",
            }}
          >
            <Text
              className={`text-[13.5px] ${
                selected ? "font-bold text-app-accent" : "font-medium text-app-text-muted"
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
