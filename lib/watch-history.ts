const STORAGE_KEY_PREFIX = "keremflix:progress:";

export interface WatchProgress {
  time: number;
  duration: number;
  savedAt: number;
}

/**
 * Stable fingerprint for a local File.
 * Uses name + size + lastModified so the same physical file always maps
 * to the same key regardless of which folder it is opened from.
 */
export function getFingerprint(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

function storageKey(file: File): string {
  return STORAGE_KEY_PREFIX + getFingerprint(file);
}

export function saveProgress(file: File, time: number, duration: number): void {
  if (typeof localStorage === "undefined") return;
  // Don't save if at the very start or very end (within 3 s of either boundary)
  if (time < 3 || (duration > 0 && time > duration - 3)) return;
  try {
    const data: WatchProgress = { time, duration, savedAt: Date.now() };
    localStorage.setItem(storageKey(file), JSON.stringify(data));
  } catch {
    // localStorage quota exceeded or unavailable — silently ignore
  }
}

export function loadProgress(file: File): WatchProgress | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(file));
    if (!raw) return null;
    const data = JSON.parse(raw) as WatchProgress;
    // Discard stale entries older than 30 days
    if (Date.now() - data.savedAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(storageKey(file));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearProgress(file: File): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(storageKey(file));
  } catch {
    // ignore
  }
}
