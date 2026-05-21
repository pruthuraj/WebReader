import * as Brightness from "expo-brightness";
import * as KeepAwake from "expo-keep-awake";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import {
  useReaderStore,
  type FontStyle,
  type ReaderAppearance,
  type TextAlignment,
} from "@/stores/readerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { readerFontSizes, readerLineHeights } from "@/theme/tokens";
import type { ReaderThemeName } from "@/theme/readerThemes";
import { useAnimatedSheet } from "@/hooks/useAnimatedSheet";

interface ReaderSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

function valueIndex<T extends readonly unknown[]>(values: T, value: T[number]) {
  const index = values.indexOf(value);
  return Math.max(0, index);
}

function Stepper({
  label,
  value,
  display,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  display?: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-black uppercase text-white/60">{label}</Text>
      <View className="flex-row items-center rounded-2xl bg-white/5 p-2">
        <Pressable
          onPress={onMinus}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
        >
          <Text className="text-xl font-black text-white">-</Text>
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-base font-black text-white">{display ?? value}</Text>
          <Text className="text-[10px] text-white/40">{value}</Text>
        </View>
        <Pressable
          onPress={onPlus}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
        >
          <Text className="text-xl font-black text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-black uppercase text-white/60">{label}</Text>
      <View className="flex-row flex-wrap rounded-2xl bg-white/5 p-1">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`m-1 rounded-full px-3 py-2 ${selected ? "bg-yellow-300" : ""}`}
            >
              <Text
                className={`text-xs font-black ${
                  selected ? "text-slate-950" : "text-white/70"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ReaderSettingsSheet({ visible, onClose }: ReaderSettingsSheetProps) {
  const appearance = useReaderStore((s) => s.appearance);
  const setAppearance = useReaderStore((s) => s.setAppearance);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const { backdropStyle, sheetStyle } = useAnimatedSheet(visible);

  const updateAppearance = async (partial: Partial<ReaderAppearance>) => {
    const next = { ...appearance, ...partial };
    setAppearance(partial);
    await updateSettings({ readerDefaults: next });

    if (partial.brightness !== undefined) {
      try {
        if (partial.brightness === null) {
          await Brightness.restoreSystemBrightnessAsync();
        } else {
          await Brightness.setBrightnessAsync(partial.brightness);
        }
      } catch {
        // Brightness APIs can be denied by the OS. The setting still persists.
      }
    }

    if (partial.keepAwake !== undefined) {
      try {
        if (partial.keepAwake) await KeepAwake.activateKeepAwakeAsync("webreader-reader");
        else await KeepAwake.deactivateKeepAwake("webreader-reader");
      } catch {
        // Keep-awake is best-effort on web and some native configurations.
      }
    }
  };

  const setFromArray = async <T extends number>(
    values: readonly T[],
    current: T,
    delta: number,
    setter: (value: T) => Partial<ReaderAppearance>
  ) => {
    const nextIndex = Math.max(0, Math.min(values.length - 1, valueIndex(values, current) + delta));
    await updateAppearance(setter(values[nextIndex]));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
        <Pressable className="absolute inset-0" onPress={onClose} />
        <Animated.View
          className="max-h-[86%] overflow-hidden rounded-t-[28px] p-5"
          style={[sheetStyle, { backgroundColor: "rgba(2, 6, 23, 0.96)" }]}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-white">Reading Style</Text>
              <Text className="mt-1 text-xs text-white/60">Persisted to settings.v1</Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-pink-500/25 active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel="Close reading style"
            >
              <Feather name="x" size={18} color="#F472B6" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Stepper
              label="Font size"
              value={`${appearance.fontSize} pt`}
              onMinus={() =>
                setFromArray(
                  readerFontSizes,
                  appearance.fontSize as (typeof readerFontSizes)[number],
                  -1,
                  (fontSize) => ({ fontSize })
                )
              }
              onPlus={() =>
                setFromArray(
                  readerFontSizes,
                  appearance.fontSize as (typeof readerFontSizes)[number],
                  1,
                  (fontSize) => ({ fontSize })
                )
              }
            />
            <Stepper
              label="Line height"
              value={`${appearance.lineHeight}`}
              display={`${Math.round(appearance.lineHeight * 100)}%`}
              onMinus={() =>
                setFromArray(
                  readerLineHeights,
                  appearance.lineHeight as (typeof readerLineHeights)[number],
                  -1,
                  (lineHeight) => ({ lineHeight })
                )
              }
              onPlus={() =>
                setFromArray(
                  readerLineHeights,
                  appearance.lineHeight as (typeof readerLineHeights)[number],
                  1,
                  (lineHeight) => ({ lineHeight })
                )
              }
            />
            <Stepper
              label="Margin"
              value={`${appearance.margin} px`}
              onMinus={() => updateAppearance({ margin: Math.max(12, appearance.margin - 4) })}
              onPlus={() => updateAppearance({ margin: Math.min(40, appearance.margin + 4) })}
            />
            <Stepper
              label="Brightness"
              value={
                appearance.brightness === null
                  ? "System"
                  : `${Math.round(appearance.brightness * 100)}%`
              }
              onMinus={() =>
                updateAppearance({
                  brightness:
                    appearance.brightness === null
                      ? 0.5
                      : Math.max(0.1, Math.round((appearance.brightness - 0.1) * 10) / 10),
                })
              }
              onPlus={() =>
                updateAppearance({
                  brightness:
                    appearance.brightness === null
                      ? 0.7
                      : Math.min(1, Math.round((appearance.brightness + 0.1) * 10) / 10),
                })
              }
            />
            <Segmented<ReaderThemeName>
              label="Theme"
              value={appearance.theme}
              onChange={(theme) => updateAppearance({ theme })}
              options={[
                { value: "light", label: "Light" },
                { value: "sepia", label: "Sepia" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <Segmented<FontStyle>
              label="Font"
              value={appearance.fontStyle}
              onChange={(fontStyle) => updateAppearance({ fontStyle })}
              options={[
                { value: "system", label: "System" },
                { value: "serif", label: "Serif" },
                { value: "sans", label: "Sans" },
                { value: "mono", label: "Mono" },
              ]}
            />
            <Segmented<TextAlignment>
              label="Alignment"
              value={appearance.alignment}
              onChange={(alignment) => updateAppearance({ alignment })}
              options={[
                { value: "left", label: "Left" },
                { value: "justify", label: "Justify" },
              ]}
            />
            <View className="mb-8 flex-row items-center justify-between rounded-2xl bg-white/5 p-4">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-black text-white">Keep screen awake</Text>
                <Text className="mt-1 text-xs text-white/60">
                  Useful for long reading sessions
                </Text>
              </View>
              <Switch
                value={settings.readerDefaults.keepAwake}
                onValueChange={(keepAwake) => updateAppearance({ keepAwake })}
                trackColor={{ false: "#1E293B", true: "#FDE68A" }}
                thumbColor={settings.readerDefaults.keepAwake ? "#020617" : "#94A3B8"}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
