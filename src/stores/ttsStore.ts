import { create } from "zustand";
import { pronunciationRepo } from "@/db/repositories/pronunciationRepo";
import { tts } from "@/services/tts";
import { useSettingsStore } from "@/stores/settingsStore";

export type TtsStatus = "idle" | "playing" | "paused";
export type SleepTimerValue = number | "eoc" | null;

export interface TtsState {
  status: TtsStatus;
  speed: number;
  pitch: number;
  voiceId: string | null;
  language: string;
  autoPlayNext: boolean;
  sleepTimerSec: SleepTimerValue;
  sleepRemainingSec: number | null;
  highlightSentenceIdx: number | null;
  setStatus: (status: TtsStatus) => void;
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setVoice: (id: string | null) => void;
  setLanguage: (lang: string) => void;
  setAutoPlayNext: (v: boolean) => void;
  setSleepTimer: (value: SleepTimerValue) => void;
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
  value: SleepTimerValue,
  set: (partial: Partial<TtsState>) => void,
  get: () => TtsState
) {
  if (sleepTimer) clearInterval(sleepTimer);
  sleepTimer = null;

  if (!value || value === "eoc") {
    set({ sleepRemainingSec: null });
    return;
  }

  const startedAt = Date.now();
  set({ sleepRemainingSec: value });
  sleepTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = Math.max(0, value - elapsed);
    set({ sleepRemainingSec: remaining });
    if (remaining <= 0) {
      clearSleepTimer(set);
      void get().stop();
    }
  }, 1000);
}

async function playbackOptions(
  state: TtsState,
  set: (partial: Partial<TtsState>) => void,
  meta?: { novelId?: string | null; chapterId?: string | null }
) {
  const ttsDefaults = useSettingsStore.getState().settings.ttsDefaults;
  let pronunciationRules: Awaited<ReturnType<typeof pronunciationRepo.listEnabledForLanguage>> = [];
  try {
    pronunciationRules = await pronunciationRepo.listEnabledForLanguage(state.language);
  } catch {
    // Pronunciation table may not exist on a freshly-migrated DB; skip silently.
  }
  return {
    speed: state.speed,
    pitch: state.pitch,
    voiceId: state.voiceId,
    language: state.language,
    novelId: meta?.novelId,
    chapterId: meta?.chapterId,
    pauseMs: ttsDefaults.sentencePauseMs,
    cleaning: ttsDefaults.cleaning,
    splitOnCommas: ttsDefaults.highlightMode === "comma",
    pronunciationRules,
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
  setSleepTimer: (value) => {
    set({ sleepTimerSec: value });
    if (get().status === "playing" && typeof value === "number") {
      armSleepTimer(value, set, get);
      return;
    }
    if (!value || value === "eoc") clearSleepTimer(set);
    else set({ sleepRemainingSec: null });
  },
  setHighlight: (highlightSentenceIdx) => set({ highlightSentenceIdx }),
  play: async (text, meta) => {
    const state = get();
    set({ status: "playing", highlightSentenceIdx: 0 });
    const options = await playbackOptions(state, set, meta);
    await tts.play(text, options);
    armSleepTimer(state.sleepTimerSec, set, get);
  },
  playFromSentence: async (text, sentenceIndex, meta) => {
    const state = get();
    set({ status: "playing", highlightSentenceIdx: sentenceIndex });
    const options = await playbackOptions(state, set, meta);
    await tts.playFromSentence(text, sentenceIndex, options);
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
