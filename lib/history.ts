import { clearAllFileHandles, deleteFileHandle } from "@/lib/file-handles";

const STORAGE_KEY = "keremflix:history";
const MAX_ENTRIES = 20;

/** Stable id for a local File — matches watch-history fingerprint shape. */
export function historyEntryId(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

export interface HistoryEntry {
  /** Unique fingerprint: name|size|lastModified */
  id: string;
  name: string;
  size: number;
  lastModified: number;
  extension: string;
  lastPlayedAt: number;
}

function read(): HistoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function addToHistory(file: File): void {
  const id = historyEntryId(file);
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const entry: HistoryEntry = {
    id,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    extension,
    lastPlayedAt: Date.now(),
  };

  // Remove existing entry for the same file, prepend new one, cap at MAX_ENTRIES
  const existing = read().filter((e) => e.id !== id);
  write([entry, ...existing].slice(0, MAX_ENTRIES));
}

export function getHistory(): HistoryEntry[] {
  return read();
}

export function removeFromHistory(id: string): void {
  write(read().filter((e) => e.id !== id));
  void deleteFileHandle(id);
}

export function clearHistory(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  void clearAllFileHandles();
}
