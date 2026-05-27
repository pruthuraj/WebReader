import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/ui/headers";
import { useAppPalette } from "@/theme/useAppPalette";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface Entry {
  icon: FeatherName;
  title: string;
  sub: string;
  route: string;
}

const entries: Entry[] = [
  { icon: "type", title: "Reader Appearance", sub: "Font, theme, layout, defaults", route: "/settings/appearance" },
  { icon: "headphones", title: "Text-to-Speech", sub: "Voice, speed, advanced TTS", route: "/settings/tts" },
  { icon: "download", title: "Downloads", sub: "Download behavior, storage", route: "/settings/downloads" },
  { icon: "globe", title: "Manage sources", sub: "Enable live sources", route: "/sources" },
  { icon: "bar-chart-2", title: "Activity / Dashboard", sub: "Reading stats and analytics", route: "/dashboard" },
  { icon: "code", title: "Developer Tools", sub: "Advanced and debug options", route: "/settings/developer" },
  { icon: "info", title: "About NovelReader", sub: "Version 1.0.0", route: "/settings/about" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const palette = useAppPalette();

  return (
    <ScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
      <AppHeader title="Settings" />
      <View className="px-4 pt-2">
        <View className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
          {entries.map((entry, i) => (
            <Pressable
              key={entry.title}
              onPress={() => router.push(entry.route as never)}
              className="flex-row items-center px-4 py-3.5 active:opacity-75"
              style={{
                borderBottomWidth: i < entries.length - 1 ? 1 : 0,
                borderBottomColor: palette.border,
              }}
              accessibilityRole="button"
              accessibilityLabel={entry.title}
            >
              <View className="h-9 w-9 items-center justify-center rounded-[9px] bg-app-surface-2">
                <Feather name={entry.icon} size={18} color={palette.accent} />
              </View>
              <View className="ml-3.5 flex-1">
                <Text className="text-[15px] font-semibold text-app-text">{entry.title}</Text>
                <Text className="mt-0.5 text-xs text-app-text-muted">{entry.sub}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={palette.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
