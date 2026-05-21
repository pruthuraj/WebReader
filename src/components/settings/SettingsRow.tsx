import { Pressable, Switch, Text, View } from "react-native";

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
    <View className="border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-800">
      <View className="flex-row items-center justify-between">
        <View className="mr-4 flex-1">
          <Text className="text-sm font-black text-slate-900 dark:text-slate-50">{label}</Text>
          {subtitle ? (
            <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {subtitle}
            </Text>
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
        <Switch value={props.value} onValueChange={props.onChange} />
      </RowShell>
    );
  }

  if (props.type === "stepper") {
    return (
      <RowShell label={props.label} subtitle={props.subtitle}>
        <View className="flex-row items-center rounded-full bg-slate-100 p-1 dark:bg-slate-800">
          <Pressable onPress={props.onMinus} className="h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-950">
            <Text className="text-base font-black text-slate-700 dark:text-slate-200">-</Text>
          </Pressable>
          <Text className="mx-3 min-w-12 text-center text-xs font-black text-slate-700 dark:text-slate-200">
            {props.value}
          </Text>
          <Pressable onPress={props.onPlus} className="h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-950">
            <Text className="text-base font-black text-slate-700 dark:text-slate-200">+</Text>
          </Pressable>
        </View>
      </RowShell>
    );
  }

  if (props.type === "segments") {
    return (
      <View className="border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-800">
        <Text className="text-sm font-black text-slate-900 dark:text-slate-50">{props.label}</Text>
        {props.subtitle ? (
          <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {props.subtitle}
          </Text>
        ) : null}
        <View className="mt-3 flex-row flex-wrap rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {props.options.map((option) => {
            const selected = props.value === option;
            return (
              <Pressable
                key={option}
                onPress={() => props.onChange(option)}
                className={`m-1 rounded-full px-3 py-2 ${selected ? "bg-white dark:bg-slate-950" : ""}`}
              >
                <Text
                  className={`text-xs font-black ${
                    selected
                      ? "text-slate-950 dark:text-slate-50"
                      : "text-slate-500 dark:text-slate-400"
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
    <Pressable onPress={props.onPress} className="border-b border-slate-100 p-4 active:opacity-75 last:border-b-0 dark:border-slate-800">
      <View className="flex-row items-center justify-between">
        <View className="mr-4 flex-1">
          <Text
            className={`text-sm font-black ${
              props.danger ? "text-red-600" : "text-slate-900 dark:text-slate-50"
            }`}
          >
            {props.label}
          </Text>
          {props.subtitle ? (
            <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {props.subtitle}
            </Text>
          ) : null}
        </View>
        {props.value ? (
          <Text className="text-xs font-bold text-slate-400">{props.value}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

