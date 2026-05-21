import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { ChapterMeta } from "@/data/types";

interface ChapterNavigationProps {
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
  onPrev: () => void;
  onNext: () => void;
}

function NavButton({
  disabled,
  label,
  icon,
  onPress,
}: {
  disabled: boolean;
  label: string;
  icon: "arrow-left" | "arrow-right";
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center rounded-full px-4 py-3 ${
        disabled ? "bg-reader-muted/20" : "bg-reader-fg"
      }`}
    >
      {icon === "arrow-left" ? <Feather name={icon} size={16} color="#FFFFFF" /> : null}
      <Text className={`mx-2 text-sm font-black ${disabled ? "text-reader-muted" : "text-reader-bg"}`}>
        {label}
      </Text>
      {icon === "arrow-right" ? <Feather name={icon} size={16} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

export function ChapterNavigation({ prev, next, onPrev, onNext }: ChapterNavigationProps) {
  return (
    <View className="mt-10 flex-row gap-3 border-t border-reader-muted/20 pt-5">
      <NavButton disabled={!prev} label="Prev" icon="arrow-left" onPress={onPrev} />
      <NavButton disabled={!next} label="Next" icon="arrow-right" onPress={onNext} />
    </View>
  );
}

