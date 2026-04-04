import {
  SUPPORTED_VIDEO_EXTENSIONS,
  UNSUPPORTED_NATIVE_EXTENSIONS,
  LARGE_FILE_THRESHOLD,
  PLAYLIST_MEDIA_EXTENSIONS,
} from "@/lib/constants";
import type { PlayerError } from "@/lib/types";

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: PlayerError };

export function validateVideoFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (UNSUPPORTED_NATIVE_EXTENSIONS.includes(ext as never)) {
    return {
      ok: false,
      error: {
        type: "UNSUPPORTED_FORMAT",
        extension: ext,
      },
    };
  }

  if (
    !SUPPORTED_VIDEO_EXTENSIONS.includes(ext as never) &&
    !file.type.startsWith("video/")
  ) {
    return {
      ok: false,
      error: {
        type: "UNSUPPORTED_FORMAT",
        extension: ext,
      },
    };
  }

  if (file.size > LARGE_FILE_THRESHOLD) {
    return {
      ok: false,
      error: {
        type: "FILE_TOO_LARGE",
        sizeMB: Math.round(file.size / 1024 / 1024),
      },
    };
  }

  return { ok: true };
}

export function isSubtitleFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ext === "srt" || ext === "vtt";
}

export function isPlaylistMediaFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return PLAYLIST_MEDIA_EXTENSIONS.includes(ext as never);
}

/** Video or playlist audio/video: used when opening files for playback (incl. MP3). */
export function validatePlaybackFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (UNSUPPORTED_NATIVE_EXTENSIONS.includes(ext as never)) {
    return {
      ok: false,
      error: {
        type: "UNSUPPORTED_FORMAT",
        extension: ext,
      },
    };
  }

  if (file.size > LARGE_FILE_THRESHOLD) {
    return {
      ok: false,
      error: {
        type: "FILE_TOO_LARGE",
        sizeMB: Math.round(file.size / 1024 / 1024),
      },
    };
  }

  const canPlayVideo =
    SUPPORTED_VIDEO_EXTENSIONS.includes(ext as never) || file.type.startsWith("video/");
  const inPlaylist = PLAYLIST_MEDIA_EXTENSIONS.includes(ext as never);
  const canPlayAudio =
    inPlaylist &&
    (file.type.startsWith("audio/") ||
      file.type === "" ||
      ext === "mp3" ||
      ext === "m4a");

  if (!canPlayVideo && !canPlayAudio) {
    return {
      ok: false,
      error: {
        type: "UNSUPPORTED_FORMAT",
        extension: ext,
      },
    };
  }

  return { ok: true };
}
