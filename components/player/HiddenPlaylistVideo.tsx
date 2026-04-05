"use client";

import { useEffect, type RefObject } from "react";
import { useFileStore } from "@/store/file-store";
import { usePlayerStore } from "@/store/player-store";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
}

/**
 * Single authoritative &lt;video&gt; for playlist playback — mounted outside the sliding panel.
 */
export function HiddenPlaylistVideo({ videoRef }: Props) {
  const blobUrl = useFileStore((s) => s.blobUrl);
  const playbackSource = useFileStore((s) => s.playbackSource);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const playbackRate = usePlayerStore((s) => s.playbackRate);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || playbackSource !== "playlist") return;
    if (Math.abs(video.volume - volume) > 0.01) video.volume = volume;
    video.muted = muted;
  }, [volume, muted, videoRef, playbackSource, blobUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || playbackSource !== "playlist") return;
    if (video.playbackRate !== playbackRate) video.playbackRate = playbackRate;
  }, [playbackRate, videoRef, playbackSource, blobUrl]);

  if (playbackSource !== "playlist" || !blobUrl) return null;

  return (
    <video
      ref={videoRef}
      src={blobUrl}
      className="fixed left-0 top-0 h-px w-px opacity-0 pointer-events-none"
      aria-hidden
      autoPlay
      playsInline
      preload="auto"
      tabIndex={-1}
    />
  );
}
