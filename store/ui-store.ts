import { create } from "zustand";
import type { ActiveOverlay } from "@/lib/types";

interface UIStore {
  controlsVisible: boolean;
  isFullscreen: boolean;
  activeOverlay: ActiveOverlay;
  subtitleSize: number;

  setControlsVisible: (v: boolean) => void;
  setIsFullscreen: (v: boolean) => void;
  setActiveOverlay: (o: ActiveOverlay) => void;
  toggleOverlay: (o: ActiveOverlay) => void;
  setSubtitleSize: (size: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  controlsVisible: true,
  isFullscreen: false,
  activeOverlay: "none",
  subtitleSize: 100,

  setControlsVisible: (controlsVisible) => set({ controlsVisible }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setActiveOverlay: (activeOverlay) => set({ activeOverlay }),
  toggleOverlay: (o) =>
    set((state) => ({
      activeOverlay: state.activeOverlay === o ? "none" : o,
    })),
  setSubtitleSize: (subtitleSize) => set({ subtitleSize }),
}));
