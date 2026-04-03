"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getHistory,
  removeFromHistory,
  clearHistory,
  type HistoryEntry,
} from "@/lib/history";

interface RecentlyPlayedProps {
  onEntryOpen: (entry: HistoryEntry) => void | Promise<void>;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function RecentlyPlayed({ onEntryOpen }: RecentlyPlayedProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const handleRemove = useCallback((id: string) => {
    removeFromHistory(id);
    setEntries(getHistory());
  }, []);

  const handleClearConfirmed = useCallback(() => {
    clearHistory();
    setEntries([]);
    setShowClearConfirm(false);
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mt-8 relative">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
          Recently Played
        </h2>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-white/25 hover:text-white/60 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Horizontal scrollable card row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {entries.map((entry) => (
          <div key={entry.id} className="group relative shrink-0 w-44">
            <button
              type="button"
              onClick={() => void onEntryOpen(entry)}
              className="w-full rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-white/15 transition-all text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
            >
              <div className="p-3">
                {/* Extension badge */}
                <div className="inline-block px-1.5 py-0.5 rounded bg-red-600/80 text-white text-[10px] font-bold uppercase tracking-wide mb-2">
                  {entry.extension || "video"}
                </div>

                {/* File name */}
                <p
                  className="text-white text-xs font-medium leading-snug line-clamp-2 mb-1"
                  title={entry.name}
                >
                  {entry.name.replace(/\.[^.]+$/, "")}
                </p>

                {/* File size */}
                <p className="text-white/30 text-[10px] mb-2">
                  {formatFileSize(entry.size)}
                </p>

                <p className="text-white/35 text-[10px] leading-snug">
                  Click to open again
                </p>
              </div>

              <div className="px-3 pb-2 text-white/25 text-[10px]">
                {formatRelativeTime(entry.lastPlayedAt)}
              </div>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(entry.id);
              }}
              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 text-white/30 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 text-xs leading-none z-10"
              aria-label="Remove from history"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {showClearConfirm && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="recently-played-clear-title"
            aria-describedby="recently-played-clear-desc"
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="recently-played-clear-title"
              className="text-base font-semibold text-white mb-2"
            >
              Are you sure?
            </h3>
            <p
              id="recently-played-clear-desc"
              className="text-sm text-white/55 mb-6"
            >
              This removes every item from Recently Played and clears saved file
              access for reopening from this list.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleClearConfirmed}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
