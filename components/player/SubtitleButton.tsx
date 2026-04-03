"use client";

import { memo, useRef } from "react";
import { useFileStore } from "@/store/file-store";
import { useUIStore } from "@/store/ui-store";
import { useSubtitles } from "@/hooks/useSubtitles";

const SUBTITLE_SIZES = [50, 75, 100, 125, 150, 200] as const;

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const SubtitleButton = memo(function SubtitleButton({ videoRef }: Props) {
  const subtitleTracks = useFileStore((s) => s.subtitleTracks);
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const toggleOverlay = useUIStore((s) => s.toggleOverlay);
  const subtitleSize = useUIStore((s) => s.subtitleSize);
  const setSubtitleSize = useUIStore((s) => s.setSubtitleSize);
  const inputRef = useRef<HTMLInputElement>(null);
  const { loadFile, activate, remove } = useSubtitles(videoRef);

  const isOpen = activeOverlay === "subtitles";
  const activeTrack = subtitleTracks.find((t) => t.active);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadFile(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => toggleOverlay("subtitles")}
        className={[
          "p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
          activeTrack
            ? "text-white bg-white/15"
            : isOpen
            ? "bg-white/10 text-white"
            : "hover:bg-white/10 text-white/60 hover:text-white",
        ].join(" ")}
        aria-label="Subtitles"
        title="Subtitles"
      >
        <SubtitleIcon />
      </button>

      {isOpen && (
        <div
          data-overlay
          className="overlay-panel absolute bottom-full right-0 mb-2 w-56 rounded-xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl z-50 py-1"
          // Stop mousedown from bubbling to the document-level closeOverlays handler.
          // Without this, the overlay unmounts before the click on "Load .srt" fires,
          // silently swallowing the inputRef.current?.click() call.
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Subtitles
          </div>

          {/* Off option */}
          <button
            type="button"
            onClick={() => activate(null)}
            className={[
              "w-full px-3 py-2 text-left text-sm transition-colors",
              !activeTrack
                ? "bg-white/15 text-white font-semibold"
                : "text-white/60 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            Off
          </button>

          {/* Existing tracks */}
          {subtitleTracks.map((track) => (
            <div key={track.id} className="flex items-center group">
              <button
                type="button"
                onClick={() => activate(track.id)}
                className={[
                  "flex-1 px-3 py-2 text-left text-sm transition-colors truncate",
                  track.active
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/60 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {track.label}
              </button>
              <button
                type="button"
                onClick={() => remove(track.id)}
                className="pr-3 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove track"
              >
                ×
              </button>
            </div>
          ))}

          {/* Load SRT button */}
          <div className="border-t border-white/10 mt-1 pt-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full px-3 py-2 text-left text-sm text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              + Load .srt / .vtt file
            </button>
          </div>

          {/* Subtitle size selector */}
          <div className="border-t border-white/10 mt-1 pt-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Size
            </div>
            <div className="flex flex-wrap gap-1 px-3 pb-2">
              {SUBTITLE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSubtitleSize(size)}
                  className={[
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    subtitleSize === size
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/50 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {size}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".srt,.vtt"
        className="hidden"
        onChange={handleFileInput}
        aria-hidden="true"
      />
    </div>
  );
});

function SubtitleIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 8H5v-2h6v2zm8 4h-6v-2h6v2zm0-4h-4v-2h4v2z" />
    </svg>
  );
}
