"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFileStore } from "@/store/file-store";
import { PlayerShell } from "@/components/player/PlayerShell";

export default function PlayerPage() {
  const router = useRouter();
  const blobUrl = useFileStore((s) => s.blobUrl);

  // If no file is loaded, redirect to home
  useEffect(() => {
    if (!blobUrl) {
      router.replace("/");
    }
  }, [blobUrl, router]);

  if (!blobUrl) return null;

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-black">
      <div className="relative w-full h-full">
        <PlayerShell />
      </div>

      {/* Back button */}
      <BackButton />
    </div>
  );
}

function BackButton() {
  const router = useRouter();
  const clearFile = useFileStore((s) => s.clearFile);

  const handleBack = () => {
    clearFile();
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all backdrop-blur-sm"
      title="Open another file"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      <span>Open file</span>
    </button>
  );
}
