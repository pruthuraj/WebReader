import { Text, View } from "react-native";

interface MetricCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  emphasis?: "primary" | "muted";
}

export function MetricCard({ label, value, suffix, emphasis = "primary" }: MetricCardProps) {
  const valueColor = emphasis === "primary" ? "text-app-text" : "text-app-text-dim";

  return (
    <View className="min-w-[45%] flex-grow rounded-2xl border border-app-border bg-app-surface p-4">
      <View className="flex-row items-baseline">
        <Text className={`text-[26px] font-bold ${valueColor}`}>{value}</Text>
        {suffix ? <Text className="ml-1 text-xs font-bold text-app-text-muted">{suffix}</Text> : null}
      </View>
      <Text className="mt-1 text-xs text-app-text-muted">{label}</Text>
    </View>
  );
}
