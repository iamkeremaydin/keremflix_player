"use client";

import { memo, useRef, useState, useCallback } from "react";
import { usePlayerStore } from "@/store/player-store";
import { seekTo } from "@/modules/player/engine";

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  thumbnails?: Map<number, ImageBitmap>;
  /** Larger vertical hit area and thumb (e.g. bottom mini-player) */
  comfortable?: boolean;
}

export const SeekBar = memo(function SeekBar({ videoRef, thumbnails, comfortable }: Props) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const bufferedRanges = usePlayerStore((s) => s.bufferedRanges);

  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getTimeFromX = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      setHoverTime(getTimeFromX(e.clientX));
    },
    [getTimeFromX]
  );

  const onMouseLeave = useCallback(() => {
    setHoverX(null);
  }, []);

  const onSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      seekTo(video, parseFloat(e.target.value));
    },
    [videoRef]
  );

  const getHoverThumbnail = (): ImageBitmap | null => {
    if (!thumbnails || hoverX === null) return null;
    const interval = 10;
    const snapped = Math.round(hoverTime / interval) * interval;
    return thumbnails.get(snapped) ?? null;
  };

  const thumbnail = getHoverThumbnail();

  return (
    <div
      ref={trackRef}
      className={[
        "relative w-full flex items-center group",
        comfortable ? "h-12" : "h-5",
      ].join(" ")}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Track background */}
      <div
        className={[
          "absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-150 rounded-full bg-white/20 overflow-hidden",
          comfortable ? "h-2 group-hover:h-2.5" : "h-1 group-hover:h-1.5",
        ].join(" ")}
      >
        {/* Buffered ranges */}
        {bufferedRanges.map((range, i) => {
          const left = duration > 0 ? (range.start / duration) * 100 : 0;
          const width = duration > 0 ? ((range.end - range.start) / duration) * 100 : 0;
          return (
            <div
              key={i}
              className="absolute top-0 h-full bg-white/25 rounded-full"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hover indicator */}
      {hoverX !== null && (
        <div
          className="absolute top-0 bottom-0 w-px bg-white/40 pointer-events-none"
          style={{ left: hoverX }}
        />
      )}

      {/* Thumbnail preview */}
      {hoverX !== null && thumbnail && (
        <div
          className="seek-thumbnail"
          style={{ left: hoverX }}
        >
          <ThumbnailCanvas bitmap={thumbnail} />
        </div>
      )}

      {/* Tooltip */}
      {hoverX !== null && !thumbnail && (
        <div className="seek-tooltip" style={{ left: hoverX }}>
          {formatTime(hoverTime)}
        </div>
      )}
      {hoverX !== null && thumbnail && (
        <div
          className="absolute text-white/90 text-xs font-mono pointer-events-none"
          style={{
            left: hoverX,
            bottom: "calc(100% + 110px)",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Range input (invisible, handles interaction) */}
      <input
        type="range"
        min={0}
        max={duration || 100}
        step={0.1}
        value={currentTime}
        onChange={onSeek}
        className={[
          "seek-input absolute inset-0 z-10 m-0 h-full w-full cursor-pointer p-0",
          comfortable ? "seek-input-comfortable" : "opacity-0",
        ].join(" ")}
        aria-label="Seek"
      />
    </div>
  );
});

function ThumbnailCanvas({ bitmap }: { bitmap: ImageBitmap }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw bitmap on mount
  if (canvasRef.current) {
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) ctx.drawImage(bitmap, 0, 0, 160, 90);
  }

  return (
    <canvas
      ref={(el) => {
        if (el) {
          const ctx = el.getContext("2d");
          if (ctx) ctx.drawImage(bitmap, 0, 0, 160, 90);
        }
      }}
      width={160}
      height={90}
      className="w-full h-full"
    />
  );
}
