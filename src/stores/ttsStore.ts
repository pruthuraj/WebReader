import { create } from "zustand";

export type TtsStatus = "idle" | "playing" | "paused";

export interface TtsState {
  status: TtsStatus;
  speed: number;
  pitch: number;
  voiceId: string | null;
  language: string;
  autoPlayNext: boolean;
  sleepTimerSec: number | null;
  highlightSentenceIdx: number | null;
  setStatus: (status: TtsStatus) => void;
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setVoice: (id: string | null) => void;
  setLanguage: (lang: string) => void;
  setAutoPlayNext: (v: boolean) => void;
  setSleepTimer: (sec: number | null) => void;
  setHighlight: (idx: number | null) => void;
}

export const useTtsStore = create<TtsState>((set) => ({
  status: "idle",
  speed: 1.0,
  pitch: 1.0,
  voiceId: null,
  language: "en-US",
  autoPlayNext: false,
  sleepTimerSec: null,
  highlightSentenceIdx: null,
  setStatus: (status) => set({ status }),
  setSpeed: (speed) => set({ speed }),
  setPitch: (pitch) => set({ pitch }),
  setVoice: (voiceId) => set({ voiceId }),
  setLanguage: (language) => set({ language }),
  setAutoPlayNext: (autoPlayNext) => set({ autoPlayNext }),
  setSleepTimer: (sleepTimerSec) => set({ sleepTimerSec }),
  setHighlight: (highlightSentenceIdx) => set({ highlightSentenceIdx }),
}));
