import { Text, View } from "react-native";

interface MetricCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  emphasis?: "primary" | "muted";
}

export function MetricCard({ label, value, suffix, emphasis = "primary" }: MetricCardProps) {
  const valueColor =
    emphasis === "primary"
      ? "text-slate-950 dark:text-slate-50"
      : "text-slate-600 dark:text-slate-300";

  return (
    <View className="min-w-[45%] flex-grow rounded-2xl bg-white p-4 dark:bg-slate-900">
      <Text className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </Text>
      <View className="mt-1 flex-row items-baseline">
        <Text className={`text-3xl font-black ${valueColor}`}>{value}</Text>
        {suffix ? (
          <Text className="ml-1 text-xs font-bold text-slate-400">{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}
