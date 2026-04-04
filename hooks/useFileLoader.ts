"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { validatePlaybackFile } from "@/modules/file-system/file-validator";
import { createSource } from "@/modules/player/source-manager";
import { useFileStore } from "@/store/file-store";
import { usePlayerStore } from "@/store/player-store";
import { addToHistory, historyEntryId, type HistoryEntry } from "@/lib/history";
import { deleteFileHandle, getFileHandle, putFileHandle } from "@/lib/file-handles";
import type { PlayerError } from "@/lib/types";

function isNotFoundError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "NotFoundError";
}

export function useFileLoader() {
  const router = useRouter();
  const setFile = useFileStore((s) => s.setFile);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loadError, setLoadError] = useState<PlayerError | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  const loadFile = useCallback(
    (file: File, fileHandle?: FileSystemFileHandle) => {
      setLoadError(null);
      setPermissionNotice(null);
      const result = validatePlaybackFile(file);

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
      setPermissionNotice(null);
      try {
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
        try {
          if (typeof h.queryPermission === "function") {
            perm = await h.queryPermission({ mode: "read" });
            if (perm === "prompt") {
              setPermissionNotice(
                "Allow read access in the browser dialog to reopen this file from Recently Played."
              );
              await new Promise<void>((r) =>
                requestAnimationFrame(() => requestAnimationFrame(() => r()))
              );
            }
            if (perm !== "granted" && typeof h.requestPermission === "function") {
              perm = await h.requestPermission({ mode: "read" });
            }
          }
        } finally {
          setPermissionNotice(null);
        }
        if (perm !== "granted") {
          setLoadError({
            type: "FILE_ACCESS_DENIED",
            message:
              perm === "denied"
                ? "Read access was denied. Click the item again and allow access, or open the file with Browse / drag-and-drop."
                : "Could not verify file access. Try opening the file again from your computer.",
          });
          return;
        }

        let file: File;
        try {
          file = await handle.getFile();
        } catch (e) {
          if (isNotFoundError(e)) {
            void deleteFileHandle(entry.id);
            setLoadError({
              type: "REOPEN_UNAVAILABLE",
              message:
                "That file can’t be found anymore (it may have been moved or deleted). Remove this item from Recently Played or choose it again from disk.",
            });
            return;
          }
          throw e;
        }

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
      } catch (e) {
        if (isNotFoundError(e)) {
          void deleteFileHandle(entry.id);
          setLoadError({
            type: "REOPEN_UNAVAILABLE",
            message:
              "That file can’t be found anymore (it may have been moved or deleted). Remove this item from Recently Played or open it again from disk.",
          });
          return;
        }
        setLoadError({
          type: "UNKNOWN",
          message: e instanceof Error ? e.message : "Something went wrong opening this file.",
        });
      }
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
    setLoadError,
    permissionNotice,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileInput,
    loadFile,
    openHistoryEntry,
  };
}
