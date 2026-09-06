import * as React from "react";

const QUERY = "(max-width: 767px)";

const subscribe = (onChange: () => void) => {
  const list = matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};

/** True under 768 px. The server render says false; the layout itself is CSS-only, so only sheets ask. */
export const usePhone = () =>
  React.useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  );
