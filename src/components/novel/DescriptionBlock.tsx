import { useState } from "react";
import { Pressable, Text, View } from "react-native";

interface DescriptionBlockProps {
  text?: string | null;
}

export function DescriptionBlock({ text }: DescriptionBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-5">
      <Text
        className="text-sm leading-6 text-app-text-dim"
        numberOfLines={expanded ? undefined : 4}
      >
        {text || "No description available."}
      </Text>
      {text ? (
        <Pressable onPress={() => setExpanded((next) => !next)} className="mt-1.5">
          <Text className="text-sm font-semibold text-app-accent">{expanded ? "Less" : "More"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
