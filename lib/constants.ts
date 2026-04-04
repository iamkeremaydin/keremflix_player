// Seek
export const SEEK_STEP_SMALL = 5;
export const SEEK_STEP_LARGE = 10;

// Volume
export const VOLUME_STEP = 0.05;

// Controls auto-hide delay in ms
export const CONTROLS_HIDE_DELAY = 3000;

// Default playback rates available in the speed selector
export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

// Supported video file extensions (native browser support)
export const SUPPORTED_VIDEO_EXTENSIONS = [
  "mp4",
  "webm",
  "ogg",
  "ogv",
  "mov",
  "m4v",
  "3gp",
  "avi",
] as const;

// Extensions that browsers can NOT play natively
export const UNSUPPORTED_NATIVE_EXTENSIONS = ["mkv", "flv", "wmv", "ts", "m2ts"] as const;

// Subtitle file extensions we can parse
export const SUPPORTED_SUBTITLE_EXTENSIONS = ["srt", "vtt"] as const;

/** Media types listed in the folder playlist (non-recursive, by file name). */
export const PLAYLIST_MEDIA_EXTENSIONS = ["mp3", "mp4", "m4a", "webm"] as const;

/** Stop scanning a folder after this many playable files to avoid UI freezes. */
export const MAX_PLAYLIST_SCAN_FILES = 500;

// Warning threshold for large files (in bytes, 4 GB)
export const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024 * 1024;

// Thumbnail extraction interval (every N seconds)
export const THUMBNAIL_INTERVAL = 10;

// Max thumbnails to generate
export const THUMBNAIL_MAX_COUNT = 100;
