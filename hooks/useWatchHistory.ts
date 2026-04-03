"use client";

import { useEffect, useRef } from "react";
import { useFileStore } from "@/store/file-store";
import { saveProgress, loadProgress, clearProgress, type WatchProgress } from "@/lib/watch-history";

const AUTOSAVE_INTERVAL_MS = 5000;

/**
 * Auto-saves playback progress to localStorage while the video is playing
 * and on every pause event. Returns the saved progress for the current file
 * (used to show the resume modal).
 */
export function useWatchHistory(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const file = useFileStore((s) => s.file);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-save on a fixed interval while playing
  useEffect(() => {
    if (!file) return;

    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        const video = videoRef.current;
        if (video && !video.paused && !video.ended) {
          saveProgress(file, video.currentTime, video.duration);
        }
      }, AUTOSAVE_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onPlay = () => startInterval();
    const onPauseOrEnd = () => {
      const video = videoRef.current;
      if (video) saveProgress(file, video.currentTime, video.duration);
      stopInterval();
    };

    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPauseOrEnd);
    video.addEventListener("ended", onPauseOrEnd);

    // Start immediately if already playing (e.g., resume scenario)
    if (!video.paused) startInterval();

    return () => {
      // Save current position before the effect tears down (e.g. user navigates back,
      // file changes, or component unmounts). The video element is still in memory
      // at this point even though it may be leaving the DOM.
      const currentVideo = videoRef.current;
      if (currentVideo) saveProgress(file, currentVideo.currentTime, currentVideo.duration);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPauseOrEnd);
      video.removeEventListener("ended", onPauseOrEnd);
      stopInterval();
    };
  }, [file, videoRef]);

  // Also save on page unload/visibility change
  useEffect(() => {
    if (!file) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const video = videoRef.current;
        if (video) saveProgress(file, video.currentTime, video.duration);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [file, videoRef]);

  // Save on hard browser/tab close (beforeunload may not fire on mobile, but covers desktop)
  useEffect(() => {
    if (!file) return;
    const onBeforeUnload = () => {
      const video = videoRef.current;
      if (video) saveProgress(file, video.currentTime, video.duration);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [file, videoRef]);

  return {
    getSavedProgress: (): WatchProgress | null => (file ? loadProgress(file) : null),
    clearSavedProgress: () => { if (file) clearProgress(file); },
  };
}
