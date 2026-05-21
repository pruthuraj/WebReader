import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

type FeatherName = ComponentProps<typeof Feather>["name"];

function tabIcon(name: FeatherName) {
  const Icon = ({ color, size }: { color: string; size: number }) => (
    <Feather name={name} size={size} color={color} />
  );
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0F172A" },
        headerTintColor: "#F8FAFC",
        headerTitleStyle: { fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "#1E293B",
        },
        tabBarActiveTintColor: "#FDE68A",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: tabIcon("home"),
          headerTitle: "WebReader",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: tabIcon("search"),
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: "Downloads",
          tabBarIcon: tabIcon("download"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: tabIcon("settings"),
        }}
      />
    </Tabs>
  );
}
