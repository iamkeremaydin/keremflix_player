"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@/store/ui-store";
import { usePlayerStore } from "@/store/player-store";
import { CONTROLS_HIDE_DELAY } from "@/lib/constants";

export function useControlsVisibility() {
  const setControlsVisible = useUIStore((s) => s.setControlsVisible);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    const playing = usePlayerStore.getState().playing;
    if (playing) {
      timerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [setControlsVisible]);

  const onMouseMove = useCallback(() => {
    show();
  }, [show]);

  const onMouseLeave = useCallback(() => {
    const playing = usePlayerStore.getState().playing;
    if (playing) {
      timerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [setControlsVisible]);

  // Keep controls visible when paused; start auto-hide timer when play begins.
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prevState) => {
      if (!state.playing) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setControlsVisible(true);
      } else if (state.playing && !prevState.playing) {
        // Playback just started — show controls briefly then hide
        setControlsVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, CONTROLS_HIDE_DELAY);
      }
    });
    return unsub;
  }, [setControlsVisible]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { onMouseMove, onMouseLeave, show };
}
