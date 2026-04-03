"use client";

import { memo } from "react";
import { usePlayerStore } from "@/store/player-store";

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const TimeDisplay = memo(function TimeDisplay() {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);

  return (
    <div className="flex items-center gap-1 text-white/80 text-sm font-mono select-none whitespace-nowrap">
      <span>{formatTime(currentTime)}</span>
      <span className="text-white/30">/</span>
      <span className="text-white/50">{formatTime(duration)}</span>
    </div>
  );
});
