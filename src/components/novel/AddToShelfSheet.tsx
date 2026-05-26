import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { shelfRepo } from "@/db/repositories/shelfRepo";
import { useLibraryStore } from "@/stores/libraryStore";

interface AddToShelfSheetProps {
  visible: boolean;
  novelId: string;
  onClose: () => void;
}

export function AddToShelfSheet({ visible, novelId, onClose }: AddToShelfSheetProps) {
  const shelves = useLibraryStore((s) => s.shelves);
  const refresh = useLibraryStore((s) => s.refresh);
  const createShelf = useLibraryStore((s) => s.create);
  const addNovel = useLibraryStore((s) => s.addNovel);
  const removeNovel = useLibraryStore((s) => s.removeNovel);

  const [memberIds, setMemberIds] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void refresh();
    void shelfRepo.shelfIdsForNovel(novelId).then((ids) => {
      if (!cancelled) setMemberIds(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [visible, novelId, refresh]);

  const toggle = async (shelfId: number) => {
    const isMember = memberIds.has(shelfId);
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (isMember) next.delete(shelfId);
      else next.add(shelfId);
      return next;
    });
    if (isMember) await removeNovel(shelfId, novelId);
    else await addNovel(shelfId, novelId);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const id = await createShelf(name);
    await addNovel(id, novelId);
    setMemberIds((prev) => new Set(prev).add(id));
    setNewName("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/35">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="max-h-[78%] rounded-t-3xl bg-slate-50 p-5 dark:bg-slate-950">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-950 dark:text-slate-50">
              Add to shelf
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color="#64748B" />
            </Pressable>
          </View>

          <View className="mb-4 flex-row items-center">
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New shelf name"
              placeholderTextColor="#94A3B8"
              onSubmitEditing={() => void create()}
              returnKeyType="done"
              className="mr-2 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <Pressable
              onPress={() => void create()}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-950 active:opacity-80 dark:bg-slate-50"
              accessibilityRole="button"
              accessibilityLabel="Create shelf"
            >
              <Feather name="plus" size={18} color="#F8FAFC" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {shelves.length === 0 ? (
              <Text className="py-4 text-center text-xs text-slate-400">
                No shelves yet. Create one above.
              </Text>
            ) : (
              shelves.map((shelf) => {
                const member = memberIds.has(shelf.id);
                return (
                  <Pressable
                    key={shelf.id}
                    onPress={() => void toggle(shelf.id)}
                    className="mb-2 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 active:opacity-70 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {shelf.name}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {shelf.count} {shelf.count === 1 ? "novel" : "novels"}
                      </Text>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border ${
                        member
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {member ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
