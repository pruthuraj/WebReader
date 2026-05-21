import { Text, View } from "react-native";

interface SettingsSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <View className="mb-5">
      <Text className="mb-1 text-xs font-black uppercase text-slate-400">{title}</Text>
      {subtitle ? (
        <Text className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {subtitle}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {children}
      </View>
    </View>
  );
}

