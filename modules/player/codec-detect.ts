import { CODEC_PROBES, getCodecSuggestion } from "@/lib/format-support";
import type { PlayerError } from "@/lib/types";

export function detectCodecSupport() {
  if (typeof document === "undefined") return [];
  const video = document.createElement("video");
  return CODEC_PROBES.map(({ label, mime }) => ({
    label,
    supported: video.canPlayType(mime) as "" | "maybe" | "probably",
  }));
}

export function classifyVideoError(
  mediaError: MediaError,
  extension: string
): PlayerError {
  switch (mediaError.code) {
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return {
        type: "CODEC_UNSUPPORTED",
        codec: extension.toUpperCase(),
        suggestion: getCodecSuggestion(extension),
      };
    case MediaError.MEDIA_ERR_DECODE:
      return {
        type: "DECODE_ERROR",
        message: "The file appears to be corrupt or uses an unsupported profile.",
      };
    case MediaError.MEDIA_ERR_NETWORK:
      return {
        type: "UNKNOWN",
        message: "A network error occurred while reading the file.",
      };
    case MediaError.MEDIA_ERR_ABORTED:
      return {
        type: "UNKNOWN",
        message: "Playback was aborted.",
      };
    default:
      return {
        type: "UNKNOWN",
        message: mediaError.message || "An unknown error occurred.",
      };
  }
}
