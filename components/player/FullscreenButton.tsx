"use client";

import { memo } from "react";
import { useUIStore } from "@/store/ui-store";

interface Props {
  toggleFullscreen: () => void;
}

export const FullscreenButton = memo(function FullscreenButton({ toggleFullscreen }: Props) {
  const isFullscreen = useUIStore((s) => s.isFullscreen);

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
    </button>
  );
});

function EnterFullscreenIcon() {
  return (
    <svg className="w-5 h-5 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg className="w-5 h-5 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
    </svg>
  );
}
