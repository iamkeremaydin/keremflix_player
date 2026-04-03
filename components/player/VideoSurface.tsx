"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import { usePlayer } from "@/hooks/usePlayer";
import { useFileStore } from "@/store/file-store";
import { usePlayerStore } from "@/store/player-store";
import { useUIStore } from "@/store/ui-store";

/** Visible picture size inside the video element with object-fit: contain. */
function getDisplayedVideoSize(video: HTMLVideoElement): { w: number; h: number } {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const W = video.clientWidth;
  const H = video.clientHeight;
  if (vw <= 0 || vh <= 0 || W <= 0 || H <= 0) {
    return { w: Math.max(W, 1), h: Math.max(H, 1) };
  }
  const scale = Math.min(W / vw, H / vh);
  return { w: vw * scale, h: vh * scale };
}

function computeSubtitleBasePx(video: HTMLVideoElement): number {
  const { w, h } = getDisplayedVideoSize(video);
  const ref = Math.min(w, h);
  return Math.round(Math.max(12, Math.min(40, ref * 0.045)));
}

interface Props {
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}

export const VideoSurface = memo(function VideoSurface({ onVideoRef }: Props) {
  const videoRef = usePlayer();
  const blobUrl = useFileStore((s) => s.blobUrl);
  const subtitleTracks = useFileStore((s) => s.subtitleTracks);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const controlsVisible = useUIStore((s) => s.controlsVisible);
  const subtitleSize = useUIStore((s) => s.subtitleSize);

  useEffect(() => {
    onVideoRef?.(videoRef.current);
  }, [onVideoRef, videoRef]);

  // Sync volume/rate changes from store back to element (for keyboard control)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.volume - volume) > 0.01) video.volume = volume;
    video.muted = muted;
  }, [volume, muted, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.playbackRate !== playbackRate) video.playbackRate = playbackRate;
  }, [playbackRate, videoRef]);

  const updateSubtitleBasePx = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.setProperty("--subtitle-base-px", `${computeSubtitleBasePx(video)}px`);
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    updateSubtitleBasePx();

    const ro = new ResizeObserver(() => updateSubtitleBasePx());
    ro.observe(video);

    const onMetadata = () => updateSubtitleBasePx();
    video.addEventListener("loadedmetadata", onMetadata);

    return () => {
      ro.disconnect();
      video.removeEventListener("loadedmetadata", onMetadata);
    };
  }, [blobUrl, updateSubtitleBasePx, videoRef]);

  // Sync textTrack modes after React commits <track> elements to the DOM.
  // The `default` attribute is only honored during initial element creation, so
  // we must explicitly set `mode` on every subtitleTracks change. We use
  // requestAnimationFrame to ensure the new <track> nodes are fully committed
  // before we read video.textTracks.
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    // Controls visible → push subtitles up to 70% (30% from bottom) to clear
    // the control bar. Controls hidden → return to 85% (15% from bottom).
    const lineValue = controlsVisible ? 70 : 85;

    // Apply subtitle scale as a CSS custom property on the video element so that
    // the ::cue font-size rule can use it via calc().
    video.style.setProperty("--subtitle-scale", String(subtitleSize / 100));

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      for (let i = 0; i < video.textTracks.length; i++) {
        const tt = video.textTracks[i];
        const match = subtitleTracks.find((t) => t.id === tt.id);
        tt.mode = match?.active ? "showing" : "hidden";

        if (tt.cues) {
          for (let j = 0; j < tt.cues.length; j++) {
            const cue = tt.cues[j] as VTTCue;
            cue.snapToLines = false;
            cue.line = lineValue;
          }
        }
      }
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [subtitleTracks, controlsVisible, subtitleSize, videoRef]);

  if (!blobUrl) return null;

  return (
    <div className="video-stage w-full h-full min-h-0 min-w-0">
      <video
        ref={videoRef}
        src={blobUrl}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        {subtitleTracks.map((track) => (
          <track
            key={track.id}
            id={track.id}
            kind="subtitles"
            label={track.label}
            srcLang={track.language}
            src={track.blobUrl}
            default={track.active}
          />
        ))}
      </video>
    </div>
  );
});
