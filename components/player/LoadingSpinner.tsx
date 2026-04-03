"use client";

import { memo } from "react";
import { usePlayerStore } from "@/store/player-store";

export const LoadingSpinner = memo(function LoadingSpinner() {
  const isLoading = usePlayerStore((s) => s.isLoading);
  const error = usePlayerStore((s) => s.error);

  if (!isLoading || error) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white spinner" />
    </div>
  );
});
