"use client";

import { memo } from "react";
import { PlayPauseButton } from "./PlayPauseButton";
import { SeekBar } from "./SeekBar";
import { VolumeControl } from "./VolumeControl";
import { TimeDisplay } from "./TimeDisplay";
import { SpeedSelector } from "./SpeedSelector";
import { SubtitleButton } from "./SubtitleButton";
import { PipButton } from "./PipButton";
import { FullscreenButton } from "./FullscreenButton";
import { seekBy } from "@/modules/player/engine";
import { usePlaylistStore } from "@/store/playlist-store";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  toggleFullscreen: () => void;
  thumbnails?: Map<number, ImageBitmap>;
}

export const Controls = memo(function Controls({
  videoRef,
  toggleFullscreen,
  thumbnails,
}: Props) {
  const togglePlaylistPanel = usePlaylistStore((s) => s.togglePlaylistPanel);
  const playlistOpen = usePlaylistStore((s) => s.playlistPanelOpen);

  return (
    <div className="controls-bar absolute inset-x-0 bottom-0 z-20 px-4 pb-4 pt-2">
      {/* Seek bar row */}
      <div className="mb-2">
        <SeekBar videoRef={videoRef} thumbnails={thumbnails} />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-1">
        {/* Left group */}
        <PlayPauseButton videoRef={videoRef} />

        <button
          type="button"
          onClick={() => { if (videoRef.current) seekBy(videoRef.current, -10); }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Rewind 10 seconds"
          title="-10s"
        >
          <RewindIcon />
        </button>

        <button
          type="button"
          onClick={() => { if (videoRef.current) seekBy(videoRef.current, 10); }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Forward 10 seconds"
          title="+10s"
        >
          <ForwardIcon />
        </button>

        <VolumeControl videoRef={videoRef} />

        <div className="ml-2">
          <TimeDisplay />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right group */}
        <button
          type="button"
          onClick={togglePlaylistPanel}
          className={[
            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
            playlistOpen ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10",
          ].join(" ")}
          aria-expanded={playlistOpen}
          aria-controls="media-playlist-panel"
          title="Show or hide music playlist"
        >
          <span aria-hidden>🎵</span>
          Playlist
        </button>
        <SpeedSelector videoRef={videoRef} />
        <SubtitleButton videoRef={videoRef} />
        <PipButton videoRef={videoRef} />
        <FullscreenButton toggleFullscreen={toggleFullscreen} />
      </div>
    </div>
  );
});

function RewindIcon() {
  return (
    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
      <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
      <text x="9.2" y="14" fontSize="5.5" fill="white" fontWeight="bold" textAnchor="middle">10</text>
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
      <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
      <text x="14.8" y="14" fontSize="5.5" fill="white" fontWeight="bold" textAnchor="middle">10</text>
    </svg>
  );
}
