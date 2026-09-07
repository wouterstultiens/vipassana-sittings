import * as React from "react";

/**
 * Whether a scroller has content below its fold, kept current as it scrolls
 * or resizes, so a sheet can fade its bottom edge until the end is on screen.
 * The ref is a callback, so it follows the scroller when a sheet mounts it.
 */
export function useMoreBelow<T extends HTMLElement>(): [React.RefCallback<T>, boolean] {
  const [node, setNode] = React.useState<T | null>(null);
  const [more, setMore] = React.useState(false);
  React.useEffect(() => {
    if (!node) return;
    const check = () => setMore(node.scrollHeight - node.scrollTop - node.clientHeight > 1);
    check();
    node.addEventListener("scroll", check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, [node]);
  return [setNode, more];
}
