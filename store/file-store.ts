import { create } from "zustand";
import type { SubtitleTrack } from "@/lib/types";

interface FileStore {
  file: File | null;
  blobUrl: string | null;
  fileName: string;
  fileSize: number;
  extension: string;
  subtitleTracks: SubtitleTrack[];

  setFile: (file: File, blobUrl: string) => void;
  addSubtitleTrack: (track: SubtitleTrack) => void;
  setActiveSubtitleTrack: (id: string | null) => void;
  removeSubtitleTrack: (id: string) => void;
  clearFile: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  file: null,
  blobUrl: null,
  fileName: "",
  fileSize: 0,
  extension: "",
  subtitleTracks: [],

  setFile: (file, blobUrl) =>
    set({
      file,
      blobUrl,
      fileName: file.name,
      fileSize: file.size,
      extension: file.name.split(".").pop()?.toLowerCase() ?? "",
      subtitleTracks: [],
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

  clearFile: () =>
    set({
      file: null,
      blobUrl: null,
      fileName: "",
      fileSize: 0,
      extension: "",
      subtitleTracks: [],
    }),
}));
