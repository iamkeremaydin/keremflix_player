import {
  SUPPORTED_VIDEO_EXTENSIONS,
  UNSUPPORTED_NATIVE_EXTENSIONS,
  LARGE_FILE_THRESHOLD,
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
