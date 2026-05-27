import { useEffect, useMemo, useRef } from "react";
import { Text } from "react-native";
import { splitSentences } from "@/services/tts";
import { readerFontFamily } from "@/theme/readerFonts";
import { readerPalettes } from "@/theme/readerThemes";
import type { ReaderAppearance } from "@/stores/readerStore";
import type { HighlightMode } from "@/stores/settingsStore";

interface ReaderContentProps {
  text: string;
  appearance: ReaderAppearance;
  highlightedSentenceIdx?: number | null;
  highlightMode?: HighlightMode;
  /** TTS is currently playing — used to decide whether focus blur applies. */
  ttsPlaying?: boolean;
  onSentenceDoubleTap?: (sentenceIndex: number) => void;
}

const FOCUS_WINDOW: Record<"narrow" | "medium" | "wide", number> = {
  narrow: 0,
  medium: 1,
  wide: 2,
};

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
  ttsPlaying = false,
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

  // Focus blur. RN can't Gaussian-blur inline <Text> per paragraph, so "focus"
  // mode dims the surrounding text instead; the blur slider folds into dim
  // strength. `blurAll` mode is handled by a BlurView overlay in the reader
  // screen, not here. Focus tracks the TTS-highlighted sentence, so it's only
  // visible when there's an active sentence (during playback by default).
  const focus = appearance.focus;
  const focusActive =
    focus.enabled &&
    focus.mode === "focus" &&
    ((ttsPlaying && focus.duringTTS) || (!ttsPlaying && focus.duringManual)) &&
    highlightedSentenceIdx !== null &&
    highlightedSentenceIdx !== undefined;
  const focusRange = FOCUS_WINDOW[focus.window];
  const dimAlpha = focusActive
    ? Math.min(0.9, (focus.dim / 100) * 0.85 + (focus.blur / 15) * 0.25)
    : 0;

  const isFocusClear = (idx: number): boolean => {
    if (!focusActive || highlightedSentenceIdx === null || highlightedSentenceIdx === undefined)
      return true;
    if (focus.target === "sentence") {
      return Math.abs(idx - highlightedSentenceIdx) <= focusRange;
    }
    const p = sentenceInfo[idx]?.paragraphIdx ?? 0;
    return activeParagraphIdx === null ? true : Math.abs(p - activeParagraphIdx) <= focusRange;
  };

  return (
    <Text
      selectable={false}
      style={{
        color: palette.fg,
        fontSize: appearance.fontSize,
        lineHeight: appearance.fontSize * appearance.lineHeight,
        fontFamily: readerFontFamily(appearance.fontStyle),
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
              opacity: isFocusClear(idx) ? 1 : 1 - dimAlpha,
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
