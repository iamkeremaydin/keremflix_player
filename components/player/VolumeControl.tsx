"use client";

import { memo, useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { setVolume as engineSetVolume, setMuted as engineSetMuted } from "@/modules/player/engine";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const VolumeControl = memo(function VolumeControl({ videoRef }: Props) {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const [expanded, setExpanded] = useState(false);

  const effectiveVolume = muted ? 0 : volume;

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    engineSetMuted(video, !muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    engineSetVolume(video, parseFloat(e.target.value));
  };

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        type="button"
        onClick={handleMuteToggle}
        className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <VolumeIcon level={effectiveVolume} />
      </button>

      <div
        className={[
          "overflow-hidden transition-all duration-200",
          expanded ? "w-20 opacity-100" : "w-0 opacity-0",
        ].join(" ")}
      >
        {/* Track visual */}
        <div className="relative h-1 rounded-full bg-white/20 w-20">
          <div
            className="absolute top-0 left-0 h-full bg-white rounded-full"
            style={{ width: `${effectiveVolume * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={effectiveVolume}
            onChange={handleVolumeChange}
            className="volume-input absolute inset-0 opacity-0 cursor-pointer w-full"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
});

function VolumeIcon({ level }: { level: number }) {
  if (level === 0) {
    return (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
      </svg>
    );
  }
  if (level < 0.5) {
    return (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}
