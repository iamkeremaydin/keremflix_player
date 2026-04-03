"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { VideoSurface } from "./VideoSurface";
import { Controls } from "./Controls";
import { GradientOverlay } from "./GradientOverlay";
import { ErrorOverlay } from "./ErrorOverlay";
import { LoadingSpinner } from "./LoadingSpinner";
import { ResumeModal } from "./ResumeModal";
import { FileInfo } from "@/components/file-loader/FileInfo";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useControlsVisibility } from "@/hooks/useControlsVisibility";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useUIStore } from "@/store/ui-store";
import { usePlayerStore } from "@/store/player-store";
import { togglePlay } from "@/modules/player/engine";
import { THUMBNAIL_INTERVAL, THUMBNAIL_MAX_COUNT } from "@/lib/constants";
import { useFileStore } from "@/store/file-store";

export function PlayerShell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const controlsVisible = useUIStore((s) => s.controlsVisible);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const error = usePlayerStore((s) => s.error);
  const blobUrl = useFileStore((s) => s.blobUrl);
  const duration = usePlayerStore((s) => s.duration);

  const [thumbnails, setThumbnails] = useState<Map<number, ImageBitmap>>(new Map());

  const { toggleFullscreen } = useFullscreen(containerRef);
  const { onMouseMove, onMouseLeave } = useControlsVisibility();

  // stableVideoRef is shared by keyboard hook, controls, watch-history, and resume modal
  const stableVideoRef = useRef<HTMLVideoElement | null>(null);

  useKeyboard(stableVideoRef, toggleFullscreen);
  useWatchHistory(stableVideoRef);

  const handleVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    stableVideoRef.current = el;
  }, []);

  // Double-click = fullscreen
  const handleDoubleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  // Single click on video area = play/pause
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only trigger on the video surface itself, not controls
      if ((e.target as HTMLElement).closest(".controls-bar")) return;
      const video = videoElRef.current;
      if (video) togglePlay(video);
    },
    []
  );

  // Close overlays when clicking outside
  useEffect(() => {
    const closeOverlays = (e: MouseEvent) => {
      const ui = useUIStore.getState();
      if (ui.activeOverlay !== "none") {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-overlay]")) {
          useUIStore.getState().setActiveOverlay("none");
        }
      }
    };
    document.addEventListener("mousedown", closeOverlays);
    return () => document.removeEventListener("mousedown", closeOverlays);
  }, []);

  // Generate thumbnails when file and duration are ready
  useEffect(() => {
    if (!blobUrl || duration <= 0) return;

    const count = Math.min(
      Math.floor(duration / THUMBNAIL_INTERVAL),
      THUMBNAIL_MAX_COUNT
    );
    if (count === 0) return;

    let worker: Worker | null = null;
    const newMap = new Map<number, ImageBitmap>();

    try {
      worker = new Worker(new URL("@/workers/thumbnail.worker.ts", import.meta.url), {
        type: "module",
      });

      worker.onmessage = (e) => {
        const { type, timestamp, bitmap } = e.data;
        if (type === "frame") {
          newMap.set(Math.round(timestamp), bitmap);
          // Update state incrementally
          setThumbnails(new Map(newMap));
        } else if (type === "done") {
          worker?.terminate();
        }
      };

      worker.onerror = () => worker?.terminate();

      worker.postMessage({
        blobUrl,
        duration,
        count,
        width: 160,
        height: 90,
      });
    } catch {
      // Workers not available in this environment
    }

    return () => worker?.terminate();
  }, [blobUrl, duration]);

  return (
    <div
      ref={containerRef}
      className={[
        "relative w-full h-full bg-black overflow-hidden",
        !controlsVisible && !error && !isLoading ? "controls-hidden" : "",
      ].join(" ")}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Video */}
      <VideoSurface onVideoRef={handleVideoRef} />

      {/* Gradient overlays */}
      <GradientOverlay />

      {/* Top bar: file info (fades with controls) */}
      {!error && (
        <div className="controls-bar absolute inset-x-0 top-0 z-20 flex items-start px-4 pt-4 pointer-events-none">
          <FileInfo />
        </div>
      )}

      {/* Resume modal — shown once if saved progress exists for this file */}
      {!error && <ResumeModal videoRef={stableVideoRef} />}

      {/* Loading spinner */}
      <LoadingSpinner />

      {/* Error overlay */}
      <ErrorOverlay />

      {/* Controls */}
      {!error && (
        <Controls
          videoRef={stableVideoRef}
          toggleFullscreen={toggleFullscreen}
          thumbnails={thumbnails.size > 0 ? thumbnails : undefined}
        />
      )}
    </div>
  );
}
