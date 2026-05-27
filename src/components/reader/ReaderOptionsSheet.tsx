import type { ComponentProps } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAnimatedSheet } from "@/hooks/useAnimatedSheet";

interface ReaderOptionsSheetProps {
  visible: boolean;
  novelId: string;
  onClose: () => void;
  onOpenAppearance: () => void;
  onOpenTtsSettings: () => void;
  onAddBookmark: () => void;
}

type FeatherName = ComponentProps<typeof Feather>["name"];

function OptionRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: FeatherName;
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="mb-2 flex-row items-center rounded-2xl bg-white/5 p-4 active:opacity-75"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Feather name={icon} size={18} color="#8B95FF" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-black text-white">{label}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-white/60">{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color="rgba(248, 250, 252, 0.5)" />
    </Pressable>
  );
}

export function ReaderOptionsSheet({
  visible,
  novelId,
  onClose,
  onOpenAppearance,
  onOpenTtsSettings,
  onAddBookmark,
}: ReaderOptionsSheetProps) {
  const router = useRouter();
  const { backdropStyle, sheetStyle } = useAnimatedSheet(visible);

  const goNovel = () => {
    onClose();
    router.push({ pathname: "/novel/[id]", params: { id: novelId } });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel="Close reader options"
        />
        <Animated.View
          className="max-h-[86%] overflow-hidden rounded-t-[28px] p-5"
          style={[sheetStyle, { backgroundColor: "rgba(2, 6, 23, 0.96)" }]}
        >
          <View className="mb-3 h-1 w-9 self-center rounded-full bg-white/20" />
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-white">Reader options</Text>
              <Text className="mt-1 text-xs text-white/60">
                Jump to chapters, change appearance, or visit settings.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-pink-500/25 active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={18} color="#F472B6" />
            </Pressable>
          </View>

          <OptionRow
            icon="list"
            label="Contents"
            subtitle="Browse this novel's chapter list."
            onPress={goNovel}
          />
          <OptionRow
            icon="info"
            label="About"
            subtitle="Novel details and description."
            onPress={goNovel}
          />
          <OptionRow
            icon="bookmark"
            label="Add bookmark"
            subtitle="Save your current spot in this chapter."
            onPress={() => {
              onClose();
              onAddBookmark();
            }}
          />
          <OptionRow
            icon="type"
            label="Appearance"
            subtitle="Font, theme, margin, brightness."
            onPress={() => {
              onClose();
              onOpenAppearance();
            }}
          />
          <OptionRow
            icon="volume-2"
            label="TTS settings"
            subtitle="Voice, language, sleep timer."
            onPress={() => {
              onClose();
              onOpenTtsSettings();
            }}
          />
          <OptionRow
            icon="download"
            label="Downloads"
            subtitle="Manage offline chapters."
            onPress={() => {
              onClose();
              router.push("/downloads");
            }}
          />
          <OptionRow
            icon="sliders"
            label="Reader settings"
            subtitle="App-wide reader and TTS defaults."
            onPress={() => {
              onClose();
              router.push("/settings");
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
