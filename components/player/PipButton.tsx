"use client";

import { memo, useState } from "react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const PipButton = memo(function PipButton({ videoRef }: Props) {
  const [supported] = useState(
    typeof document !== "undefined" && "pictureInPictureEnabled" in document
  );

  if (!supported) return null;

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not available for this element
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
      aria-label="Picture-in-Picture"
      title="Picture-in-Picture"
    >
      <PipIcon />
    </button>
  );
});

function PipIcon() {
  return (
    <svg className="w-5 h-5 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9A1.5 1.5 0 0 0 4.5 18H12v-4.5A1.5 1.5 0 0 1 13.5 12H21V7.5A1.5 1.5 0 0 0 19.5 6h-15A1.5 1.5 0 0 0 3 7.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 15h7.5v4.5h-7.5V15Z" />
    </svg>
  );
}
