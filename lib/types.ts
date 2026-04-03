// ── Player ───────────────────────────────────────────────────────────────────

export interface BufferedRange {
  start: number;
  end: number;
}

export type PlayerError =
  | { type: "UNSUPPORTED_FORMAT"; extension: string }
  | { type: "CODEC_UNSUPPORTED"; codec: string; suggestion: string }
  | { type: "FILE_TOO_LARGE"; sizeMB: number }
  | { type: "DECODE_ERROR"; message: string }
  | { type: "REOPEN_UNAVAILABLE"; message: string }
  | { type: "FILE_ACCESS_DENIED"; message: string }
  | { type: "UNKNOWN"; message: string };

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  bufferedRanges: BufferedRange[];
  isLoading: boolean;
  hasEnded: boolean;
  error: PlayerError | null;
  fps: number;
}

// ── File ─────────────────────────────────────────────────────────────────────

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  blobUrl: string;
  active: boolean;
}

export interface FileEntry {
  file: File;
  blobUrl: string;
  fileName: string;
  fileSize: number;
  extension: string;
}

// ── UI ───────────────────────────────────────────────────────────────────────

export type ActiveOverlay = "none" | "subtitles" | "speed";

export interface UIState {
  controlsVisible: boolean;
  isFullscreen: boolean;
  activeOverlay: ActiveOverlay;
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

export interface ThumbnailFrame {
  timestamp: number;
  bitmap: ImageBitmap;
}
