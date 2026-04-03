"use client";

import { memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useFileStore } from "@/store/file-store";
import { releaseSource } from "@/modules/player/source-manager";
import { useRouter } from "next/navigation";
import type { PlayerError } from "@/lib/types";

function getErrorDetails(error: PlayerError, extension: string) {
  switch (error.type) {
    case "UNSUPPORTED_FORMAT":
      return {
        title: `Unsupported Format: .${error.extension}`,
        body: `Your browser cannot play .${error.extension} files natively.`,
        suggestion:
          extension === "mkv"
            ? "Re-mux to MP4 with FFmpeg: ffmpeg -i input.mkv -c copy output.mp4"
            : "Convert to H.264/MP4 for maximum compatibility.",
      };
    case "CODEC_UNSUPPORTED":
      return {
        title: `Codec Not Supported: ${error.codec}`,
        body: "The video codec in this file is not supported by your browser.",
        suggestion: error.suggestion,
      };
    case "DECODE_ERROR":
      return {
        title: "Decode Error",
        body: error.message,
        suggestion: "The file may be corrupt. Try re-encoding it.",
      };
    case "FILE_TOO_LARGE":
      return {
        title: `File Too Large (${error.sizeMB} MB)`,
        body: "Files over 4 GB may not be supported.",
        suggestion: "Try splitting the file or using a desktop player.",
      };
    case "REOPEN_UNAVAILABLE":
      return {
        title: "Can't open from history",
        body: error.message,
        suggestion: "",
      };
    case "UNKNOWN":
      return {
        title: "Playback Error",
        body: error.message,
        suggestion: "Try a different file or browser.",
      };
  }
}

export const ErrorOverlay = memo(function ErrorOverlay() {
  const error = usePlayerStore((s) => s.error);
  const extension = useFileStore((s) => s.extension);
  const clearFile = useFileStore((s) => s.clearFile);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const router = useRouter();

  if (!error) return null;

  const { title, body, suggestion } = getErrorDetails(error, extension);

  const handleGoBack = () => {
    releaseSource();
    clearFile();
    resetPlayer();
    router.push("/");
  };

  return (
    <div className="error-overlay absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 p-8">
      <div className="w-full max-w-md text-center">
        {/* Error icon */}
        <div className="mb-5 flex justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-red-500/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/60 text-sm mb-4">{body}</p>

        {suggestion && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6 text-left">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Suggestion</p>
            <p className="text-white/70 text-sm font-mono leading-relaxed">{suggestion}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoBack}
          className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
        >
          Open another file
        </button>
      </div>
    </div>
  );
});
