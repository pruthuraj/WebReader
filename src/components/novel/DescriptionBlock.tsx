import { useState } from "react";
import { Pressable, Text, View } from "react-native";

interface DescriptionBlockProps {
  text?: string | null;
}

export function DescriptionBlock({ text }: DescriptionBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-6">
      <Text className="mb-2 text-lg font-black text-slate-900 dark:text-slate-50">
        Description
      </Text>
      <Text
        className="text-sm leading-6 text-slate-600 dark:text-slate-300"
        numberOfLines={expanded ? undefined : 4}
      >
        {text || "No description available."}
      </Text>
      {text ? (
        <Pressable onPress={() => setExpanded((next) => !next)} className="mt-2">
          <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
            {expanded ? "less" : "more"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

