/**
 * Persists FileSystemFileHandle in IndexedDB so "Recently played" can reopen
 * the same local file (Chromium File System Access API). Standard <input type="file">
 * does not yield a storable handle — only showOpenFilePicker / drag handles do.
 */

import { createStore, get, set, del, clear } from "idb-keyval";

const DB_NAME = "keremflix:file-handles";
const STORE = "handles";
const DIR_STORE = "playlist-directory";

const fileHandleStore = createStore(DB_NAME, STORE);
const playlistDirectoryStore = createStore(DB_NAME, DIR_STORE);

/** Key for the persisted playlist root folder (single entry in `playlistDirectoryStore`). */
export const PLAYLIST_DIRECTORY_IDB_KEY = "keremflix:playlist-dir";

function devWarn(err: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn("[keremflix] IndexedDB file handle error:", err);
  }
}

export async function putFileHandle(
  id: string,
  handle: FileSystemFileHandle
): Promise<void> {
  try {
    await set(id, handle, fileHandleStore);
  } catch (e) {
    devWarn(e);
  }
}

export async function getFileHandle(id: string): Promise<FileSystemFileHandle | null> {
  try {
    const result = await get<FileSystemFileHandle>(id, fileHandleStore);
    return result ?? null;
  } catch (e) {
    devWarn(e);
    return null;
  }
}

export async function deleteFileHandle(id: string): Promise<void> {
  try {
    await del(id, fileHandleStore);
  } catch (e) {
    devWarn(e);
  }
}

export async function clearAllFileHandles(): Promise<void> {
  try {
    await clear(fileHandleStore);
  } catch (e) {
    devWarn(e);
  }
}

export async function putDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    await set(PLAYLIST_DIRECTORY_IDB_KEY, handle, playlistDirectoryStore);
  } catch (e) {
    devWarn(e);
  }
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const result = await get<FileSystemDirectoryHandle>(PLAYLIST_DIRECTORY_IDB_KEY, playlistDirectoryStore);
    return result ?? null;
  } catch (e) {
    devWarn(e);
    return null;
  }
}

export async function deleteDirectoryHandle(): Promise<void> {
  try {
    await del(PLAYLIST_DIRECTORY_IDB_KEY, playlistDirectoryStore);
  } catch (e) {
    devWarn(e);
  }
}

type WithDirPermission = FileSystemDirectoryHandle & {
  queryPermission?(d: { mode: "read" }): Promise<PermissionState>;
  requestPermission?(d: { mode: "read" }): Promise<PermissionState>;
};

/**
 * Ensures read access for a directory handle (Chromium). Call before enumerating files.
 */
export async function ensureDirectoryReadPermission(
  handle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  const h = handle as WithDirPermission;
  let perm: PermissionState = "granted";
  try {
    if (typeof h.queryPermission === "function") {
      perm = await h.queryPermission({ mode: "read" });
      if (perm !== "granted" && typeof h.requestPermission === "function") {
        perm = await h.requestPermission({ mode: "read" });
      }
    }
  } catch {
    return "denied";
  }
  return perm;
}
