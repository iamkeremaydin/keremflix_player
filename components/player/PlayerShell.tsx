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
import { usePlayerVideoBinding } from "@/hooks/usePlayer";
import { useUIStore } from "@/store/ui-store";
import { usePlayerStore } from "@/store/player-store";
import { togglePlay } from "@/modules/player/engine";
import { THUMBNAIL_INTERVAL, THUMBNAIL_MAX_COUNT } from "@/lib/constants";
import { useFileStore } from "@/store/file-store";
import { BottomMiniPlayer } from "./BottomMiniPlayer";
import { HiddenPlaylistVideo } from "./HiddenPlaylistVideo";
import { MediaPlaylistPanel } from "./MediaPlaylistPanel";
import { SUPPORTED_VIDEO_EXTENSIONS } from "@/lib/constants";

export function PlayerShell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsVisible = useUIStore((s) => s.controlsVisible);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const error = usePlayerStore((s) => s.error);
  const blobUrl = useFileStore((s) => s.blobUrl);
  const extension = useFileStore((s) => s.extension);
  const playbackSource = useFileStore((s) => s.playbackSource);
  const duration = usePlayerStore((s) => s.duration);

  const [thumbnails, setThumbnails] = useState<Map<number, ImageBitmap>>(new Map());

  const { toggleFullscreen } = useFullscreen(containerRef);
  const { onMouseMove, onMouseLeave } = useControlsVisibility();

  usePlayerVideoBinding(videoRef);
  useKeyboard(videoRef, toggleFullscreen, playbackSource === "main");
  useWatchHistory(videoRef);

  // Double-click = fullscreen (theater only)
  const handleDoubleClick = useCallback(() => {
    if (playbackSource !== "main") return;
    void toggleFullscreen();
  }, [playbackSource, toggleFullscreen]);

  // Single click on video area = play/pause (theater only)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (playbackSource !== "main") return;
      if ((e.target as HTMLElement).closest(".controls-bar")) return;
      const video = videoRef.current;
      if (video) void togglePlay(video);
    },
    [playbackSource]
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

  // Generate thumbnails when file and duration are ready (theater only)
  useEffect(() => {
    if (playbackSource !== "main" || !blobUrl || duration <= 0) return;
    if (!SUPPORTED_VIDEO_EXTENSIONS.includes(extension as (typeof SUPPORTED_VIDEO_EXTENSIONS)[number])) {
      return;
    }

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
  }, [blobUrl, duration, extension, playbackSource]);

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
      {playbackSource === "main" ? <VideoSurface videoRef={videoRef} /> : null}

      <GradientOverlay />

      {!error && (
        <div className="controls-bar absolute inset-x-0 top-0 z-20 flex items-start px-4 pt-4 pointer-events-none">
          <FileInfo />
        </div>
      )}

      {!error && <ResumeModal videoRef={videoRef} />}

      <LoadingSpinner />

      <ErrorOverlay />

      {!error && playbackSource === "main" && (
        <Controls
          videoRef={videoRef}
          toggleFullscreen={toggleFullscreen}
          thumbnails={thumbnails.size > 0 ? thumbnails : undefined}
        />
      )}

      {!error && (
        <>
          <HiddenPlaylistVideo videoRef={videoRef} />
          <BottomMiniPlayer videoRef={videoRef} />
          <MediaPlaylistPanel playlistVideoRef={videoRef} />
        </>
      )}
    </div>
  );
}
