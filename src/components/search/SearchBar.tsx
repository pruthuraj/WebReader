import { Feather } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit, onClear }: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <Feather name="search" size={19} color="#64748B" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder="Search titles, authors, genres"
        placeholderTextColor="#94A3B8"
        className="ml-3 flex-1 text-base text-slate-950 dark:text-slate-50"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length ? (
        <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button">
          <Feather name="x" size={18} color="#64748B" />
        </Pressable>
      ) : null}
    </View>
  );
}

