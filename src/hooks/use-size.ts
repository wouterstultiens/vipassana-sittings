import * as React from "react";

export type Size = { width: number; height: number };

/** The rendered size of an element, kept current as it wraps or the window changes. Zero before the first measure. */
export function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, Size] {
  const ref = React.useRef<T>(null);
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });
  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const [box] = entry.borderBoxSize;
      setSize({ width: box.inlineSize, height: box.blockSize });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}
