/**
 * Persists FileSystemFileHandle in IndexedDB so "Recently played" can reopen
 * the same local file (Chromium File System Access API). Standard <input type="file">
 * does not yield a storable handle — only showOpenFilePicker / drag handles do.
 */

const DB_NAME = "keremflix:file-handles";
const STORE = "handles";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export async function putFileHandle(
  id: string,
  handle: FileSystemFileHandle
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(handle, id);
    });
  } catch {
    // quota / private mode — ignore
  }
}

export async function getFileHandle(id: string): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      tx.onerror = () => reject(tx.error);
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => {
        resolve((req.result as FileSystemFileHandle | undefined) ?? null);
      };
    });
  } catch {
    return null;
  }
}

export async function deleteFileHandle(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).delete(id);
    });
  } catch {
    // ignore
  }
}

export async function clearAllFileHandles(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).clear();
    });
  } catch {
    // ignore
  }
}
