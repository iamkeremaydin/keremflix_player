"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useFileStore } from "@/store/file-store";
import { usePlayerStore } from "@/store/player-store";
import { togglePlay } from "@/modules/player/engine";

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function PlaylistMiniPlayer({ videoRef }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const blobUrl = useFileStore((s) => s.blobUrl);
  const playing = usePlayerStore((s) => s.playing);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const playbackRate = usePlayerStore((s) => s.playbackRate);

  const { toggleFullscreen } = useFullscreen(wrapperRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.volume - volume) > 0.01) video.volume = volume;
    video.muted = muted;
  }, [volume, muted, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.playbackRate !== playbackRate) video.playbackRate = playbackRate;
  }, [playbackRate, videoRef]);

  if (!blobUrl) return null;

  return (
    <div className="shrink-0 border-b border-white/10 px-4 py-3">
      <p className="mb-2 text-xs font-medium text-zinc-400">Now playing</p>
      <div
        ref={wrapperRef}
        className="overflow-hidden rounded-lg border border-white/10 bg-black/80"
      >
        <video
          ref={videoRef}
          src={blobUrl}
          className="max-h-40 w-full object-contain"
          autoPlay
          playsInline
          preload="auto"
          tabIndex={-1}
        />
        <div className="flex items-center gap-2 border-t border-white/10 bg-zinc-900/90 px-2 py-2">
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (v) void togglePlay(v);
            }}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            aria-label="Enlarge to fullscreen"
          >
            Enlarge
          </button>
          <span className="ml-auto font-mono text-[11px] text-zinc-400 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
