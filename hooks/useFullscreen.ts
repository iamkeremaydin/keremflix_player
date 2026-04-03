"use client";

import { useCallback, useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export function useFullscreen(containerRef: React.RefObject<HTMLElement | null>) {
  const setIsFullscreen = useUIStore((s) => s.setIsFullscreen);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [setIsFullscreen]);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    }
  }, [containerRef]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  return { toggleFullscreen, enterFullscreen, exitFullscreen };
}
