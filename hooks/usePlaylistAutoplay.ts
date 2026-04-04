"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useFileStore } from "@/store/file-store";
import { usePlaylistStore } from "@/store/playlist-store";
import type { LoadFileOptions } from "@/hooks/useFileLoader";

type LoadFile = (
  file: File,
  fileHandle?: FileSystemFileHandle,
  options?: LoadFileOptions
) => void;

/**
 * When playback ends, load the next file in the sorted playlist (if any).
 */
export function usePlaylistAutoplay(loadFile: LoadFile) {
  const hasEnded = usePlayerStore((s) => s.hasEnded);
  const handlingRef = useRef(false);

  useEffect(() => {
    if (!hasEnded) {
      handlingRef.current = false;
      return;
    }
    if (handlingRef.current) return;
    handlingRef.current = true;

    const name = useFileStore.getState().fileName;
    const items = usePlaylistStore.getState().items;
    const idx = items.findIndex((i) => i.name === name);
    if (idx < 0 || idx >= items.length - 1) {
      handlingRef.current = false;
      return;
    }

    const next = items[idx + 1];
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
  }, [hasEnded, loadFile]);
}
