/**
 * Converts SRT subtitle text to WebVTT format and returns a blob URL.
 * The conversion is minimal: SRT timestamps use commas for milliseconds,
 * WebVTT uses periods. We also prepend the required WEBVTT header.
 */
export function srtToWebVTT(srtText: string): string {
  const cleaned = srtText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  const vttBody = cleaned
    // Replace SRT timestamp separator (comma) with WebVTT separator (period)
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
    // Remove cue index numbers (lines that are just a number)
    // WebVTT supports them but they're optional
    .replace(/^\d+\n/gm, "")
    // Add line:85% to each cue timing line so subtitles sit above the bottom
    // edge by default. snapToLines:false is implied by the % unit.
    .replace(
      /(\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3})/g,
      "$1 line:85%"
    );

  return `WEBVTT\n\n${vttBody}`;
}

export function createSubtitleBlobUrl(text: string, isVtt: boolean): string {
  const vttContent = isVtt ? text : srtToWebVTT(text);
  const blob = new Blob([vttContent], { type: "text/vtt" });
  return URL.createObjectURL(blob);
}

export async function readSubtitleFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read subtitle file"));
    reader.readAsText(file, "UTF-8");
  });
}
