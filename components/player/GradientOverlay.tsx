"use client";

import { memo } from "react";

export const GradientOverlay = memo(function GradientOverlay() {
  return (
    <>
      {/* Top gradient — for title / file info */}
      <div
        className="top-gradient absolute inset-x-0 top-0 h-24 pointer-events-none z-10"
        style={{ background: "var(--gradient-top)" }}
      />
      {/* Bottom gradient — for controls */}
      <div
        className="bottom-gradient absolute inset-x-0 bottom-0 h-36 pointer-events-none z-10"
        style={{ background: "var(--gradient-bottom)" }}
      />
    </>
  );
});
