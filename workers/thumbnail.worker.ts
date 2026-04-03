/**
 * Web Worker: extract thumbnail frames from a video file.
 *
 * Receives: { blobUrl: string; duration: number; count: number; width: number; height: number }
 * Posts back: { timestamp: number; bitmap: ImageBitmap } for each frame
 * Posts 'done' when finished.
 */

interface ThumbnailRequest {
  blobUrl: string;
  duration: number;
  count: number;
  width: number;
  height: number;
}

self.onmessage = async (e: MessageEvent<ThumbnailRequest>) => {
  const { blobUrl, duration, count, width, height } = e.data;

  const video = document.createElement("video") as HTMLVideoElement;
  video.src = blobUrl;
  video.muted = true;
  video.preload = "metadata";
  video.crossOrigin = "anonymous";

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    self.postMessage({ type: "error", message: "Could not get canvas context" });
    return;
  }

  const interval = duration / count;

  for (let i = 0; i < count; i++) {
    const timestamp = i * interval;
    video.currentTime = timestamp;

    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    ctx.drawImage(video, 0, 0, width, height);
    const bitmap = await createImageBitmap(canvas);

    self.postMessage({ type: "frame", timestamp, bitmap }, { transfer: [bitmap] });
  }

  self.postMessage({ type: "done" });
};

export {};
