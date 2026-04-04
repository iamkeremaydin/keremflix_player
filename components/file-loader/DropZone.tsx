"use client";

import { useRef, useCallback } from "react";
import { useFileLoader } from "@/hooks/useFileLoader";
import { usePlayerVideoBinding } from "@/hooks/usePlayer";
import { RecentlyPlayed } from "@/components/file-loader/RecentlyPlayed";
import { MediaPlaylistPanel } from "@/components/player/MediaPlaylistPanel";
import { usePlaylistStore } from "@/store/playlist-store";
import type { PlayerError } from "@/lib/types";
import { getCodecSuggestion } from "@/lib/format-support";

function ErrorBanner({ error }: { error: PlayerError }) {
  let title = "Cannot open file";
  let body = "";

  if (error.type === "UNSUPPORTED_FORMAT") {
    title = `Unsupported format: .${error.extension}`;
    body = getCodecSuggestion(error.extension);
  } else if (error.type === "CODEC_UNSUPPORTED") {
    title = `Codec not supported: ${error.codec}`;
    body = error.suggestion;
  } else if (error.type === "FILE_TOO_LARGE") {
    title = `File too large (${error.sizeMB} MB)`;
    body = "Files larger than 4 GB are not supported.";
  } else if (error.type === "DECODE_ERROR") {
    title = "Decode error";
    body = error.message;
  } else if (error.type === "REOPEN_UNAVAILABLE") {
    title = "Can't open from Recently Played";
    body = error.message;
  } else if (error.type === "FILE_ACCESS_DENIED") {
    title = "File access not granted";
    body = error.message;
  } else if (error.type === "UNKNOWN") {
    title = "Unknown error";
    body = error.message;
  }

  return (
    <div className="mt-6 max-w-md mx-auto rounded-xl border border-red-500/40 bg-red-950/30 px-5 py-4 text-left">
      <p className="text-red-400 font-semibold text-sm">{title}</p>
      {body && <p className="text-red-300/70 text-xs mt-1 leading-relaxed">{body}</p>}
    </div>
  );
}

export function DropZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const playlistVideoRef = useRef<HTMLVideoElement | null>(null);
  usePlayerVideoBinding(playlistVideoRef);
  const togglePlaylistPanel = usePlaylistStore((s) => s.togglePlaylistPanel);
  const playlistOpen = usePlaylistStore((s) => s.playlistPanelOpen);
  const {
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
  } = useFileLoader();

  const openPicker = useCallback(async () => {
    const w = window as Window & {
      showOpenFilePicker?(options: {
        multiple?: boolean;
        types?: { description?: string; accept: Record<string, string[]> }[];
      }): Promise<FileSystemFileHandle[]>;
    };
    if (typeof window !== "undefined" && typeof w.showOpenFilePicker === "function") {
      try {
        const [handle] = await w.showOpenFilePicker({
          types: [
            {
              description: "Video files",
              accept: {
                "video/*": [".mp4", ".webm", ".mov", ".mkv", ".avi", ".m4v"],
              },
            },
          ],
          multiple: false,
        });
        try {
          const file = await handle.getFile();
          loadFile(file, handle);
        } catch (inner) {
          const ie = inner as DOMException;
          if (ie?.name === "NotFoundError") {
            setLoadError({
              type: "REOPEN_UNAVAILABLE",
              message:
                "That file is no longer where the browser expected it (moved or deleted). Try Browse again or pick the file from its new location.",
            });
            return;
          }
          throw inner;
        }
      } catch (err) {
        const e = err as DOMException;
        if (e?.name === "AbortError") return;
        inputRef.current?.click();
      }
    } else {
      inputRef.current?.click();
    }
  }, [loadFile, setLoadError]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-black px-6 select-none"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <button
        type="button"
        onClick={togglePlaylistPanel}
        className={[
          "fixed top-4 right-4 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-sm transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          playlistOpen ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white",
        ].join(" ")}
        aria-expanded={playlistOpen}
        aria-controls="media-playlist-panel"
        title="Music folder playlist"
      >
        <span aria-hidden className="text-base leading-none">
          🎵
        </span>
        <span className="font-medium">Playlist</span>
      </button>

      {/* Logo */}
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tight text-white">
          kerem<span className="text-red-600">flix</span>
        </h1>
        <p className="text-white/30 text-sm text-center mt-1 tracking-widest uppercase">
          Local Video Player
        </p>
      </div>

      {/* Drop target */}
      <button
        type="button"
        onClick={() => void openPicker()}
        className={[
          "relative group w-full max-w-lg cursor-pointer rounded-2xl border-2 border-dashed",
          "px-8 py-16 text-center transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
          isDraggingOver
            ? "border-red-500 bg-red-950/20 scale-[1.02]"
            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/8",
        ].join(" ")}
        aria-label="Open video file"
      >
        {/* Drag overlay glow */}
        {isDraggingOver && (
          <div className="absolute inset-0 rounded-2xl bg-red-500/10 pointer-events-none" />
        )}

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <FilmIcon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-colors" />
        </div>

        <p className="text-xl font-semibold text-white/80">
          {isDraggingOver ? "Release to open" : "Drop a video file here"}
        </p>
        <p className="mt-2 text-sm text-white/40">
          or <span className="text-white/60 underline underline-offset-2">click to browse</span>
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["MP4", "WebM", "MOV", "MKV*", "AVI"].map((fmt) => (
            <span
              key={fmt}
              className={[
                "px-2.5 py-0.5 rounded-md text-xs font-mono",
                fmt.includes("*")
                  ? "bg-yellow-950/50 text-yellow-400/70 border border-yellow-500/20"
                  : "bg-white/10 text-white/50 border border-white/10",
              ].join(" ")}
            >
              {fmt}
            </span>
          ))}
        </div>
        {/* MKV note */}
        <p className="mt-3 text-xs text-white/20">* MKV requires re-mux to MP4</p>
      </button>

      {loadError && <ErrorBanner error={loadError} />}

      {permissionNotice && (
        <div className="mt-6 max-w-md mx-auto rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-center">
          <p className="text-white/80 text-sm">{permissionNotice}</p>
        </div>
      )}

      <RecentlyPlayed onEntryOpen={openHistoryEntry} />

      {/* Keyboard hints */}
      <div className="mt-10 flex items-center gap-6 text-white/20 text-xs">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-mono text-xs">Space</kbd> to pause</span>
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-mono text-xs">F</kbd> for fullscreen</span>
        <span>Arrows to seek</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onFileInput}
        aria-hidden="true"
      />

      {/* Fixed overlay — does not affect centered layout */}
      <MediaPlaylistPanel playlistVideoRef={playlistVideoRef} />
    </div>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V7.5m17.25 12V7.5m0 0c0-.621-.504-1.125-1.125-1.125M20.625 7.5h-1.5C18.504 6.375 18 5.871 18 5.25m2.625 2.25V5.625c0-.621-.504-1.125-1.125-1.125H4.5A1.125 1.125 0 0 0 3.375 5.625v1.875M18 5.25A2.25 2.25 0 0 0 15.75 3h-7.5A2.25 2.25 0 0 0 6 5.25m12 0v13.125M6 5.25v13.125M9 9.75h6M9 12h6M9 14.25h6"
      />
    </svg>
  );
}
