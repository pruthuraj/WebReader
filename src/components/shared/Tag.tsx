import { Text } from "react-native";

type TagVariant = "default" | "language" | "source";

const variantClasses: Record<TagVariant, string> = {
  default: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  language:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  source:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
};

interface TagProps {
  label: string;
  variant?: TagVariant;
}

export function Tag({ label, variant = "default" }: TagProps) {
  return (
    <Text
      className={`mr-2 mt-2 rounded-full border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

