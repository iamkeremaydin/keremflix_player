"use client";

import { useCallback, type RefObject } from "react";
import { useFileLoader } from "@/hooks/useFileLoader";
import { useFileStore } from "@/store/file-store";
import { usePlayerStore } from "@/store/player-store";
import { usePlaylistStore } from "@/store/playlist-store";
import { resolveNextItem, resolvePrevItem } from "@/lib/playlist-order";
import { stripExtension } from "@/lib/media-metadata";
import { releaseSource } from "@/modules/player/source-manager";
import { PlayPauseButton } from "./PlayPauseButton";
import { SeekBar } from "./SeekBar";
import { VolumeControl } from "./VolumeControl";
import { TimeDisplay } from "./TimeDisplay";

const VIDEO_EXT = new Set(["mp4", "webm"]);

function ArtworkPlaceholder({ video }: { video: boolean }) {
  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-500"
      aria-hidden
    >
      {video ? <FilmIcon className="size-6" /> : <MusicIcon className="size-6" />}
    </div>
  );
}

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function BottomMiniPlayer({ videoRef }: Props) {
  const { loadFile } = useFileLoader();
  const clearFile = useFileStore((s) => s.clearFile);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const blobUrl = useFileStore((s) => s.blobUrl);
  const playbackSource = useFileStore((s) => s.playbackSource);
  const fileName = useFileStore((s) => s.fileName);
  const extension = useFileStore((s) => s.extension);
  const trackTitle = useFileStore((s) => s.trackTitle);
  const trackArtist = useFileStore((s) => s.trackArtist);
  const trackAlbum = useFileStore((s) => s.trackAlbum);
  const coverObjectUrl = useFileStore((s) => s.coverObjectUrl);

  const items = usePlaylistStore((s) => s.items);
  const order = usePlaylistStore((s) => s.order);
  const repeatMode = usePlaylistStore((s) => s.repeatMode);
  const shuffle = usePlaylistStore((s) => s.shuffle);
  const cycleRepeat = usePlaylistStore((s) => s.cycleRepeat);
  const toggleShuffle = usePlaylistStore((s) => s.toggleShuffle);

  const isVideo = VIDEO_EXT.has(extension);

  const primary = trackTitle?.trim() || stripExtension(fileName) || fileName;
  const secondary = [trackArtist?.trim(), trackAlbum?.trim()].filter(Boolean).join(" · ");

  const loadAdjacent = useCallback(
    async (direction: "next" | "prev") => {
      const nextItem =
        direction === "next"
          ? resolveNextItem(items, order, fileName, repeatMode)
          : resolvePrevItem(items, order, fileName, repeatMode);
      if (!nextItem) return;
      try {
        const file = await nextItem.handle.getFile();
        loadFile(file, nextItem.handle, { skipHistory: true, playbackSource: "playlist" });
      } catch (e) {
        usePlaylistStore.setState({
          errorMessage:
            e instanceof Error ? e.message : `Could not open the ${direction} track.`,
        });
      }
    },
    [items, order, fileName, repeatMode, loadFile]
  );

  const onDismissPlaylist = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    releaseSource();
    clearFile();
    resetPlayer();
  }, [videoRef, clearFile, resetPlayer]);

  if (playbackSource !== "playlist" || !blobUrl) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[40] border-t border-white/10 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
      role="region"
      aria-label="Playlist player"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex min-h-[3rem] items-center gap-2 md:gap-3">
          <div className="shrink-0">
            {coverObjectUrl ? (
              <img
                src={coverObjectUrl}
                alt=""
                className="size-12 rounded-md object-cover"
                width={48}
                height={48}
              />
            ) : (
              <ArtworkPlaceholder video={isVideo} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{primary}</p>
            <p className="truncate text-xs text-zinc-400">{secondary || "\u00a0"}</p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
            <button
              type="button"
              onClick={() => void loadAdjacent("prev")}
              className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
              aria-label="Previous track"
            >
              <PrevIcon />
            </button>
            <button
              type="button"
              onClick={toggleShuffle}
              className={[
                "rounded-full p-2 transition-colors hover:bg-white/10",
                shuffle ? "text-[var(--player-accent)]" : "text-white/70",
              ].join(" ")}
              aria-label={shuffle ? "Shuffle on" : "Shuffle off"}
              aria-pressed={shuffle}
            >
              <ShuffleIcon />
            </button>
            <PlayPauseButton videoRef={videoRef} />
            <button
              type="button"
              onClick={() => void loadAdjacent("next")}
              className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
              aria-label="Next track"
            >
              <NextIcon />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={[
                "rounded-full p-2 transition-colors hover:bg-white/10",
                repeatMode !== "off" ? "text-[var(--player-accent)]" : "text-white/70",
              ].join(" ")}
              aria-label={
                repeatMode === "off"
                  ? "Repeat off"
                  : repeatMode === "all"
                    ? "Repeat all"
                    : "Repeat one"
              }
            >
              {repeatMode === "one" ? <RepeatOneIcon /> : <RepeatAllIcon />}
            </button>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
            <TimeDisplay />
            <VolumeControl videoRef={videoRef} />
            <button
              type="button"
              onClick={onDismissPlaylist}
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close playlist player"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <SeekBar videoRef={videoRef} comfortable />
          </div>
          <div className="flex items-center justify-end gap-2 sm:hidden">
            <TimeDisplay />
            <VolumeControl videoRef={videoRef} />
            <button
              type="button"
              onClick={onDismissPlaylist}
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close playlist player"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg className="size-5 fill-current" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg className="size-5 fill-current" viewBox="0 0 24 24" aria-hidden>
      <path d="M16 18h2V6h-2v12zM6 6l8.5 6L6 18V6z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
      />
    </svg>
  );
}

function RepeatAllIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
      />
    </svg>
  );
}

function RepeatOneIcon() {
  return (
    <span className="relative inline-flex size-5 items-center justify-center" aria-hidden>
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
        />
      </svg>
      <span className="absolute text-[8px] font-bold leading-none">1</span>
    </span>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V7.5m17.25 12V7.5m0 0c0-.621-.504-1.125-1.125-1.125M20.625 7.5h-1.5C18.504 6.375 18 5.871 18 5.25m2.625 2.25V5.625c0-.621-.504-1.125-1.125-1.125H4.5A1.125 1.125 0 003.375 5.625v1.875M18 5.25A2.25 2.25 0 0015.75 3h-7.5A2.25 2.25 0 006 5.25m12 0v13.125M6 5.25v13.125M9 9.75h6M9 12h6M9 14.25h6"
      />
    </svg>
  );
}
