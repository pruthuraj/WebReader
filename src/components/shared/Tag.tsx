import { Text } from "react-native";

type TagVariant = "default" | "language" | "source";

const variantClasses: Record<TagVariant, string> = {
  default: "bg-app-surface-2 text-app-text-dim",
  language: "bg-app-surface-2 text-app-success",
  source: "bg-app-surface-2 text-app-warn",
};

interface TagProps {
  label: string;
  variant?: TagVariant;
}

export function Tag({ label, variant = "default" }: TagProps) {
  return (
    <Text
      className={`mr-1.5 mt-2 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${variantClasses[variant]}`}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}
