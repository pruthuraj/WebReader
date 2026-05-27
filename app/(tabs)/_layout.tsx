import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppPalette } from "@/theme/useAppPalette";

type FeatherName = ComponentProps<typeof Feather>["name"];

function tabIcon(name: FeatherName) {
  const Icon = ({ color, size }: { color: string; size: number }) => (
    <Feather name={name} size={size} color={color} />
  );
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
}

export default function TabsLayout() {
  const palette = useAppPalette();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.border,
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: tabIcon("home") }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: "Search", tabBarIcon: tabIcon("search") }}
      />
      <Tabs.Screen
        name="downloads"
        options={{ title: "Downloads", tabBarIcon: tabIcon("download") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", tabBarIcon: tabIcon("settings") }}
      />
    </Tabs>
  );
}
