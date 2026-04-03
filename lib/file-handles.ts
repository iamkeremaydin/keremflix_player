/**
 * Persists FileSystemFileHandle in IndexedDB so "Recently played" can reopen
 * the same local file (Chromium File System Access API). Standard <input type="file">
 * does not yield a storable handle — only showOpenFilePicker / drag handles do.
 */

import { createStore, get, set, del, clear } from "idb-keyval";

const DB_NAME = "keremflix:file-handles";
const STORE = "handles";

const fileHandleStore = createStore(DB_NAME, STORE);

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
