/**
 * Imperative video playback API.
 * All functions accept a video element ref and operate on it directly.
 * This layer is framework-agnostic — no React imports.
 */

export function play(video: HTMLVideoElement): Promise<void> {
  return video.play();
}

export function pause(video: HTMLVideoElement): void {
  video.pause();
}

export function togglePlay(video: HTMLVideoElement): Promise<void> | void {
  if (video.paused) {
    return video.play();
  }
  video.pause();
}

export function seekTo(video: HTMLVideoElement, time: number): void {
  const clamped = Math.max(0, Math.min(video.duration || 0, time));
  video.currentTime = clamped;
}

export function seekBy(video: HTMLVideoElement, delta: number): void {
  seekTo(video, video.currentTime + delta);
}

export function setVolume(video: HTMLVideoElement, volume: number): void {
  video.volume = Math.max(0, Math.min(1, volume));
  if (volume > 0) video.muted = false;
}

export function setMuted(video: HTMLVideoElement, muted: boolean): void {
  video.muted = muted;
}

export function setPlaybackRate(video: HTMLVideoElement, rate: number): void {
  video.playbackRate = rate;
}

export function stepFrame(video: HTMLVideoElement, fps: number, forward: boolean): void {
  if (!video.paused) video.pause();
  const frameDuration = 1 / fps;
  seekTo(video, video.currentTime + (forward ? frameDuration : -frameDuration));
}

export function getBufferedRanges(video: HTMLVideoElement) {
  const ranges: { start: number; end: number }[] = [];
  for (let i = 0; i < video.buffered.length; i++) {
    ranges.push({ start: video.buffered.start(i), end: video.buffered.end(i) });
  }
  return ranges;
}
