"use client";

import { useLayoutEffect, useRef, useCallback, type RefObject } from "react";
import { usePlayerStore } from "@/store/player-store";
import { getBufferedRanges } from "@/modules/player/engine";
import { classifyVideoError } from "@/modules/player/codec-detect";
import { useFileStore } from "@/store/file-store";

/**
 * Binds HTMLVideoElement events to the Zustand player store.
 * Pass the same ref you attach to the active &lt;video&gt; (main or playlist mini-player).
 */
export function usePlayerVideoBinding(videoRef: RefObject<HTMLVideoElement | null>) {
  const rvfcRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const frameTimeRef = useRef(0);

  const {
    setPlaying,
    setCurrentTime,
    setDuration,
    setBufferedRanges,
    setIsLoading,
    setHasEnded,
    setError,
    setFps,
  } = usePlayerStore();

  const extension = useFileStore((s) => s.extension);
  const blobUrl = useFileStore((s) => s.blobUrl);

  const syncBuffered = useCallback((video: HTMLVideoElement) => {
    setBufferedRanges(getBufferedRanges(video));
  }, [setBufferedRanges]);

  const startRVFC = useCallback(
    (video: HTMLVideoElement) => {
      if (!("requestVideoFrameCallback" in video)) return;

      const loop = (_: DOMHighResTimeStamp, meta: VideoFrameCallbackMetadata) => {
        setCurrentTime(meta.mediaTime);

        frameCountRef.current++;
        if (frameTimeRef.current === 0) {
          frameTimeRef.current = meta.presentationTime;
        }
        const elapsed = meta.presentationTime - frameTimeRef.current;
        if (elapsed > 1000 && frameCountRef.current > 5) {
          const fps = Math.round((frameCountRef.current * 1000) / elapsed);
          if (fps > 0 && fps <= 120) setFps(fps);
          frameCountRef.current = 0;
          frameTimeRef.current = meta.presentationTime;
        }

        rvfcRef.current = video.requestVideoFrameCallback(loop);
      };

      rvfcRef.current = video.requestVideoFrameCallback(loop);
    },
    [setCurrentTime, setFps]
  );

  const stopRVFC = useCallback((video: HTMLVideoElement) => {
    if (rvfcRef.current !== null && "cancelVideoFrameCallback" in video) {
      video.cancelVideoFrameCallback(rvfcRef.current);
      rvfcRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setError(null);
      const { playbackRate } = usePlayerStore.getState();
      if (playbackRate !== 1) video.playbackRate = playbackRate;
    };
    const onPlay = () => {
      setPlaying(true);
      setHasEnded(false);
      startRVFC(video);
    };
    const onPause = () => {
      setPlaying(false);
      stopRVFC(video);
    };
    const onTimeUpdate = () => {
      const hasRVFC = "requestVideoFrameCallback" in (video as HTMLVideoElement);
      if (!hasRVFC) {
        setCurrentTime((video as HTMLVideoElement).currentTime);
      }
    };
    const onProgress = () => syncBuffered(video);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => {
      setPlaying(false);
      setHasEnded(true);
      stopRVFC(video);
    };
    const onError = () => {
      if (video.error) {
        setError(classifyVideoError(video.error, extension));
      }
      setIsLoading(false);
    };
    const onVolumeChange = () => {
      usePlayerStore.setState({ volume: video.volume, muted: video.muted });
    };
    const onRateChange = () => {
      usePlayerStore.setState({ playbackRate: video.playbackRate });
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("progress", onProgress);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ratechange", onRateChange);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ratechange", onRateChange);
      stopRVFC(video);
    };
  }, [
    blobUrl,
    extension,
    videoRef,
    setPlaying,
    setCurrentTime,
    setDuration,
    setBufferedRanges,
    setIsLoading,
    setHasEnded,
    setError,
    syncBuffered,
    startRVFC,
    stopRVFC,
  ]);
}

