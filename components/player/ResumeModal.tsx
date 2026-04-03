"use client";

import { useEffect, useState } from "react";
import { useFileStore } from "@/store/file-store";
import { loadProgress, clearProgress } from "@/lib/watch-history";
import type { WatchProgress } from "@/lib/watch-history";
import { play, seekTo } from "@/modules/player/engine";

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function ResumeModal({ videoRef }: Props) {
  const file = useFileStore((s) => s.file);
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Check for saved progress once when the file is loaded
  useEffect(() => {
    if (!file) return;
    setDismissed(false);
    const saved = loadProgress(file);
    // Only show the modal if there's a meaningful saved position (> 3 s)
    setProgress(saved && saved.time > 3 ? saved : null);
  }, [file]);

  if (!progress || dismissed) return null;

  const handleResume = () => {
    const video = videoRef.current;
    setDismissed(true);
    if (!video) return;

    const target = progress.time;
    const startPlayback = () => {
      void play(video).catch(() => {
        /* Autoplay/policy or transient error — user can press play */
      });
    };

    if (Math.abs(video.currentTime - target) < 0.05) {
      startPlayback();
      return;
    }

    video.addEventListener(
      "seeked",
      () => {
        startPlayback();
      },
      { once: true }
    );
    seekTo(video, target);
  };

  const handleStartOver = () => {
    if (file) clearProgress(file);
    setDismissed(true);
  };

  const percent =
    progress.duration > 0
      ? Math.round((progress.time / progress.duration) * 100)
      : null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-28 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl"
        // Prevent mousedown from bubbling to PlayerShell's overlay-close handler
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Progress indicator */}
        <div className="flex flex-col gap-0.5 mr-1">
          <span className="text-white/50 text-xs">Continue watching</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-sm">
              {formatTime(progress.time)}
            </span>
            {percent !== null && (
              <span className="text-white/30 text-xs">({percent}%)</span>
            )}
          </div>
          {/* Mini progress bar */}
          <div className="w-32 h-0.5 rounded-full bg-white/20 mt-1">
            <div
              className="h-full rounded-full bg-red-600"
              style={{ width: `${percent ?? 0}%` }}
            />
          </div>
        </div>

        <div className="w-px h-8 bg-white/10" />

        <button
          type="button"
          onClick={handleResume}
          className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Resume
        </button>

        <button
          type="button"
          onClick={handleStartOver}
          className="px-3 py-1.5 rounded-full text-white/50 text-sm hover:text-white hover:bg-white/10 transition-colors"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
