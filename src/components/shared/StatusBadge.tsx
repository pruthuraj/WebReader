import { Text } from "react-native";

type StatusVariant =
  | "downloaded"
  | "available"
  | "in-progress"
  | "queued"
  | "downloading"
  | "failed";

const variantClasses: Record<StatusVariant, string> = {
  downloaded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  available: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "in-progress": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  queued: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  downloading: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <Text className={`rounded-full px-2 py-1 text-xs font-semibold ${variantClasses[status]}`}>
      {label ?? status}
    </Text>
  );
}
