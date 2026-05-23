import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "@/components/shared/EmptyState";
import type { NewPronunciationRule, PronunciationRule } from "@/data/types";
import { pronunciationRepo } from "@/db/repositories/pronunciationRepo";
import { cleanSentence } from "@/services/tts";

const SAMPLE_PREVIEW =
  "Dr. Yan said i.e. the b.a.s.t.a.r.d sword had +5 enchantment and cost 100 + 50 gold.";

const LANGUAGE_OPTIONS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "en-US", value: "en-US" },
  { label: "en-GB", value: "en-GB" },
  { label: "en-AU", value: "en-AU" },
  { label: "hi-IN", value: "hi-IN" },
];

interface EditorState {
  open: boolean;
  rule: NewPronunciationRule | null;
}

const emptyRule = (): NewPronunciationRule => ({
  pattern: "",
  replacement: "",
  isRegex: false,
  language: null,
  caseSensitive: false,
  enabled: true,
  category: null,
});

export default function PronunciationScreen() {
  const [rules, setRules] = useState<PronunciationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ open: false, rule: null });

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = query.trim()
      ? await pronunciationRepo.search(query.trim())
      : await pronunciationRepo.listAll();
    setRules(rows);
    setLoading(false);
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const rule of rules) if (rule.category) set.add(rule.category);
    return Array.from(set).sort();
  }, [rules]);

  const visible = useMemo(
    () => (categoryFilter ? rules.filter((r) => r.category === categoryFilter) : rules),
    [categoryFilter, rules]
  );

  const openNew = () => setEditor({ open: true, rule: emptyRule() });
  const openEdit = (rule: PronunciationRule) =>
    setEditor({
      open: true,
      rule: {
        id: rule.id,
        pattern: rule.pattern,
        replacement: rule.replacement,
        isRegex: rule.isRegex,
        language: rule.language,
        caseSensitive: rule.caseSensitive,
        enabled: rule.enabled,
        category: rule.category,
      },
    });

  const closeEditor = () => setEditor({ open: false, rule: null });

  const saveEditor = async () => {
    if (!editor.rule) return;
    if (!editor.rule.pattern.trim()) {
      Alert.alert("Pattern required", "Enter the text or regex to match.");
      return;
    }
    try {
      await pronunciationRepo.upsert(editor.rule);
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
      return;
    }
    closeEditor();
    void refresh();
  };

  const deleteRule = async (rule: PronunciationRule) => {
    Alert.alert("Delete rule?", `Pattern "${rule.pattern}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await pronunciationRepo.remove(rule.id);
          void refresh();
        },
      },
    ]);
  };

  const toggleRule = async (rule: PronunciationRule) => {
    await pronunciationRepo.setEnabled(rule.id, !rule.enabled);
    void refresh();
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-black text-slate-950 dark:text-slate-50">
          Pronunciation rules
        </Text>
        <Text className="mb-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
          Override how TTS pronounces words, abbreviations, and symbols. Rules apply per chapter
          read.
        </Text>

        <View className="mb-3 flex-row items-center rounded-2xl bg-white p-2 dark:bg-slate-900">
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            placeholder="Search pattern or replacement"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            className="ml-2 flex-1 text-sm text-slate-900 dark:text-slate-50"
          />
        </View>

        {categories.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <FilterChip
              label="All"
              selected={!categoryFilter}
              onPress={() => setCategoryFilter(null)}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                selected={categoryFilter === cat}
                onPress={() => setCategoryFilter(cat)}
              />
            ))}
          </ScrollView>
        ) : null}

        {loading ? (
          <Text className="mt-6 text-center text-xs text-slate-400">Loading rules…</Text>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="edit-3"
            title="No rules yet"
            subtitle={
              query.trim()
                ? `Nothing matches "${query.trim()}".`
                : "Add a rule below to fix awkward pronunciations."
            }
          />
        ) : (
          <View className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
            {visible.map((rule, index) => (
              <PronunciationRow
                key={rule.id}
                rule={rule}
                isFirst={index === 0}
                onToggle={() => void toggleRule(rule)}
                onEdit={() => openEdit(rule)}
                onDelete={() => void deleteRule(rule)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add pronunciation rule"
        onPress={openNew}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-indigo-500 active:opacity-80"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>

      <RuleEditor
        editor={editor}
        onChange={(rule) => setEditor((prev) => ({ ...prev, rule }))}
        onClose={closeEditor}
        onSave={saveEditor}
      />
    </View>
  );
}

function FilterChip({
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
      className={`mr-2 rounded-full px-3 py-1.5 ${
        selected ? "bg-indigo-500 dark:bg-indigo-400" : "bg-slate-200 dark:bg-slate-800"
      } active:opacity-75`}
    >
      <Text
        className={`text-[11px] font-black uppercase ${
          selected ? "text-white" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface PronunciationRowProps {
  rule: PronunciationRule;
  isFirst: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PronunciationRow({ rule, isFirst, onToggle, onEdit, onDelete }: PronunciationRowProps) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 ${
        isFirst ? "" : "border-t border-slate-100 dark:border-slate-800"
      }`}
    >
      <Switch
        value={rule.enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#CBD5E1", true: "#6366F1" }}
        thumbColor={rule.enabled ? "#FFFFFF" : "#F8FAFC"}
      />
      <Pressable className="ml-3 flex-1 pr-2" onPress={onEdit}>
        <View className="flex-row items-center">
          <Text
            className="flex-1 text-sm font-black text-slate-950 dark:text-slate-50"
            numberOfLines={1}
          >
            {rule.pattern}
          </Text>
          {rule.isRegex ? (
            <Text className="ml-2 rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-900">
              REGEX
            </Text>
          ) : null}
          {rule.caseSensitive ? (
            <Text className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              Aa
            </Text>
          ) : null}
        </View>
        <Text
          className="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
          numberOfLines={1}
        >
          → {rule.replacement || "(empty)"}
        </Text>
        <Text className="mt-0.5 text-[10px] uppercase text-slate-400">
          {rule.language ?? "all langs"} · {rule.category ?? "uncategorized"}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete rule"
        className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
      >
        <Feather name="trash-2" size={16} color="#F87171" />
      </Pressable>
    </View>
  );
}

interface RuleEditorProps {
  editor: EditorState;
  onChange: (rule: NewPronunciationRule) => void;
  onClose: () => void;
  onSave: () => void;
}

function RuleEditor({ editor, onChange, onClose, onSave }: RuleEditorProps) {
  const rule = editor.rule;
  const preview = useMemo(() => {
    if (!rule || !rule.pattern) return SAMPLE_PREVIEW;
    return cleanSentence(SAMPLE_PREVIEW, undefined, [
      {
        id: 0,
        pattern: rule.pattern,
        isRegex: rule.isRegex,
        replacement: rule.replacement,
        language: rule.language,
        caseSensitive: rule.caseSensitive,
        enabled: true,
        category: rule.category,
        updatedAt: 0,
      },
    ]);
  }, [rule]);

  if (!rule) return null;

  const set = (partial: Partial<NewPronunciationRule>) => onChange({ ...rule, ...partial });

  return (
    <Modal visible={editor.open} animationType="slide" onRequestClose={onClose} transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-slate-50 dark:bg-slate-950"
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-2xl font-black text-slate-950 dark:text-slate-50">
              {rule.id ? "Edit rule" : "New rule"}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-200 active:opacity-75 dark:bg-slate-800"
            >
              <Feather name="x" size={18} color="#475569" />
            </Pressable>
          </View>

          <FieldLabel>Pattern</FieldLabel>
          <TextInput
            value={rule.pattern}
            onChangeText={(pattern) => set({ pattern })}
            placeholder="e.g. b.a.s.t.a.r.d"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            className="mb-4 rounded-2xl bg-white p-3 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-50"
          />

          <FieldLabel>Replacement</FieldLabel>
          <TextInput
            value={rule.replacement}
            onChangeText={(replacement) => set({ replacement })}
            placeholder="e.g. bastard"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            className="mb-4 rounded-2xl bg-white p-3 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-50"
          />

          <FieldLabel>Category</FieldLabel>
          <TextInput
            value={rule.category ?? ""}
            onChangeText={(category) => set({ category: category.trim() || null })}
            placeholder="e.g. abbreviations"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            className="mb-4 rounded-2xl bg-white p-3 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-50"
          />

          <FieldLabel>Language</FieldLabel>
          <View className="mb-4 flex-row flex-wrap rounded-2xl bg-white p-2 dark:bg-slate-900">
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = rule.language === option.value;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => set({ language: option.value })}
                  className={`m-1 rounded-full px-3 py-1.5 ${
                    selected ? "bg-indigo-500" : "bg-slate-100 dark:bg-slate-800"
                  } active:opacity-75`}
                >
                  <Text
                    className={`text-[11px] font-black ${
                      selected ? "text-white" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-3 dark:bg-slate-900">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-black text-slate-950 dark:text-slate-50">
                Treat pattern as regex
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                JavaScript regex. Backreferences allowed in replacement.
              </Text>
            </View>
            <Switch
              value={rule.isRegex}
              onValueChange={(isRegex) => set({ isRegex })}
              trackColor={{ false: "#CBD5E1", true: "#6366F1" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-3 dark:bg-slate-900">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-black text-slate-950 dark:text-slate-50">
                Case sensitive
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                When off, &quot;Foo&quot; also matches &quot;foo&quot;.
              </Text>
            </View>
            <Switch
              value={rule.caseSensitive}
              onValueChange={(caseSensitive) => set({ caseSensitive })}
              trackColor={{ false: "#CBD5E1", true: "#6366F1" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="mb-5 flex-row items-center justify-between rounded-2xl bg-white p-3 dark:bg-slate-900">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-black text-slate-950 dark:text-slate-50">Enabled</Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Disabled rules stay saved but are not applied to TTS.
              </Text>
            </View>
            <Switch
              value={rule.enabled}
              onValueChange={(enabled) => set({ enabled })}
              trackColor={{ false: "#CBD5E1", true: "#6366F1" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <FieldLabel>Preview</FieldLabel>
          <View className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <Text className="text-[10px] uppercase text-slate-400">Sample</Text>
            <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {SAMPLE_PREVIEW}
            </Text>
            <Text className="mt-3 text-[10px] uppercase text-slate-400">After rule</Text>
            <Text className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-50">
              {preview}
            </Text>
          </View>

          <Pressable
            onPress={onSave}
            accessibilityRole="button"
            className="rounded-full bg-indigo-500 px-5 py-3 active:opacity-80"
          >
            <Text className="text-center text-sm font-black uppercase text-white">
              {rule.id ? "Save changes" : "Add rule"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
      {children}
    </Text>
  );
}
