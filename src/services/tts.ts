import * as Speech from "expo-speech";
import { eventRepo } from "@/db/repositories/eventRepo";

export type TtsRuntimeStatus = "idle" | "playing" | "paused";

export interface TtsPlayOptions {
  speed: number;
  pitch: number;
  language: string;
  voiceId?: string | null;
  novelId?: string | null;
  chapterId?: string | null;
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
  index: number;
  startedAt: number;
  options: TtsPlayOptions;
  nativeRunId: number;
  suppressedRunIds: Set<number>;
}

const listeners = new Set<Listener>();
let active: ActiveSpeech | null = null;
let status: TtsRuntimeStatus = "idle";

export function splitSentences(text: string) {
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  return matches?.map((part) => part.trim()).filter(Boolean) ?? [text];
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

function suppressCurrentNativeStop(speech: ActiveSpeech) {
  speech.suppressedRunIds.add(speech.nativeRunId);
}

function speakCurrent() {
  if (!active) return;
  const speech = active;
  const sentence = speech.sentences[speech.index];
  const runId = ++speech.nativeRunId;
  status = "playing";
  emit(speech.index);
  speech.options.onSentence?.(speech.index);

  Speech.speak(sentence, {
    rate: speech.options.speed,
    pitch: speech.options.pitch,
    language: speech.options.language,
    voice: speech.options.voiceId ?? undefined,
    onDone: () => {
      if (!active || active !== speech) return;
      if (speech.index < speech.sentences.length - 1) {
        speech.index += 1;
        speakCurrent();
      } else {
        void finish();
      }
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
  const sentences = splitSentences(text);
  const clampedIndex = Math.max(0, Math.min(sentences.length - 1, startIndex));
  active = {
    sentences,
    index: clampedIndex,
    startedAt: Date.now(),
    options,
    nativeRunId: 0,
    suppressedRunIds: new Set<number>(),
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
    },
  });
  speakCurrent();
}

async function seekActive(index: number) {
  const speech = active;
  if (!speech) return;
  const clampedIndex = Math.max(0, Math.min(speech.sentences.length - 1, index));
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
