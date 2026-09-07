// A ring on the border of a control the old student should look at first.
// It breathes a few times on tw-animate-css's fade, a second in and a second
// out, and then it is gone, so it reads as a hint and never as an error or a
// permanent state.
import * as React from "react";
import { cn } from "@/lib/utils";

export function Nudge({ on, className, children }: { on: boolean; className?: string; children: React.ReactNode }) {
  const [done, setDone] = React.useState(false);
  return (
    <div className={cn("relative", className)}>
      {on && !done && (
        <span
          aria-hidden
          onAnimationEnd={() => setDone(true)}
          className="pointer-events-none absolute inset-0 animate-in rounded-md ring-2 ring-primary duration-1000 ease-in-out fade-in direction-alternate repeat-6 fill-mode-forwards"
        />
      )}
      {children}
    </div>
  );
}
