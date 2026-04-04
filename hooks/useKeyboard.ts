"use client";

import { useEffect, useCallback } from "react";
import {
  togglePlay,
  seekBy,
  setVolume,
  setMuted,
  setPlaybackRate,
  stepFrame,
} from "@/modules/player/engine";
import { usePlayerStore } from "@/store/player-store";
import { useUIStore } from "@/store/ui-store";
import {
  SEEK_STEP_SMALL,
  SEEK_STEP_LARGE,
  VOLUME_STEP,
  PLAYBACK_RATES,
} from "@/lib/constants";

export function useKeyboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  toggleFullscreen: () => void,
  enableFullscreenHotkey = true
) {
  const show = useCallback(() => {
    useUIStore.getState().setControlsVisible(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Ignore when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const { volume, muted, playbackRate, fps } = usePlayerStore.getState();

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          show();
          togglePlay(video);
          break;

        case "ArrowLeft":
          e.preventDefault();
          show();
          seekBy(video, -SEEK_STEP_SMALL);
          break;

        case "ArrowRight":
          e.preventDefault();
          show();
          seekBy(video, SEEK_STEP_SMALL);
          break;

        case "j":
        case "J":
          e.preventDefault();
          show();
          seekBy(video, -SEEK_STEP_LARGE);
          break;

        case "l":
        case "L":
          e.preventDefault();
          show();
          seekBy(video, SEEK_STEP_LARGE);
          break;

        case "ArrowUp":
          e.preventDefault();
          setVolume(video, Math.min(1, volume + VOLUME_STEP));
          break;

        case "ArrowDown":
          e.preventDefault();
          setVolume(video, Math.max(0, volume - VOLUME_STEP));
          break;

        case "m":
        case "M":
          e.preventDefault();
          setMuted(video, !muted);
          break;

        case "f":
        case "F":
          if (!enableFullscreenHotkey) break;
          e.preventDefault();
          toggleFullscreen();
          break;

        case ".":
          e.preventDefault();
          stepFrame(video, fps, true);
          break;

        case ",":
          e.preventDefault();
          stepFrame(video, fps, false);
          break;

        case ">":
          e.preventDefault();
          {
            const idx = PLAYBACK_RATES.indexOf(playbackRate as typeof PLAYBACK_RATES[number]);
            const next = PLAYBACK_RATES[Math.min(PLAYBACK_RATES.length - 1, idx + 1)];
            setPlaybackRate(video, next);
          }
          break;

        case "<":
          e.preventDefault();
          {
            const idx = PLAYBACK_RATES.indexOf(playbackRate as typeof PLAYBACK_RATES[number]);
            const prev = PLAYBACK_RATES[Math.max(0, idx - 1)];
            setPlaybackRate(video, prev);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [videoRef, toggleFullscreen, show, enableFullscreenHotkey]);
}
