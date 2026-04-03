export interface CodecProbe {
  label: string;
  mime: string;
}

export interface CodecSupportResult {
  label: string;
  supported: "" | "maybe" | "probably";
}

export const CODEC_PROBES: CodecProbe[] = [
  { label: "H.264 (AVC)", mime: 'video/mp4; codecs="avc1.640028"' },
  { label: "H.265 (HEVC)", mime: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
  { label: "VP9", mime: 'video/webm; codecs="vp9"' },
  { label: "AV1", mime: 'video/mp4; codecs="av01.0.08M.08"' },
  { label: "VP8", mime: 'video/webm; codecs="vp8"' },
  { label: "Theora", mime: 'video/ogg; codecs="theora"' },
];

export const CONTAINER_SUPPORT: Record<string, string> = {
  mp4: "Universal — works in all modern browsers",
  webm: "Excellent — Chrome, Firefox, Edge (not Safari)",
  ogg: "Limited — Firefox/Chrome only",
  ogv: "Limited — Firefox/Chrome only",
  mov: "Safari/Chrome (macOS/iOS)",
  m4v: "Same as MP4",
  "3gp": "Mobile-focused, basic support",
  avi: "Limited native browser support",
  mkv: "NOT supported natively — use MP4 or WebM",
  flv: "NOT supported — legacy Flash format",
  wmv: "NOT supported — Windows Media Video",
};

// Human-readable suggestion when codec fails
export function getCodecSuggestion(extension: string): string {
  const map: Record<string, string> = {
    mkv: "Re-mux to MP4 using FFmpeg: ffmpeg -i input.mkv -c copy output.mp4",
    flv: "Convert to MP4: ffmpeg -i input.flv -c:v libx264 -c:a aac output.mp4",
    wmv: "Convert to MP4: ffmpeg -i input.wmv -c:v libx264 -c:a aac output.mp4",
    avi: "Convert to MP4: ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4",
  };
  return (
    map[extension] ??
    "Try converting to H.264/MP4 for maximum browser compatibility."
  );
}
