export type RepeatMode = "off" | "all" | "one";

export function sequentialOrder(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function shuffleArray(indices: number[]): number[] {
  const a = [...indices];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Current item stays first; the rest are shuffled. */
export function shuffleOrderWithFirst(firstIdx: number, n: number): number[] {
  if (n <= 0) return [];
  const rest = sequentialOrder(n).filter((i) => i !== firstIdx);
  return [firstIdx, ...shuffleArray(rest)];
}

export function healOrder(itemsLen: number, order: number[]): number[] {
  if (itemsLen === 0) return [];
  if (order.length !== itemsLen) return sequentialOrder(itemsLen);
  const set = new Set(order);
  if (set.size !== itemsLen) return sequentialOrder(itemsLen);
  for (let i = 0; i < itemsLen; i++) {
    if (!set.has(i)) return sequentialOrder(itemsLen);
  }
  return order;
}

export function resolveNextItem<T extends { name: string }>(
  items: T[],
  order: number[],
  fileName: string,
  repeatMode: RepeatMode
): T | null {
  if (items.length === 0) return null;
  const ord = healOrder(items.length, order);
  const n = items.length;
  const curIdx = items.findIndex((i) => i.name === fileName);
  const pos = curIdx >= 0 ? ord.indexOf(curIdx) : -1;

  if (pos === -1) {
    return items[ord[0]] ?? null;
  }
  if (pos < n - 1) {
    return items[ord[pos + 1]] ?? null;
  }
  if (repeatMode === "all") {
    return items[ord[0]] ?? null;
  }
  return null;
}

export function resolvePrevItem<T extends { name: string }>(
  items: T[],
  order: number[],
  fileName: string,
  repeatMode: RepeatMode
): T | null {
  if (items.length === 0) return null;
  const ord = healOrder(items.length, order);
  const n = items.length;
  const curIdx = items.findIndex((i) => i.name === fileName);
  const pos = curIdx >= 0 ? ord.indexOf(curIdx) : -1;

  if (pos === -1) {
    return items[ord[n - 1]] ?? null;
  }
  if (pos > 0) {
    return items[ord[pos - 1]] ?? null;
  }
  if (repeatMode === "all") {
    return items[ord[n - 1]] ?? null;
  }
  return null;
}
