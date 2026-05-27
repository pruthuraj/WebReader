import { Pressable, Text, View } from "react-native";
import { Toggle } from "@/components/ui/controls";

interface SettingsRowBase {
  label: string;
  subtitle?: string;
}

type SettingsRowProps =
  | (SettingsRowBase & {
      type: "switch";
      value: boolean;
      onChange: (value: boolean) => void;
    })
  | (SettingsRowBase & {
      type: "stepper";
      value: string;
      onMinus: () => void;
      onPlus: () => void;
    })
  | (SettingsRowBase & {
      type: "segments";
      value: string;
      options: string[];
      onChange: (value: string) => void;
    })
  | (SettingsRowBase & {
      type: "tap";
      value?: string;
      danger?: boolean;
      onPress: () => void;
    });

function RowShell({ label, subtitle, children }: SettingsRowBase & { children: React.ReactNode }) {
  return (
    <View className="border-b border-app-border p-4 last:border-b-0">
      <View className="flex-row items-center justify-between">
        <View className="mr-4 flex-1">
          <Text className="text-sm font-bold text-app-text">{label}</Text>
          {subtitle ? (
            <Text className="mt-1 text-xs leading-5 text-app-text-muted">{subtitle}</Text>
          ) : null}
        </View>
        {children}
      </View>
    </View>
  );
}

export function SettingsRow(props: SettingsRowProps) {
  if (props.type === "switch") {
    return (
      <RowShell label={props.label} subtitle={props.subtitle}>
        <Toggle value={props.value} onChange={props.onChange} accessibilityLabel={props.label} />
      </RowShell>
    );
  }

  if (props.type === "stepper") {
    return (
      <RowShell label={props.label} subtitle={props.subtitle}>
        <View className="flex-row items-center rounded-full bg-app-surface-2 p-1">
          <Pressable
            onPress={props.onMinus}
            className="h-8 w-8 items-center justify-center rounded-full bg-app-surface-3"
          >
            <Text className="text-base font-bold text-app-text">-</Text>
          </Pressable>
          <Text className="mx-3 min-w-12 text-center text-xs font-bold text-app-text">
            {props.value}
          </Text>
          <Pressable
            onPress={props.onPlus}
            className="h-8 w-8 items-center justify-center rounded-full bg-app-surface-3"
          >
            <Text className="text-base font-bold text-app-text">+</Text>
          </Pressable>
        </View>
      </RowShell>
    );
  }

  if (props.type === "segments") {
    return (
      <View className="border-b border-app-border p-4 last:border-b-0">
        <Text className="text-sm font-bold text-app-text">{props.label}</Text>
        {props.subtitle ? (
          <Text className="mt-1 text-xs leading-5 text-app-text-muted">{props.subtitle}</Text>
        ) : null}
        <View className="mt-3 flex-row flex-wrap rounded-2xl bg-app-surface-2 p-1">
          {props.options.map((option) => {
            const selected = props.value === option;
            return (
              <Pressable
                key={option}
                onPress={() => props.onChange(option)}
                className={`m-1 rounded-full px-3 py-2 ${selected ? "bg-app-surface-3" : ""}`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selected ? "text-app-text" : "text-app-text-muted"
                  }`}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={props.onPress}
      className="border-b border-app-border p-4 last:border-b-0 active:opacity-75"
    >
      <View className="flex-row items-center justify-between">
        <View className="mr-4 flex-1">
          <Text className={`text-sm font-bold ${props.danger ? "text-app-danger" : "text-app-text"}`}>
            {props.label}
          </Text>
          {props.subtitle ? (
            <Text className="mt-1 text-xs leading-5 text-app-text-muted">{props.subtitle}</Text>
          ) : null}
        </View>
        {props.value ? <Text className="text-xs font-bold text-app-text-muted">{props.value}</Text> : null}
      </View>
    </Pressable>
  );
}
