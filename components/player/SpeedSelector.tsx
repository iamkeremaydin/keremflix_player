"use client";

import { memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useUIStore } from "@/store/ui-store";
import { setPlaybackRate } from "@/modules/player/engine";
import { PLAYBACK_RATES } from "@/lib/constants";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const SpeedSelector = memo(function SpeedSelector({ videoRef }: Props) {
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const toggleOverlay = useUIStore((s) => s.toggleOverlay);

  const isOpen = activeOverlay === "speed";

  const select = (rate: number) => {
    // Write directly to the DOM element — the ratechange listener in usePlayerVideoBinding
    // will update the store. Use setActiveOverlay (not toggleOverlay) so the
    // mousedown-triggered close doesn't reopen the panel on the subsequent click.
    const video = videoRef.current;
    if (video) setPlaybackRate(video, rate);
    useUIStore.getState().setActiveOverlay("none");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => toggleOverlay("speed")}
        className={[
          "px-2.5 py-1 rounded text-xs font-semibold font-mono transition-colors focus:outline-none",
          isOpen
            ? "bg-white text-black"
            : "text-white/70 hover:text-white hover:bg-white/10",
        ].join(" ")}
        aria-label="Playback speed"
      >
        {playbackRate === 1 ? "1x" : `${playbackRate}x`}
      </button>

      {isOpen && (
        <div
          data-overlay
          className="overlay-panel absolute bottom-full right-0 mb-2 w-28 rounded-xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl z-50 py-1"
          // Stop mousedown from bubbling to the document-level closeOverlays handler
          // so the panel stays mounted until the click event fires on rate buttons.
          onMouseDown={(e) => e.stopPropagation()}
        >
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => select(rate)}
              className={[
                "w-full px-3 py-2 text-left text-sm font-mono transition-colors",
                rate === playbackRate
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {rate === 1 ? "Normal" : `${rate}x`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
