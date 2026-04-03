import { createObjectUrl, revokeObjectUrl } from "@/modules/file-system/file-loader";

let currentUrl: string | null = null;

export function createSource(file: File): string {
  if (currentUrl) {
    revokeObjectUrl(currentUrl);
  }
  currentUrl = createObjectUrl(file);
  return currentUrl;
}

export function releaseSource(): void {
  if (currentUrl) {
    revokeObjectUrl(currentUrl);
    currentUrl = null;
  }
}

export function getCurrentSourceUrl(): string | null {
  return currentUrl;
}
