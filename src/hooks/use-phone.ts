import * as React from "react";

const QUERY = "(max-width: 767px)";

const subscribe = (onChange: () => void) => {
  const media = matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/** True under 768 px. The server render says false and draws the laptop layout; the phone corrects it on mount. */
export const usePhone = () =>
  React.useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  );
