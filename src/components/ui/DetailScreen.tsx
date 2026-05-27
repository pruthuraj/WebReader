import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { ScreenHeader } from "./headers";

/**
 * Standard settings/detail page scaffold: hidden navigator header + in-content
 * ScreenHeader + scrolling body on the app background (ref `ScreenScroller`).
 */
export function DetailScreen({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="flex-1 bg-app-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={title} right={right} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>{children}</ScrollView>
    </View>
  );
}
