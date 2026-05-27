import { Feather } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";
import { useAppPalette } from "@/theme/useAppPalette";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit, onClear }: SearchBarProps) {
  const palette = useAppPalette();
  return (
    <View className="flex-row items-center rounded-xl border border-app-border bg-app-surface px-3 py-2.5">
      <Feather name="search" size={18} color={palette.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder="Search novels, authors, tags…"
        placeholderTextColor={palette.textMuted}
        className="ml-2.5 flex-1 text-[15px] text-app-text"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length ? (
        <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button">
          <Feather name="x" size={18} color={palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
