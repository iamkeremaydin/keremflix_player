"use client";

import { useCallback } from "react";
import { loadSubtitleFile } from "@/modules/subtitles/subtitle-manager";
import { useFileStore } from "@/store/file-store";
import { revokeObjectUrl } from "@/modules/file-system/file-loader";

export function useSubtitles(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const { addSubtitleTrack, setActiveSubtitleTrack, removeSubtitleTrack, subtitleTracks } =
    useFileStore();

  // Declare activate first so loadFile can reference it in its dependency array.
  const activate = useCallback(
    (id: string | null) => {
      setActiveSubtitleTrack(id);
      // The direct tt.mode assignment here is best-effort for already-loaded tracks.
      // For newly added tracks, the rAF-based useEffect in VideoSurface is the
      // authoritative DOM sync path (runs after React commits the <track> node).
      const video = videoRef.current;
      if (!video) return;
      for (let i = 0; i < video.textTracks.length; i++) {
        const tt = video.textTracks[i];
        tt.mode = tt.id === id ? "showing" : "hidden";
      }
    },
    [setActiveSubtitleTrack, videoRef]
  );

  const loadFile = useCallback(
    async (file: File) => {
      const track = await loadSubtitleFile(file);
      addSubtitleTrack(track);

      // Auto-activate the first track through `activate` so the store flag is set
      // and the VideoSurface textTrack-sync useEffect can apply the mode after commit.
      if (subtitleTracks.length === 0) {
        activate(track.id);
      }
    },
    [addSubtitleTrack, activate, subtitleTracks.length]
  );

  const remove = useCallback(
    (id: string) => {
      const track = subtitleTracks.find((t) => t.id === id);
      if (track) {
        revokeObjectUrl(track.blobUrl);
        removeSubtitleTrack(id);
      }
    },
    [subtitleTracks, removeSubtitleTrack]
  );

  return { loadFile, activate, remove };
}
