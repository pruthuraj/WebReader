import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { readerFontFamily } from "@/theme/readerFonts";

// Supported coverHint values. The mock catalogue uses the first five; the rest
// are pre-mapped so a future backend or expanded mock can reach for them
// without a code change. Unknown hints fall back to the slate-on-navy default.
const gradients: Record<string, readonly [string, string]> = {
  "gradient-indigo": ["#4338CA", "#111827"],
  "gradient-slate": ["#475569", "#020617"],
  "gradient-emerald": ["#047857", "#052E16"],
  "gradient-amber": ["#D97706", "#451A03"],
  "gradient-rose": ["#BE123C", "#3F0A17"],
  "gradient-sky": ["#0369A1", "#082F49"],
  "gradient-violet": ["#6D28D9", "#1E1B4B"],
  "gradient-teal": ["#0F766E", "#042F2E"],
  "gradient-fuchsia": ["#A21CAF", "#3B0764"],
  "gradient-lime": ["#65A30D", "#1A2E05"],
};

export const supportedCoverHints = Object.keys(gradients);

function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

interface CoverPlaceholderProps {
  title: string;
  coverHint?: string | null;
  /** Explicit pixel size (ref covers use specific dimensions per rail). */
  width?: number;
  height?: number;
  radius?: number;
  fontSize?: number;
  /** Legacy sizing shorthand when explicit width/height aren't given. */
  compact?: boolean;
}

export function CoverPlaceholder({
  title,
  coverHint,
  width,
  height,
  radius,
  fontSize,
  compact,
}: CoverPlaceholderProps) {
  const w = width ?? (compact ? 80 : 112);
  const h = height ?? (compact ? 112 : 160);
  const r = radius ?? 8;
  const fs = fontSize ?? Math.round(w * 0.34);
  const colors = gradients[coverHint ?? ""] ?? ["#334155", "#0F172A"];

  // Live sources store a real cover image URL in coverHint. Render it as an
  // image; on load failure fall through to the gradient placeholder.
  const isUrl = !!coverHint && /^https?:\/\//i.test(coverHint);
  const [imageFailed, setImageFailed] = useState(false);

  if (isUrl && !imageFailed) {
    return (
      <View
        style={{ width: w, height: h, borderRadius: r }}
        className="overflow-hidden border border-white/15 bg-slate-800"
      >
        <Image
          source={{ uri: coverHint as string }}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
          onError={() => setImageFailed(true)}
          accessibilityLabel={title}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{
        width: w,
        height: h,
        borderRadius: r,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Text
        style={{
          fontFamily: readerFontFamily("lora", "semibold"),
          fontSize: fs,
          fontWeight: "600",
          color: "rgba(255,255,255,0.92)",
          letterSpacing: 0.5,
        }}
      >
        {initials(title)}
      </Text>
    </LinearGradient>
  );
}
