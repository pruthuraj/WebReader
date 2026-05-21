import { create } from "zustand";
import { tts } from "@/services/tts";

export type TtsStatus = "idle" | "playing" | "paused";

export interface TtsState {
  status: TtsStatus;
  speed: number;
  pitch: number;
  voiceId: string | null;
  language: string;
  autoPlayNext: boolean;
  sleepTimerSec: number | null;
  sleepRemainingSec: number | null;
  highlightSentenceIdx: number | null;
  setStatus: (status: TtsStatus) => void;
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setVoice: (id: string | null) => void;
  setLanguage: (lang: string) => void;
  setAutoPlayNext: (v: boolean) => void;
  setSleepTimer: (sec: number | null) => void;
  setHighlight: (idx: number | null) => void;
  play: (
    text: string,
    meta?: { novelId?: string | null; chapterId?: string | null }
  ) => Promise<void>;
  playFromSentence: (
    text: string,
    sentenceIndex: number,
    meta?: { novelId?: string | null; chapterId?: string | null }
  ) => Promise<void>;
  previousSentence: () => Promise<void>;
  nextSentence: () => Promise<void>;
  seekToSentence: (index: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}

let sleepTimer: ReturnType<typeof setInterval> | null = null;

function clearSleepTimer(set: (partial: Partial<TtsState>) => void) {
  if (sleepTimer) clearInterval(sleepTimer);
  sleepTimer = null;
  set({ sleepRemainingSec: null });
}

function armSleepTimer(
  seconds: number | null,
  set: (partial: Partial<TtsState>) => void,
  get: () => TtsState
) {
  if (sleepTimer) clearInterval(sleepTimer);
  sleepTimer = null;

  if (!seconds) {
    set({ sleepRemainingSec: null });
    return;
  }

  const startedAt = Date.now();
  set({ sleepRemainingSec: seconds });
  sleepTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = Math.max(0, seconds - elapsed);
    set({ sleepRemainingSec: remaining });
    if (remaining <= 0) {
      clearSleepTimer(set);
      void get().stop();
    }
  }, 1000);
}

function playbackOptions(
  state: TtsState,
  set: (partial: Partial<TtsState>) => void,
  meta?: { novelId?: string | null; chapterId?: string | null }
) {
  return {
    speed: state.speed,
    pitch: state.pitch,
    voiceId: state.voiceId,
    language: state.language,
    novelId: meta?.novelId,
    chapterId: meta?.chapterId,
    onSentence: (idx: number | null) => state.setHighlight(idx),
    onEnd: () => {
      clearSleepTimer(set);
      set({ status: "idle", highlightSentenceIdx: null });
    },
  };
}

export const useTtsStore = create<TtsState>((set, get) => ({
  status: "idle",
  speed: 1.0,
  pitch: 1.0,
  voiceId: null,
  language: "en-US",
  autoPlayNext: false,
  sleepTimerSec: null,
  sleepRemainingSec: null,
  highlightSentenceIdx: null,
  setStatus: (status) => set({ status }),
  setSpeed: (speed) => set({ speed }),
  setPitch: (pitch) => set({ pitch }),
  setVoice: (voiceId) => set({ voiceId }),
  setLanguage: (language) => set({ language }),
  setAutoPlayNext: (autoPlayNext) => set({ autoPlayNext }),
  setSleepTimer: (sleepTimerSec) => {
    set({ sleepTimerSec });
    if (get().status === "playing") {
      armSleepTimer(sleepTimerSec, set, get);
      return;
    }
    if (!sleepTimerSec) clearSleepTimer(set);
    else set({ sleepRemainingSec: null });
  },
  setHighlight: (highlightSentenceIdx) => set({ highlightSentenceIdx }),
  play: async (text, meta) => {
    const state = get();
    set({ status: "playing", highlightSentenceIdx: 0 });
    await tts.play(text, playbackOptions(state, set, meta));
    armSleepTimer(state.sleepTimerSec, set, get);
  },
  playFromSentence: async (text, sentenceIndex, meta) => {
    const state = get();
    set({ status: "playing", highlightSentenceIdx: sentenceIndex });
    await tts.playFromSentence(text, sentenceIndex, playbackOptions(state, set, meta));
    armSleepTimer(state.sleepTimerSec, set, get);
  },
  previousSentence: async () => {
    await tts.previousSentence();
  },
  nextSentence: async () => {
    await tts.nextSentence();
  },
  seekToSentence: async (index) => {
    await tts.seekToSentence(index);
  },
  pause: async () => {
    await tts.pause();
    set({ status: "paused" });
  },
  resume: async () => {
    await tts.resume();
    set({ status: "playing" });
  },
  stop: async () => {
    await tts.stop();
    clearSleepTimer(set);
    set({ status: "idle", highlightSentenceIdx: null });
  },
}));
