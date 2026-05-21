import { useEffect, useMemo, useRef } from "react";
import { Text } from "react-native";
import { readerPalettes } from "@/theme/readerThemes";
import type { ReaderAppearance } from "@/stores/readerStore";

function fontFamily(fontStyle: ReaderAppearance["fontStyle"]) {
  switch (fontStyle) {
    case "mono":
      return "Courier New";
    case "serif":
      return "Georgia";
    case "sans":
    case "system":
    default:
      return undefined;
  }
}

interface ReaderContentProps {
  text: string;
  appearance: ReaderAppearance;
  highlightedSentenceIdx?: number | null;
  onSingleTap?: () => void;
  onSentenceDoubleTap?: (sentenceIndex: number) => void;
}

function splitSentences(text: string) {
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  return matches?.map((part) => part.trim()).filter(Boolean) ?? [text];
}

export function ReaderContent({
  text,
  appearance,
  highlightedSentenceIdx,
  onSingleTap,
  onSentenceDoubleTap,
}: ReaderContentProps) {
  const palette = readerPalettes[appearance.theme];
  const sentences = useMemo(() => splitSentences(text), [text]);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<{ sentenceIndex: number; at: number } | null>(null);

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    };
  }, []);

  const handleSentencePress = (sentenceIndex: number) => {
    const now = Date.now();
    const previous = lastTap.current;

    if (previous?.sentenceIndex === sentenceIndex && now - previous.at <= 300) {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
      lastTap.current = null;
      onSentenceDoubleTap?.(sentenceIndex);
      return;
    }

    lastTap.current = { sentenceIndex, at: now };
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    singleTapTimer.current = setTimeout(() => {
      singleTapTimer.current = null;
      onSingleTap?.();
    }, 300);
  };

  return (
    <Text
      selectable={false}
      style={{
        color: palette.fg,
        fontSize: appearance.fontSize,
        lineHeight: appearance.fontSize * appearance.lineHeight,
        fontFamily: fontFamily(appearance.fontStyle),
        textAlign: appearance.alignment,
      }}
    >
      {sentences.map((sentence, idx) => (
        <Text
          key={`${idx}-${sentence.slice(0, 12)}`}
          onPress={() => handleSentencePress(idx)}
          suppressHighlighting
          style={{
            backgroundColor:
              idx === highlightedSentenceIdx ? palette.accent + "2E" : "transparent",
          }}
        >
          {sentence}
          {idx < sentences.length - 1 ? " " : ""}
        </Text>
      ))}
    </Text>
  );
}
