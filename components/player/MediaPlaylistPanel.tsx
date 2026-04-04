"use client";

import { useCallback, useEffect } from "react";
import {
  ensureDirectoryReadPermission,
  putDirectoryHandle,
} from "@/lib/file-handles";
import { useFileLoader } from "@/hooks/useFileLoader";
import { usePlaylistAutoplay } from "@/hooks/usePlaylistAutoplay";
import { useFileStore } from "@/store/file-store";
import { usePlaylistStore } from "@/store/playlist-store";

export function MediaPlaylistPanel() {
  const { loadFile } = useFileLoader();
  usePlaylistAutoplay(loadFile);

  const fileName = useFileStore((s) => s.fileName);
  const folderLabel = usePlaylistStore((s) => s.folderLabel);
  const items = usePlaylistStore((s) => s.items);
  const status = usePlaylistStore((s) => s.status);
  const errorMessage = usePlaylistStore((s) => s.errorMessage);
  const limitNotice = usePlaylistStore((s) => s.limitNotice);
  const playlistPanelOpen = usePlaylistStore((s) => s.playlistPanelOpen);
  const refreshFromHandle = usePlaylistStore((s) => s.refreshFromHandle);
  const hydrateFromStorage = usePlaylistStore((s) => s.hydrateFromStorage);
  const clearPlaylist = usePlaylistStore((s) => s.clearPlaylist);
  const resetError = usePlaylistStore((s) => s.resetError);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const onOpenFolder = useCallback(async () => {
    resetError();
    const win = typeof window !== "undefined" ? window : undefined;
    const pickDir = (
      win as (Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }) | undefined
    )?.showDirectoryPicker;
    if (!win || typeof pickDir !== "function") {
      usePlaylistStore.setState({
        status: "error",
        errorMessage:
          "Your browser does not support choosing a folder. Use a recent version of Chrome or Edge.",
      });
      return;
    }
    try {
      const dir = await pickDir();
      await putDirectoryHandle(dir);
      const perm = await ensureDirectoryReadPermission(dir);
      if (perm !== "granted") {
        usePlaylistStore.setState({
          status: "error",
          folderLabel: dir.name,
          items: [],
          limitNotice: null,
          errorMessage:
            perm === "denied"
              ? "Folder unavailable. Read access was denied. Try Open folder again and allow access."
              : "Folder unavailable. Could not verify read access for this folder.",
        });
        return;
      }
      await refreshFromHandle(dir);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      usePlaylistStore.setState({
        status: "error",
        items: [],
        limitNotice: null,
        errorMessage:
          e instanceof Error ? e.message : "Something went wrong opening the folder.",
      });
    }
  }, [refreshFromHandle, resetError]);

  const onPickTrack = useCallback(
    async (handle: FileSystemFileHandle) => {
      try {
        const file = await handle.getFile();
        loadFile(file, handle);
      } catch (e) {
        usePlaylistStore.setState({
          errorMessage:
            e instanceof Error ? e.message : "Could not open this file.",
        });
      }
    },
    [loadFile]
  );

  const onClearFolder = useCallback(() => {
    void clearPlaylist();
  }, [clearPlaylist]);

  return (
    <div
      id="media-playlist-panel"
      className={[
        "fixed inset-y-0 right-0 z-[35] flex h-full w-[min(360px,90vw)] flex-col",
        "border-l border-white/10 bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-md",
        "pointer-events-auto transition-transform duration-300 ease-out",
        playlistPanelOpen ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      role="complementary"
      aria-label="Media playlist"
      aria-hidden={!playlistPanelOpen}
    >
      <div className="shrink-0 border-b border-white/10 px-3 py-2">
        <p className="truncate text-sm font-medium" title={folderLabel || "Playlist"}>
          {folderLabel || "Playlist"}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          Use &quot;Playlist&quot; in the controls to show or hide this panel. Chrome / Edge can remember
          your folder.
        </p>
      </div>

      <div className="shrink-0 space-y-2 border-b border-white/10 px-3 py-2">
        <button
          type="button"
          onClick={() => void onOpenFolder()}
          className="w-full rounded-md bg-white/10 px-3 py-2 text-left text-sm transition-colors hover:bg-white/15"
        >
          Open folder
        </button>
        <button
          type="button"
          onClick={onClearFolder}
          className="w-full rounded-md px-3 py-1.5 text-left text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
        >
          Clear saved folder
        </button>
      </div>

      {errorMessage ? (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 text-xs text-amber-200/90">
          {errorMessage}
        </div>
      ) : null}

      {limitNotice ? (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 text-xs text-zinc-400">
          {limitNotice}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {status === "loading" && items.length === 0 ? (
          <p className="px-3 py-3 text-sm text-zinc-500">Loading…</p>
        ) : null}

        {items.length === 0 && status !== "loading" ? (
          <p className="px-3 py-3 text-sm text-zinc-500">
            No MP3 / MP4 / M4A / WebM files in this folder (top level only).
          </p>
        ) : null}

        <ul className="pb-4">
          {items.map((item) => {
            const active = item.name === fileName;
            return (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => void onPickTrack(item.handle)}
                  aria-current={active ? "true" : undefined}
                  className={[
                    "flex w-full items-center gap-3 border-b border-white/5 px-3 py-2.5 text-left transition-colors",
                    active
                      ? "bg-[var(--player-accent)]/20 border-l-4 border-l-[var(--player-accent)] pl-[calc(0.75rem-4px)] font-medium text-white"
                      : "cursor-pointer border-l-4 border-l-transparent hover:bg-white/5 text-zinc-200",
                  ].join(" ")}
                >
                  <div className="flex size-16 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-500">
                    media
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
