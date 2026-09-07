import * as React from "react";

// A swipe is a mostly horizontal touch of at least this many pixels.
const MIN_DISTANCE = 48;

/** Touch handlers that call back on a horizontal swipe, and leave vertical scrolling to the browser. */
export function useSwipe(onSwipe: (dir: 1 | -1) => void) {
  const start = React.useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) return;
      // A swipe to the left pulls the next day in.
      onSwipe(dx < 0 ? 1 : -1);
    },
  };
}
