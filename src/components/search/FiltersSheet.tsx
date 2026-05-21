import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

interface FiltersSheetProps {
  visible: boolean;
  genres: string[];
  languages: string[];
  sources: string[];
  selected: {
    genre?: string;
    language?: string;
    source?: string;
  };
  onSelect: (next: { genre?: string; language?: string; source?: string }) => void;
  onClose: () => void;
}

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 mt-2 rounded-full border px-3 py-2 ${
        selected
          ? "border-slate-950 bg-slate-950 dark:border-slate-50 dark:bg-slate-50"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          selected ? "text-white dark:text-slate-950" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FiltersSheet({
  visible,
  genres,
  languages,
  sources,
  selected,
  onSelect,
  onClose,
}: FiltersSheetProps) {
  const set = (key: "genre" | "language" | "source", value?: string) => {
    onSelect({ ...selected, [key]: selected[key] === value ? undefined : value });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/35">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="max-h-[78%] rounded-t-3xl bg-slate-50 p-5 dark:bg-slate-950">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-950 dark:text-slate-50">Filters</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color="#64748B" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mt-2 text-xs font-bold uppercase text-slate-400">Genre</Text>
            <View className="flex-row flex-wrap">
              <Option label="All" selected={!selected.genre} onPress={() => set("genre")} />
              {genres.map((genre) => (
                <Option
                  key={genre}
                  label={genre}
                  selected={selected.genre === genre}
                  onPress={() => set("genre", genre)}
                />
              ))}
            </View>

            <Text className="mt-5 text-xs font-bold uppercase text-slate-400">Language</Text>
            <View className="flex-row flex-wrap">
              <Option label="All" selected={!selected.language} onPress={() => set("language")} />
              {languages.map((language) => (
                <Option
                  key={language}
                  label={language}
                  selected={selected.language === language}
                  onPress={() => set("language", language)}
                />
              ))}
            </View>

            <Text className="mt-5 text-xs font-bold uppercase text-slate-400">Source</Text>
            <View className="flex-row flex-wrap pb-4">
              <Option label="All" selected={!selected.source} onPress={() => set("source")} />
              {sources.map((source) => (
                <Option
                  key={source}
                  label={source}
                  selected={selected.source === source}
                  onPress={() => set("source", source)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
