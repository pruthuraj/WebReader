import { Children, isValidElement, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Feather } from "@expo/vector-icons";
import { useAppPalette } from "@/theme/useAppPalette";
import { Stepper, Toggle } from "./controls";

/** Grouped inset card with uppercase title + optional footnote (ref `Section`). */
export function SettingsGroup({
  title,
  footnote,
  children,
}: {
  title?: string;
  footnote?: string;
  children: ReactNode;
}) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View className="mt-[18px]">
      {title ? (
        <Text className="px-6 pb-2 text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
          {title}
        </Text>
      ) : null}
      <View className="mx-4 overflow-hidden rounded-2xl border border-app-border bg-app-surface">
        {rows.map((row, i) => (
          <View key={i}>
            {row}
            {i < rows.length - 1 ? <View className="ml-3.5 h-px bg-app-border" /> : null}
          </View>
        ))}
      </View>
      {footnote ? (
        <Text className="px-6 pt-2 text-[11.5px] leading-[17px] text-app-text-muted">
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

function RowFrame({
  label,
  sub,
  right,
  onPress,
  danger,
  accent,
  chevron,
  value,
}: {
  label: string;
  sub?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  accent?: boolean;
  chevron?: boolean;
  value?: string;
}) {
  const palette = useAppPalette();
  const labelColor = danger ? "text-app-danger" : accent ? "text-app-accent" : "text-app-text";
  const Inner = (
    <View className="min-h-[44px] flex-row items-center justify-between px-3.5 py-3">
      <View className="flex-1 pr-3">
        <Text className={`text-[14.5px] ${labelColor} ${accent ? "font-semibold" : ""}`}>
          {label}
        </Text>
        {sub ? <Text className="mt-0.5 text-xs text-app-text-muted">{sub}</Text> : null}
      </View>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        {value ? <Text className="text-[13px] text-app-text-dim">{value}</Text> : null}
        {right}
        {chevron ? (
          <Feather name="chevron-right" size={16} color={palette.textMuted} />
        ) : null}
      </View>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-70">
        {Inner}
      </Pressable>
    );
  }
  return Inner;
}

/** Tappable / link row with value + chevron (ref `SRow`). */
export function SettingLinkRow(props: {
  label: string;
  sub?: string;
  value?: string;
  chevron?: boolean;
  onPress?: () => void;
  danger?: boolean;
  accent?: boolean;
}) {
  return <RowFrame {...props} />;
}

export function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <RowFrame
      label={label}
      sub={sub}
      right={<Toggle value={value} onChange={onChange} accessibilityLabel={label} />}
    />
  );
}

export function StepperRow({
  label,
  sub,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  sub?: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <RowFrame
      label={label}
      sub={sub}
      right={<Stepper value={value} onMinus={onMinus} onPlus={onPlus} />}
    />
  );
}

/** Inline-expanding select (ref `SSelect`). */
export function SelectRow({
  label,
  sub,
  value,
  options,
  onChange,
}: {
  label: string;
  sub?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const palette = useAppPalette();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <RowFrame
        label={label}
        sub={sub}
        onPress={() => setOpen((o) => !o)}
        right={
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Text className="text-[13.5px] font-medium text-app-text-dim">{value}</Text>
            <Feather name={open ? "chevron-up" : "chevron-down"} size={14} color={palette.textMuted} />
          </View>
        }
      />
      {open ? (
        <View className="border-t border-app-border bg-app-surface-2 px-3.5 py-2">
          {options.map((o) => (
            <Pressable
              key={o}
              onPress={() => {
                onChange(o);
                setOpen(false);
              }}
              className="flex-row items-center justify-between py-2 active:opacity-70"
            >
              <Text className="text-[13.5px] text-app-text">{o}</Text>
              {o === value ? <Feather name="check" size={16} color={palette.accent} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Labeled slider row (ref `SSlider`). */
export function SliderRow({
  label,
  sub,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "%",
  disabled,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  const palette = useAppPalette();
  return (
    <View className="px-3.5 py-3" style={{ opacity: disabled ? 0.4 : 1 }}>
      <View className="mb-2 flex-row items-baseline justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[14.5px] text-app-text">{label}</Text>
          {sub ? <Text className="mt-0.5 text-xs text-app-text-muted">{sub}</Text> : null}
        </View>
        <Text
          className="text-sm font-semibold"
          style={{ color: value > min ? palette.accent : palette.textMuted }}
        >
          {value}
          {suffix}
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        minimumTrackTintColor={palette.accent}
        maximumTrackTintColor={palette.surface3}
        thumbTintColor={palette.accent}
      />
    </View>
  );
}

/** Full-width segmented row with label above the track (ref `SSegmented`). */
export function SegmentRow<T extends string>({
  label,
  sub,
  value,
  options,
  onChange,
}: {
  label: string;
  sub?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View className="px-3.5 py-3">
      <View className="mb-2.5">
        <Text className="text-[14.5px] text-app-text">{label}</Text>
        {sub ? <Text className="mt-0.5 text-xs text-app-text-muted">{sub}</Text> : null}
      </View>
      <View className="flex-row rounded-[10px] border border-app-border bg-app-surface-2 p-[3px]">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              className={`flex-1 items-center rounded-[7px] py-[7px] ${on ? "bg-app-surface-3" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${on ? "text-app-text" : "text-app-text-muted"}`}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
