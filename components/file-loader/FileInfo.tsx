"use client";

import { memo } from "react";
import { useFileStore } from "@/store/file-store";
import { CONTAINER_SUPPORT } from "@/lib/format-support";

export const FileInfo = memo(function FileInfo() {
  const fileName = useFileStore((s) => s.fileName);
  const fileSize = useFileStore((s) => s.fileSize);
  const extension = useFileStore((s) => s.extension);

  const support = CONTAINER_SUPPORT[extension];
  const isUnsupported = support?.includes("NOT");

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "";
    const gb = bytes / 1024 / 1024 / 1024;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(0)} MB`;
  };

  if (!fileName) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider",
          isUnsupported
            ? "bg-red-900/60 text-red-300"
            : "bg-white/10 text-white/60",
        ].join(" ")}
      >
        {extension}
      </span>
      <span className="text-white/70 text-sm truncate max-w-[320px]">{fileName}</span>
      {fileSize > 0 && (
        <span className="text-white/30 text-xs">{formatSize(fileSize)}</span>
      )}
    </div>
  );
});
