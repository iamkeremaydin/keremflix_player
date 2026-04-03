"use client";

import { memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { togglePlay } from "@/modules/player/engine";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const PlayPauseButton = memo(function PlayPauseButton({ videoRef }: Props) {
  const playing = usePlayerStore((s) => s.playing);
  const hasEnded = usePlayerStore((s) => s.hasEnded);

  const handleClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (hasEnded) {
      video.currentTime = 0;
      video.play();
    } else {
      togglePlay(video);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
      aria-label={playing ? "Pause" : "Play"}
    >
      {playing ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
});

function PlayIcon() {
  return (
    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
