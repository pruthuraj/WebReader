import { Text, View } from "react-native";

interface SettingsSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <View className="mb-5">
      <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-app-text-muted">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mb-3 text-xs leading-5 text-app-text-muted">{subtitle}</Text>
      ) : null}
      <View className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
        {children}
      </View>
    </View>
  );
}
