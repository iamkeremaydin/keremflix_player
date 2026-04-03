"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { validateVideoFile } from "@/modules/file-system/file-validator";
import { createSource } from "@/modules/player/source-manager";
import { useFileStore } from "@/store/file-store";
import { usePlayerStore } from "@/store/player-store";
import { addToHistory, historyEntryId, type HistoryEntry } from "@/lib/history";
import { deleteFileHandle, getFileHandle, putFileHandle } from "@/lib/file-handles";
import type { PlayerError } from "@/lib/types";

export function useFileLoader() {
  const router = useRouter();
  const setFile = useFileStore((s) => s.setFile);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loadError, setLoadError] = useState<PlayerError | null>(null);

  const loadFile = useCallback(
    (file: File, fileHandle?: FileSystemFileHandle) => {
      setLoadError(null);
      const result = validateVideoFile(file);

      if (!result.ok) {
        setLoadError(result.error);
        return;
      }

      resetPlayer();
      const blobUrl = createSource(file);
      setFile(file, blobUrl);
      addToHistory(file);
      if (fileHandle) {
        void putFileHandle(historyEntryId(file), fileHandle);
      }
      router.push("/player");
    },
    [router, setFile, resetPlayer]
  );

  const openHistoryEntry = useCallback(
    async (entry: HistoryEntry) => {
      setLoadError(null);
      const handle = await getFileHandle(entry.id);
      if (!handle) {
        setLoadError({
          type: "REOPEN_UNAVAILABLE",
          message:
            "No saved file access for this entry. Use Browse or drag-and-drop once (Chrome / Edge save access so you can click here next time). Safari and Firefox can't store file handles from the file picker yet.",
        });
        return;
      }

      // TS lib.dom may omit File System Access permission APIs (Chromium).
      const h = handle as FileSystemFileHandle & {
        queryPermission?(d: { mode: "read" }): Promise<PermissionState>;
        requestPermission?(d: { mode: "read" }): Promise<PermissionState>;
      };
      let perm: PermissionState = "granted";
      if (typeof h.queryPermission === "function") {
        perm = await h.queryPermission({ mode: "read" });
        if (perm !== "granted" && typeof h.requestPermission === "function") {
          perm = await h.requestPermission({ mode: "read" });
        }
      }
      if (perm !== "granted") {
        return;
      }

      const file = await handle.getFile();
      if (
        file.name !== entry.name ||
        file.size !== entry.size ||
        file.lastModified !== entry.lastModified
      ) {
        void deleteFileHandle(entry.id);
        setLoadError({
          type: "REOPEN_UNAVAILABLE",
          message:
            "The file on disk changed. Remove this card and open the video again from your computer.",
        });
        return;
      }

      loadFile(file, handle);
    },
    [loadFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;

      let fileHandle: FileSystemFileHandle | undefined;
      const item = e.dataTransfer.items[0];
      if (item?.kind === "file" && "getAsFileSystemHandle" in item) {
        try {
          const h = await (
            item as DataTransferItem & {
              getAsFileSystemHandle(): Promise<FileSystemHandle | null>;
            }
          ).getAsFileSystemHandle();
          if (h && h.kind === "file") {
            fileHandle = h as FileSystemFileHandle;
          }
        } catch {
          // non-Chromium or restricted drop — still play from File
        }
      }

      loadFile(file, fileHandle);
    },
    [loadFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  return {
    isDraggingOver,
    loadError,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileInput,
    loadFile,
    openHistoryEntry,
  };
}
