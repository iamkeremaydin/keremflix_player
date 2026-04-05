"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useFileStore } from "@/store/file-store";
import { usePlaylistStore } from "@/store/playlist-store";
import { resolveNextItem } from "@/lib/playlist-order";
import type { LoadFileOptions } from "@/hooks/useFileLoader";

type LoadFile = (
  file: File,
  fileHandle?: FileSystemFileHandle,
  options?: LoadFileOptions
) => void;

/**
 * When playlist playback ends, handle repeat-one / advance / repeat-all / stop.
 */
export function usePlaylistAutoplay(loadFile: LoadFile, videoRef: RefObject<HTMLVideoElement | null>) {
  const hasEnded = usePlayerStore((s) => s.hasEnded);
  const handlingRef = useRef(false);

  useEffect(() => {
    if (!hasEnded) {
      handlingRef.current = false;
      return;
    }
    if (handlingRef.current) return;
    handlingRef.current = true;

    const playbackSource = useFileStore.getState().playbackSource;
    if (playbackSource !== "playlist") {
      handlingRef.current = false;
      return;
    }

    const repeatMode = usePlaylistStore.getState().repeatMode;
    if (repeatMode === "one") {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        usePlayerStore.setState({ hasEnded: false });
        void video.play();
      }
      handlingRef.current = false;
      return;
    }

    const fileName = useFileStore.getState().fileName;
    const { items, order, repeatMode: rm } = usePlaylistStore.getState();
    const next = resolveNextItem(items, order, fileName, rm);

    if (!next) {
      usePlayerStore.setState({ hasEnded: false });
      handlingRef.current = false;
      return;
    }

    void (async () => {
      try {
        const file = await next.handle.getFile();
        loadFile(file, next.handle, { skipHistory: true, playbackSource: "playlist" });
      } catch (e) {
        usePlaylistStore.setState({
          status: "error",
          errorMessage:
            e instanceof Error ? e.message : "Could not open the next track in the playlist.",
        });
      } finally {
        handlingRef.current = false;
      }
    })();
  }, [hasEnded, loadFile, videoRef]);
}
