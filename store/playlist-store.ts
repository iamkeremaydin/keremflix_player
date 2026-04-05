import { create } from "zustand";
import {
  deleteDirectoryHandle,
  ensureDirectoryReadPermission,
  getDirectoryHandle,
} from "@/lib/file-handles";
import { isPlaylistMediaFile } from "@/modules/file-system/file-validator";
import { MAX_PLAYLIST_SCAN_FILES } from "@/lib/constants";
import {
  sequentialOrder,
  shuffleArray,
  shuffleOrderWithFirst,
  type RepeatMode,
} from "@/lib/playlist-order";
import { useFileStore } from "@/store/file-store";

export type PlaylistItem = { name: string; handle: FileSystemFileHandle };

export type PlaylistStatus = "idle" | "loading" | "ready" | "error";

export type { RepeatMode };

export type PlaylistItemMeta = { title: string | null; artist: string | null };

function isNotFoundError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "NotFoundError";
}

function playlistFolderErrorMessage(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === "NotFoundError") {
      return "Folder unavailable. It may have been moved or deleted. Choose a folder again or clear the saved folder.";
    }
    if (e.name === "SecurityError") {
      return "Folder unavailable. The browser blocked access to this folder.";
    }
    if (e.name === "InvalidStateError") {
      return "Folder unavailable. Try opening the folder again.";
    }
  }
  if (e instanceof Error && e.message) {
    return `Folder unavailable. ${e.message}`;
  }
  return "Folder unavailable. Try choosing the folder again.";
}

const emptyQueueState = {
  order: [] as number[],
  shuffle: false,
  repeatMode: "off" as RepeatMode,
  itemMetadata: {} as Record<string, PlaylistItemMeta>,
};

interface PlaylistStore {
  folderLabel: string;
  items: PlaylistItem[];
  status: PlaylistStatus;
  errorMessage: string | null;
  limitNotice: string | null;
  playlistPanelOpen: boolean;

  repeatMode: RepeatMode;
  shuffle: boolean;
  /** Permutation of indices into `items` for playback order */
  order: number[];
  itemMetadata: Record<string, PlaylistItemMeta>;

  setPlaylistPanelOpen: (open: boolean) => void;
  togglePlaylistPanel: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setItemMetadata: (fileName: string, meta: PlaylistItemMeta) => void;

  refreshFromHandle: (dir: FileSystemDirectoryHandle) => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  clearPlaylist: () => Promise<void>;
  resetError: () => void;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  folderLabel: "",
  items: [],
  status: "idle",
  errorMessage: null,
  limitNotice: null,
  playlistPanelOpen: false,
  ...emptyQueueState,

  setPlaylistPanelOpen: (open) => set({ playlistPanelOpen: open }),

  togglePlaylistPanel: () => set((s) => ({ playlistPanelOpen: !s.playlistPanelOpen })),

  cycleRepeat: () =>
    set((s) => ({
      repeatMode: s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
    })),

  toggleShuffle: () => {
    const { items, shuffle } = get();
    const n = items.length;
    if (n === 0) return;
    if (shuffle) {
      set({ shuffle: false, order: sequentialOrder(n) });
      return;
    }
    const { fileName, playbackSource } = useFileStore.getState();
    const curIdx =
      playbackSource === "playlist" ? items.findIndex((i) => i.name === fileName) : -1;
    const newOrder =
      curIdx >= 0 ? shuffleOrderWithFirst(curIdx, n) : shuffleArray(sequentialOrder(n));
    set({ shuffle: true, order: newOrder });
  },

  setItemMetadata: (fileName, meta) =>
    set((s) => ({
      itemMetadata: { ...s.itemMetadata, [fileName]: meta },
    })),

  resetError: () => set({ errorMessage: null }),

  refreshFromHandle: async (dir) => {
    set({ status: "loading", errorMessage: null, limitNotice: null, folderLabel: dir.name });
    try {
      const items: PlaylistItem[] = [];
      let limitReached = false;
      try {
        for await (const handle of dir.values()) {
          if (handle.kind !== "file") continue;
          if (!isPlaylistMediaFile(handle.name)) continue;
          items.push({ name: handle.name, handle });
          if (items.length >= MAX_PLAYLIST_SCAN_FILES) {
            limitReached = true;
            break;
          }
        }
      } catch (e) {
        set({
          items: [],
          status: "error",
          errorMessage: playlistFolderErrorMessage(e),
          limitNotice: null,
          order: [],
          shuffle: false,
          repeatMode: "off",
          itemMetadata: {},
        });
        return;
      }

      items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      set({
        items,
        status: "ready",
        errorMessage: null,
        limitNotice: limitReached
          ? `Showing the first ${MAX_PLAYLIST_SCAN_FILES} media files. Subfolders are not scanned.`
          : null,
        order: sequentialOrder(items.length),
        shuffle: false,
        repeatMode: "off",
        itemMetadata: {},
      });
    } catch (e) {
      set({
        items: [],
        status: "error",
        errorMessage: playlistFolderErrorMessage(e),
        limitNotice: null,
        order: [],
        shuffle: false,
        repeatMode: "off",
        itemMetadata: {},
      });
    }
  },

  hydrateFromStorage: async () => {
    set({ status: "loading", errorMessage: null, limitNotice: null });
    try {
      const handle = await getDirectoryHandle();
      if (!handle) {
        set({
          status: "idle",
          items: [],
          folderLabel: "",
          ...emptyQueueState,
        });
        return;
      }

      let perm: PermissionState;
      try {
        perm = await ensureDirectoryReadPermission(handle);
      } catch (e) {
        set({
          status: "error",
          folderLabel: handle.name,
          items: [],
          errorMessage: playlistFolderErrorMessage(e),
          ...emptyQueueState,
        });
        return;
      }

      if (perm !== "granted") {
        set({
          status: "error",
          folderLabel: handle.name,
          items: [],
          errorMessage:
            perm === "denied"
              ? "Folder unavailable. Read access was denied—use Open folder and allow access, or clear the saved folder."
              : "Folder unavailable. Could not verify folder access.",
          ...emptyQueueState,
        });
        return;
      }

      await get().refreshFromHandle(handle);
    } catch (e) {
      if (isNotFoundError(e)) {
        await deleteDirectoryHandle();
      }
      set({
        items: [],
        status: "error",
        folderLabel: "",
        errorMessage: playlistFolderErrorMessage(e),
        limitNotice: null,
        ...emptyQueueState,
      });
    }
  },

  clearPlaylist: async () => {
    await deleteDirectoryHandle();
    set({
      folderLabel: "",
      items: [],
      status: "idle",
      errorMessage: null,
      limitNotice: null,
      ...emptyQueueState,
    });
  },
}));
