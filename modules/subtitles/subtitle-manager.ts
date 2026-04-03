import { readSubtitleFile, createSubtitleBlobUrl } from "./srt-parser";
import type { SubtitleTrack } from "@/lib/types";

let trackCounter = 0;

export async function loadSubtitleFile(file: File): Promise<SubtitleTrack> {
  const text = await readSubtitleFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isVtt = ext === "vtt";
  const blobUrl = createSubtitleBlobUrl(text, isVtt);

  const nameWithoutExt = file.name.replace(/\.(srt|vtt)$/i, "");
  const langMatch = nameWithoutExt.match(/[._-]([a-z]{2,3})$/i);
  const language = langMatch ? langMatch[1].toLowerCase() : "und";

  return {
    id: `track-${++trackCounter}`,
    label: nameWithoutExt,
    language,
    blobUrl,
    active: false,
  };
}

export function attachTrackToVideo(
  video: HTMLVideoElement,
  track: SubtitleTrack
): HTMLTrackElement {
  const el = document.createElement("track");
  el.kind = "subtitles";
  el.label = track.label;
  el.srclang = track.language;
  el.src = track.blobUrl;
  el.id = track.id;
  video.appendChild(el);
  return el;
}

export function setActiveTrack(
  video: HTMLVideoElement,
  trackId: string | null
): void {
  const tracks = video.textTracks;
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const el = video.querySelector<HTMLTrackElement>(`track[id="${t.label}"]`);
    if (el) {
      t.mode = el.id === trackId ? "showing" : "hidden";
    } else {
      t.mode = "hidden";
    }
  }
}
