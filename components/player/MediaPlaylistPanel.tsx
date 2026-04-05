"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  ensureDirectoryReadPermission,
  putDirectoryHandle,
} from "@/lib/file-handles";
import { useFileLoader } from "@/hooks/useFileLoader";
import { usePlaylistAutoplay } from "@/hooks/usePlaylistAutoplay";
import { useFileStore } from "@/store/file-store";
import { usePlaylistStore } from "@/store/playlist-store";
import { stripExtension } from "@/lib/media-metadata";

const HOVER_CLOSE_MS = 220;

const VIDEO_EXT = new Set(["mp4", "webm"]);

interface MediaPlaylistPanelProps {
  playlistVideoRef: RefObject<HTMLVideoElement | null>;
}

function SidebarVideoCanvas({
  videoRef,
  active,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobUrl = useFileStore((s) => s.blobUrl);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, videoRef, blobUrl]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      className="h-auto w-full max-h-48 rounded-lg border border-white/10 bg-black object-cover"
      aria-hidden
    />
  );
}

export function MediaPlaylistPanel({ playlistVideoRef }: MediaPlaylistPanelProps) {
  const { loadFile } = useFileLoader();
  usePlaylistAutoplay(loadFile, playlistVideoRef);

  const fileName = useFileStore((s) => s.fileName);
  const blobUrl = useFileStore((s) => s.blobUrl);
  const playbackSource = useFileStore((s) => s.playbackSource);
  const extension = useFileStore((s) => s.extension);
  const trackTitle = useFileStore((s) => s.trackTitle);
  const trackArtist = useFileStore((s) => s.trackArtist);
  const trackAlbum = useFileStore((s) => s.trackAlbum);
  const coverObjectUrl = useFileStore((s) => s.coverObjectUrl);

  const folderLabel = usePlaylistStore((s) => s.folderLabel);
  const items = usePlaylistStore((s) => s.items);
  const itemMetadata = usePlaylistStore((s) => s.itemMetadata);
  const status = usePlaylistStore((s) => s.status);
  const errorMessage = usePlaylistStore((s) => s.errorMessage);
  const limitNotice = usePlaylistStore((s) => s.limitNotice);
  const playlistPanelOpen = usePlaylistStore((s) => s.playlistPanelOpen);
  const setPlaylistPanelOpen = usePlaylistStore((s) => s.setPlaylistPanelOpen);
  const refreshFromHandle = usePlaylistStore((s) => s.refreshFromHandle);
  const hydrateFromStorage = usePlaylistStore((s) => s.hydrateFromStorage);
  const clearPlaylist = usePlaylistStore((s) => s.clearPlaylist);
  const resetError = usePlaylistStore((s) => s.resetError);

  const isVideo = VIDEO_EXT.has(extension);
  const showPlaylistNowPlaying =
    playbackSource === "playlist" && Boolean(blobUrl);

  const primary = trackTitle?.trim() || stripExtension(fileName) || fileName;
  const secondary = [trackArtist?.trim(), trackAlbum?.trim()].filter(Boolean).join(" · ");

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClosePanel = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setPlaylistPanelOpen(false);
    }, HOVER_CLOSE_MS);
  }, [clearCloseTimer, setPlaylistPanelOpen]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const onEdgeStripEnter = useCallback(() => {
    clearCloseTimer();
    setPlaylistPanelOpen(true);
  }, [clearCloseTimer, setPlaylistPanelOpen]);

  const onEdgeStripLeave = useCallback(() => {
    scheduleClosePanel();
  }, [scheduleClosePanel]);

  const onPanelPointerEnter = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const onPanelPointerLeave = useCallback(() => {
    scheduleClosePanel();
  }, [scheduleClosePanel]);

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
        loadFile(file, handle, { skipHistory: true, playbackSource: "playlist" });
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
    <>
      <div
        className="fixed top-4 bottom-0 right-4 z-[36] w-3 pointer-events-auto"
        aria-hidden
        onMouseEnter={onEdgeStripEnter}
        onMouseLeave={onEdgeStripLeave}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      />

      <div
        id="media-playlist-panel"
        className={[
          "fixed top-4 bottom-0 right-4 z-[35] flex w-[min(360px,calc(100vw-2rem))] max-w-[90vw] flex-col",
          "rounded-tl-xl border border-white/10 border-r-0 bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-md",
          "pointer-events-auto transition-transform duration-300 ease-out",
          playlistPanelOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]",
        ].join(" ")}
        style={{ paddingBottom: "max(0.5rem, var(--mini-player-height))" }}
        role="complementary"
        aria-label="Music and media playlist"
        aria-hidden={!playlistPanelOpen}
        onMouseEnter={onPanelPointerEnter}
        onMouseLeave={onPanelPointerLeave}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <p
            className="text-sm font-semibold leading-tight text-white"
            title={folderLabel || "Music playlist"}
          >
            <span className="mr-1.5" aria-hidden>
              🎵
            </span>
            {folderLabel || "Music playlist"}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300 text-pretty">
            <span aria-hidden>🎧</span> Hover this side or tap{" "}
            <span className="font-medium text-zinc-200">Playlist</span> in the bar. Chrome / Edge can
            remember your folder.
          </p>
        </div>

        <div className="shrink-0 space-y-2 border-b border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => void onOpenFolder()}
            className="w-full rounded-md bg-white/10 px-3 py-2.5 text-left text-sm text-zinc-100 transition-colors hover:bg-white/15"
          >
            <span aria-hidden>📁</span> Open folder
          </button>
          <button
            type="button"
            onClick={onClearFolder}
            className="w-full rounded-md px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            Clear saved folder
          </button>
        </div>

        {showPlaylistNowPlaying ? (
          <div className="shrink-0 space-y-3 border-b border-white/10 px-4 py-3">
            <p className="text-xs font-medium text-zinc-400">Now playing</p>
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/80">
              {isVideo && playlistPanelOpen ? (
                <SidebarVideoCanvas videoRef={playlistVideoRef} active />
              ) : coverObjectUrl ? (
                <img
                  src={coverObjectUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                  width={320}
                  height={180}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-zinc-900 text-4xl text-zinc-600">
                  {isVideo ? "🎬" : "🎶"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{primary}</p>
              <p className="truncate text-xs text-zinc-400">{secondary || "\u00a0"}</p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="shrink-0 border-b border-white/10 px-4 py-2.5 text-xs leading-relaxed text-amber-100/95">
            {errorMessage}
          </div>
        ) : null}

        {limitNotice ? (
          <div className="shrink-0 border-b border-white/10 px-4 py-2.5 text-xs leading-relaxed text-zinc-200">
            {limitNotice}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {status === "loading" && items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-300">Loading…</p>
          ) : null}

          {items.length === 0 && status !== "loading" ? (
            <p className="px-4 py-3 text-sm leading-relaxed text-zinc-300 text-pretty">
              No tracks yet — add MP3, MP4, M4A, or WebM files to the folder (top level only).
            </p>
          ) : null}

          <ul className="pb-4">
            {items.map((item) => {
              const active = item.name === fileName;
              const meta = itemMetadata[item.name];
              const titleLine = meta?.title?.trim() || stripExtension(item.name);
              const artistLine = meta?.artist?.trim();
              return (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => void onPickTrack(item.handle)}
                    aria-current={active ? "true" : undefined}
                    className={[
                      "flex w-full items-center gap-3 border-b border-white/5 px-4 py-2.5 text-left transition-colors",
                      active
                        ? "bg-[var(--player-accent)]/20 border-l-4 border-l-[var(--player-accent)] pl-[calc(1rem-4px)] text-white"
                        : "cursor-pointer border-l-4 border-l-transparent hover:bg-white/5 text-zinc-200",
                    ].join(" ")}
                  >
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-base text-zinc-400"
                      aria-hidden
                    >
                      🎶
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{titleLine}</span>
                      {artistLine ? (
                        <span className="block truncate text-xs text-zinc-400">{artistLine}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
