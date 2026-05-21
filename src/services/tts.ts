import * as Speech from "expo-speech";
import { eventRepo } from "@/db/repositories/eventRepo";
import type { TtsCleaningToggles } from "@/stores/settingsStore";

export type TtsRuntimeStatus = "idle" | "playing" | "paused";

export interface TtsPlayOptions {
  speed: number;
  pitch: number;
  language: string;
  voiceId?: string | null;
  novelId?: string | null;
  chapterId?: string | null;
  pauseMs?: number;
  cleaning?: TtsCleaningToggles;
  splitOnCommas?: boolean;
  onSentence?: (idx: number | null) => void;
  onEnd?: () => void;
}

export interface TtsRuntimeSnapshot {
  status: TtsRuntimeStatus;
  sentenceIdx: number | null;
}

type Listener = (snapshot: TtsRuntimeSnapshot) => void;

interface ActiveSpeech {
  sentences: string[];
  spokenSentences: string[];
  index: number;
  startedAt: number;
  options: TtsPlayOptions;
  nativeRunId: number;
  suppressedRunIds: Set<number>;
  pauseTimer: ReturnType<typeof setTimeout> | null;
}

const listeners = new Set<Listener>();
let active: ActiveSpeech | null = null;
let status: TtsRuntimeStatus = "idle";

export function splitSentences(text: string, options?: { commaMode?: boolean }): string[] {
  const regex = options?.commaMode
    ? /[^.!?,;]+[.!?,;]+(\s+|$)|[^.!?,;]+$/g
    : /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
  const matches = text.match(regex);
  return matches?.map((part) => part.trim()).filter(Boolean) ?? [text];
}

const URL_REGEX = /\b(?:https?:\/\/|www\.)\S+/gi;
const SQUARE_BRACKET_REGEX = /\[[^\]]*\]/g;
const PAREN_REGEX = /\([^)]*\)/g;
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;
const SUPERSCRIPT_REGEX = /[²³¹⁰-₟]/g;
const LINKED_REF_REGEX = /\^[0-9]+|(?:^|\s)\d+(?=\s|$)/g;
const SPACED_UPPER_REGEX = /\b(?:[A-Z](?:\s[A-Z]){2,})\b/g;
const LINE_BREAK_HYPHEN_REGEX = /-\s*\n\s*/g;
const SYMBOL_KEEP_REGEX = /[^\p{L}\p{N}\s.,!?;:'"\-()\[\]]/gu;

export function cleanSentence(input: string, opts?: TtsCleaningToggles): string {
  if (!opts) return input;
  let out = input;
  if (opts.lineBreakHyphens) out = out.replace(LINE_BREAK_HYPHEN_REGEX, "");
  if (opts.urls) out = out.replace(URL_REGEX, "");
  if (opts.brackets) out = out.replace(SQUARE_BRACKET_REGEX, "");
  if (opts.parens) out = out.replace(PAREN_REGEX, "");
  if (opts.linkedRefs) out = out.replace(LINKED_REF_REGEX, " ");
  if (opts.spacedUppercase) {
    out = out.replace(SPACED_UPPER_REGEX, (match) => match.replace(/\s/g, ""));
  }
  if (opts.superscript) out = out.replace(SUPERSCRIPT_REGEX, "");
  if (opts.emojis) out = out.replace(EMOJI_REGEX, "");
  if (opts.hyphens) out = out.replace(/-/g, " ");
  if (opts.symbols) out = out.replace(SYMBOL_KEEP_REGEX, "");
  return out.replace(/\s+/g, " ").trim();
}

function emit(sentenceIdx: number | null = active?.index ?? null) {
  for (const listener of listeners) listener({ status, sentenceIdx });
}

async function recordStop(speech: ActiveSpeech) {
  await eventRepo.record({
    type: "tts_stop",
    novelId: speech.options.novelId ?? null,
    chapterId: speech.options.chapterId ?? null,
    durationMs: Date.now() - speech.startedAt,
    payload: { sentenceCount: speech.sentences.length },
  });
}

function clearPauseTimer(speech: ActiveSpeech) {
  if (speech.pauseTimer) {
    clearTimeout(speech.pauseTimer);
    speech.pauseTimer = null;
  }
}

function suppressCurrentNativeStop(speech: ActiveSpeech) {
  speech.suppressedRunIds.add(speech.nativeRunId);
}

function advanceOrFinish(speech: ActiveSpeech) {
  if (active !== speech) return;
  if (speech.index < speech.sentences.length - 1) {
    speech.index += 1;
    const pause = Math.max(0, speech.options.pauseMs ?? 0);
    if (pause > 0) {
      clearPauseTimer(speech);
      speech.pauseTimer = setTimeout(() => {
        speech.pauseTimer = null;
        if (active === speech) speakCurrent();
      }, pause);
    } else {
      speakCurrent();
    }
  } else {
    void finish();
  }
}

function speakCurrent() {
  if (!active) return;
  const speech = active;
  const sentence = speech.spokenSentences[speech.index];
  const runId = ++speech.nativeRunId;
  status = "playing";
  emit(speech.index);
  speech.options.onSentence?.(speech.index);

  if (!sentence || !sentence.trim()) {
    advanceOrFinish(speech);
    return;
  }

  Speech.speak(sentence, {
    rate: speech.options.speed,
    pitch: speech.options.pitch,
    language: speech.options.language,
    voice: speech.options.voiceId ?? undefined,
    onDone: () => {
      if (!active || active !== speech) return;
      advanceOrFinish(speech);
    },
    onStopped: () => {
      if (active === speech && !speech.suppressedRunIds.has(runId)) void finish();
    },
    onError: () => {
      if (active === speech) void finish();
    },
  });
}

async function finish() {
  const speech = active;
  if (!speech) return;
  clearPauseTimer(speech);
  active = null;
  status = "idle";
  emit(null);
  speech.options.onSentence?.(null);
  speech.options.onEnd?.();
  await recordStop(speech);
}

async function cancelActive(recordEvent: boolean) {
  const speech = active;
  if (!speech) return;
  clearPauseTimer(speech);
  suppressCurrentNativeStop(speech);
  active = null;
  status = "idle";
  emit(null);
  await Speech.stop();
  if (recordEvent) {
    speech.options.onSentence?.(null);
    speech.options.onEnd?.();
    await recordStop(speech);
  }
}

async function startPlayback(text: string, options: TtsPlayOptions, startIndex: number) {
  await cancelActive(false);
  const sentences = splitSentences(text, { commaMode: options.splitOnCommas });
  const spokenSentences = sentences.map((s) => cleanSentence(s, options.cleaning));
  const clampedIndex = Math.max(0, Math.min(sentences.length - 1, startIndex));
  active = {
    sentences,
    spokenSentences,
    index: clampedIndex,
    startedAt: Date.now(),
    options,
    nativeRunId: 0,
    suppressedRunIds: new Set<number>(),
    pauseTimer: null,
  };
  await eventRepo.record({
    type: "tts_start",
    novelId: options.novelId ?? null,
    chapterId: options.chapterId ?? null,
    payload: {
      language: options.language,
      speed: options.speed,
      pitch: options.pitch,
      startSentenceIndex: clampedIndex,
      sentenceCount: sentences.length,
      pauseMs: options.pauseMs ?? 0,
    },
  });
  speakCurrent();
}

async function seekActive(index: number) {
  const speech = active;
  if (!speech) return;
  const clampedIndex = Math.max(0, Math.min(speech.sentences.length - 1, index));
  clearPauseTimer(speech);
  suppressCurrentNativeStop(speech);
  await Speech.stop();
  if (active !== speech) return;
  speech.index = clampedIndex;
  speakCurrent();
}

export const tts = {
  async play(text: string, options: TtsPlayOptions) {
    await startPlayback(text, options, 0);
  },

  async playFromSentence(text: string, sentenceIndex: number, options: TtsPlayOptions) {
    await startPlayback(text, options, sentenceIndex);
  },

  async pause() {
    if (!active) return;
    try {
      await Speech.pause();
    } catch {
      await Speech.stop();
    }
    status = "paused";
    emit();
  },

  async resume() {
    if (!active) return;
    try {
      await Speech.resume();
    } catch {
      speakCurrent();
    }
    status = "playing";
    emit();
  },

  async stop() {
    await cancelActive(true);
  },

  async seekToSentence(index: number) {
    await seekActive(index);
  },

  async previousSentence() {
    if (!active) return;
    await seekActive(active.index - 1);
  },

  async nextSentence() {
    if (!active) return;
    await seekActive(active.index + 1);
  },

  async getVoices() {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch {
      return [];
    }
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    listener({ status, sentenceIdx: active?.index ?? null });
    return () => listeners.delete(listener);
  },
};
