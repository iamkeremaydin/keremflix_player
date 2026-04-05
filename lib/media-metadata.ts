export type ParsedMediaTags = {
  title: string | null;
  artist: string | null;
  album: string | null;
  /** MIME type e.g. image/jpeg */
  coverMime: string | null;
  coverData: Uint8Array | null;
};

export function stripExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i <= 0) return fileName;
  return fileName.slice(0, i);
}

/**
 * Parse ID3 / container tags in the browser (lazy-loaded dependency).
 */
export async function parseMediaMetadata(file: File): Promise<ParsedMediaTags> {
  const empty: ParsedMediaTags = {
    title: null,
    artist: null,
    album: null,
    coverMime: null,
    coverData: null,
  };

  try {
    const { parseBlob } = await import("music-metadata");
    const meta = await parseBlob(file, {
      duration: false,
      skipCovers: false,
    });

    const pic = meta.common.picture?.[0];
    const coverData = pic?.data ? new Uint8Array(pic.data) : null;
    const coverMime = pic?.format ? String(pic.format) : null;

    return {
      title: meta.common.title?.trim() || null,
      artist: meta.common.artist?.trim() || meta.common.artists?.join(", ")?.trim() || null,
      album: meta.common.album?.trim() || null,
      coverMime,
      coverData,
    };
  } catch {
    return empty;
  }
}

export function tagsToCoverObjectUrl(tags: ParsedMediaTags): string | null {
  if (!tags.coverData?.length || !tags.coverMime) return null;
  try {
    const copy = new Uint8Array(tags.coverData);
    const blob = new Blob([copy], { type: tags.coverMime });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
