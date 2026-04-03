import { create } from "zustand";
import type { HistoryEntry } from "@/lib/history";
import { getHistory } from "@/lib/history";

interface HistoryStoreState {
  entries: HistoryEntry[];
  refresh: () => void;
}

export const useHistoryStore = create<HistoryStoreState>((set) => ({
  entries: [],
  refresh: () => set({ entries: getHistory() }),
}));
