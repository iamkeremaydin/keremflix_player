import { create } from "zustand";
import type { BufferedRange, PlayerError } from "@/lib/types";

interface PlayerStore {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  bufferedRanges: BufferedRange[];
  isLoading: boolean;
  hasEnded: boolean;
  error: PlayerError | null;
  fps: number;

  setPlaying: (playing: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setPlaybackRate: (r: number) => void;
  setBufferedRanges: (ranges: BufferedRange[]) => void;
  setIsLoading: (v: boolean) => void;
  setHasEnded: (v: boolean) => void;
  setError: (err: PlayerError | null) => void;
  setFps: (fps: number) => void;
  reset: () => void;
}

const initialState = {
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  bufferedRanges: [] as BufferedRange[],
  isLoading: false,
  hasEnded: false,
  error: null as PlayerError | null,
  fps: 24,
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,

  setPlaying: (playing) => set({ playing }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ muted }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setBufferedRanges: (bufferedRanges) => set({ bufferedRanges }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setHasEnded: (hasEnded) => set({ hasEnded }),
  setError: (error) => set({ error }),
  setFps: (fps) => set({ fps }),
  reset: () => set(initialState),
}));
