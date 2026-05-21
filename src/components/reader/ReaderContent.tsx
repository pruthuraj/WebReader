import { useEffect, useMemo, useRef } from "react";
import { Text } from "react-native";
import { splitSentences } from "@/services/tts";
import { readerPalettes } from "@/theme/readerThemes";
import type { ReaderAppearance } from "@/stores/readerStore";
import type { HighlightMode } from "@/stores/settingsStore";

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
  highlightMode?: HighlightMode;
  onSentenceDoubleTap?: (sentenceIndex: number) => void;
}

interface SentenceInfo {
  sentence: string;
  paragraphIdx: number;
}

function buildSentenceInfo(text: string, commaMode: boolean): SentenceInfo[] {
  const sentences = splitSentences(text, { commaMode });
  const boundaries: number[] = [0];
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === "\n" && text[i + 1] === "\n") boundaries.push(i + 2);
  }
  const out: SentenceInfo[] = [];
  let cursor = 0;
  for (const s of sentences) {
    const at = text.indexOf(s, cursor);
    if (at === -1) {
      out.push({ sentence: s, paragraphIdx: 0 });
      continue;
    }
    cursor = at + s.length;
    let pIdx = 0;
    for (let i = 0; i < boundaries.length; i++) {
      if (boundaries[i] <= at) pIdx = i;
      else break;
    }
    out.push({ sentence: s, paragraphIdx: pIdx });
  }
  return out;
}

export function ReaderContent({
  text,
  appearance,
  highlightedSentenceIdx,
  highlightMode = "sentence",
  onSentenceDoubleTap,
}: ReaderContentProps) {
  const palette = readerPalettes[appearance.theme];
  const commaMode = highlightMode === "comma";
  const sentenceInfo = useMemo(
    () => buildSentenceInfo(text, commaMode),
    [text, commaMode]
  );
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
    }, 300);
  };

  const activeParagraphIdx =
    highlightedSentenceIdx !== null && highlightedSentenceIdx !== undefined
      ? sentenceInfo[highlightedSentenceIdx]?.paragraphIdx ?? null
      : null;

  const isHighlighted = (idx: number) => {
    if (highlightedSentenceIdx === null || highlightedSentenceIdx === undefined) return false;
    if (highlightMode === "paragraph" || highlightMode === "underlineParagraph") {
      return sentenceInfo[idx]?.paragraphIdx === activeParagraphIdx;
    }
    return idx === highlightedSentenceIdx;
  };

  const underlineActive = highlightMode === "underlineParagraph";
  const accentBg = palette.accent + "2E";

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
      {sentenceInfo.map(({ sentence }, idx) => {
        const highlighted = isHighlighted(idx);
        return (
          <Text
            key={`${idx}-${sentence.slice(0, 12)}`}
            onPress={() => handleSentencePress(idx)}
            suppressHighlighting
            style={{
              backgroundColor: highlighted ? accentBg : "transparent",
              textDecorationLine: highlighted && underlineActive ? "underline" : "none",
            }}
          >
            {sentence}
            {idx < sentenceInfo.length - 1 ? " " : ""}
          </Text>
        );
      })}
    </Text>
  );
}
