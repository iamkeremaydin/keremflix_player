const activeUrls = new Set<string>();

export function createObjectUrl(file: File): string {
  const url = URL.createObjectURL(file);
  activeUrls.add(url);
  return url;
}

export function revokeObjectUrl(url: string): void {
  if (activeUrls.has(url)) {
    URL.revokeObjectURL(url);
    activeUrls.delete(url);
  }
}

export function revokeAllUrls(): void {
  activeUrls.forEach((url) => URL.revokeObjectURL(url));
  activeUrls.clear();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
