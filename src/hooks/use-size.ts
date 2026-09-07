import * as React from "react";

export type Size = { width: number; height: number };

/**
 * The rendered size of an element, kept current as it wraps or the window
 * changes. Zero before the first measure. The ref is a callback, so the
 * measure follows the element when a layout switch swaps it for another.
 */
export function useSize<T extends HTMLElement>(): [React.RefCallback<T>, Size] {
  const [node, setNode] = React.useState<T | null>(null);
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });
  React.useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const [box] = entry.borderBoxSize;
      setSize({ width: box.inlineSize, height: box.blockSize });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, size];
}
