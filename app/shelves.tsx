import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLibraryStore } from "@/stores/libraryStore";

export default function ShelvesScreen() {
  const router = useRouter();
  const shelves = useLibraryStore((s) => s.shelves);
  const refresh = useLibraryStore((s) => s.refresh);
  const create = useLibraryStore((s) => s.create);
  const remove = useLibraryStore((s) => s.remove);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addShelf = async () => {
    const name = newName.trim();
    if (!name) return;
    await create(name);
    setNewName("");
  };

  const confirmDelete = (id: number, name: string) => {
    Alert.alert("Delete shelf", `Delete "${name}"? Novels stay in your library.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void remove(id) },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50 p-4 dark:bg-slate-950">
      <View className="mb-4 flex-row items-center">
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New shelf name"
          placeholderTextColor="#94A3B8"
          onSubmitEditing={() => void addShelf()}
          returnKeyType="done"
          className="mr-2 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <Pressable
          onPress={() => void addShelf()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-950 active:opacity-80 dark:bg-slate-50"
          accessibilityRole="button"
          accessibilityLabel="Create shelf"
        >
          <Feather name="plus" size={18} color="#F8FAFC" />
        </Pressable>
      </View>

      <FlatList
        data={shelves}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View className="mb-2 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Pressable
              className="flex-1 active:opacity-70"
              onPress={() => router.push(`/shelf/${item.id}` as never)}
            >
              <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                {item.name}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {item.count} {item.count === 1 ? "novel" : "novels"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(item.id, item.name)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
              className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:opacity-70 dark:bg-slate-800"
            >
              <Feather name="trash-2" size={16} color="#EF4444" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder"
            title="No shelves yet"
            subtitle="Create a shelf above, then add novels from any novel's page."
          />
        }
      />
    </View>
  );
}
