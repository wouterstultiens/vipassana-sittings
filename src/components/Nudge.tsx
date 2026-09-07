// A pulsing ring around a control the old student should look at first. It
// is Tailwind's own pulse, so it reads as a hint and never as an error.
import * as React from "react";
import { cn } from "@/lib/utils";

export function Nudge({ on, className, children }: { on: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative", className)}>
      {on && <span aria-hidden className="pointer-events-none absolute -inset-1 animate-pulse rounded-lg ring-2 ring-primary" />}
      {children}
    </div>
  );
}
