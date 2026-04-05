import { create } from "zustand";
import type { SubtitleTrack } from "@/lib/types";

export type PlaybackSource = "main" | "playlist";

interface FileStore {
  file: File | null;
  blobUrl: string | null;
  fileName: string;
  fileSize: number;
  extension: string;
  subtitleTracks: SubtitleTrack[];
  playbackSource: PlaybackSource;

  trackTitle: string | null;
  trackArtist: string | null;
  trackAlbum: string | null;
  coverObjectUrl: string | null;

  setFile: (
    file: File,
    blobUrl: string,
    opts?: { playbackSource?: PlaybackSource }
  ) => void;
  setTrackDisplay: (partial: {
    trackTitle?: string | null;
    trackArtist?: string | null;
    trackAlbum?: string | null;
    coverObjectUrl?: string | null;
  }) => void;
  addSubtitleTrack: (track: SubtitleTrack) => void;
  setActiveSubtitleTrack: (id: string | null) => void;
  removeSubtitleTrack: (id: string) => void;
  clearFile: () => void;
}

function revokeCover(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export const useFileStore = create<FileStore>((set, get) => ({
  file: null,
  blobUrl: null,
  fileName: "",
  fileSize: 0,
  extension: "",
  subtitleTracks: [],
  playbackSource: "main",
  trackTitle: null,
  trackArtist: null,
  trackAlbum: null,
  coverObjectUrl: null,

  setFile: (file, blobUrl, opts) => {
    revokeCover(get().coverObjectUrl);
    set({
      file,
      blobUrl,
      fileName: file.name,
      fileSize: file.size,
      extension: file.name.split(".").pop()?.toLowerCase() ?? "",
      subtitleTracks: [],
      playbackSource: opts?.playbackSource ?? "main",
      trackTitle: null,
      trackArtist: null,
      trackAlbum: null,
      coverObjectUrl: null,
    });
  },

  setTrackDisplay: (partial) =>
    set((s) => {
      const nextCover = partial.coverObjectUrl !== undefined ? partial.coverObjectUrl : s.coverObjectUrl;
      if (
        partial.coverObjectUrl !== undefined &&
        partial.coverObjectUrl !== s.coverObjectUrl
      ) {
        revokeCover(s.coverObjectUrl);
      }
      return {
        trackTitle: partial.trackTitle !== undefined ? partial.trackTitle : s.trackTitle,
        trackArtist: partial.trackArtist !== undefined ? partial.trackArtist : s.trackArtist,
        trackAlbum: partial.trackAlbum !== undefined ? partial.trackAlbum : s.trackAlbum,
        coverObjectUrl: nextCover,
      };
    }),

  addSubtitleTrack: (track) =>
    set((state) => ({
      subtitleTracks: [...state.subtitleTracks, track],
    })),

  setActiveSubtitleTrack: (id) =>
    set((state) => ({
      subtitleTracks: state.subtitleTracks.map((t) => ({
        ...t,
        active: t.id === id,
      })),
    })),

  removeSubtitleTrack: (id) =>
    set((state) => ({
      subtitleTracks: state.subtitleTracks.filter((t) => t.id !== id),
    })),

  clearFile: () => {
    revokeCover(get().coverObjectUrl);
    set({
      file: null,
      blobUrl: null,
      fileName: "",
      fileSize: 0,
      extension: "",
      subtitleTracks: [],
      playbackSource: "main",
      trackTitle: null,
      trackArtist: null,
      trackAlbum: null,
      coverObjectUrl: null,
    });
  },
}));
