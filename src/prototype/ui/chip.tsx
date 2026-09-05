import * as React from "react";
import { cn } from "./cn";

/** A toggle pill, the building block of every filter in the prototype. */
export function Chip({
  on,
  className,
  ...props
}: React.ComponentProps<"button"> & { on: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

export function ZoneSelect({ value, onChange, zones, className }: { value: string; onChange: (z: string) => void; zones: string[]; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 max-w-56 rounded-md border bg-background px-2 text-xs", className)}
      aria-label="Your timezone"
    >
      {!zones.includes(value) && <option value={value}>{value}</option>}
      {zones.map((z) => (
        <option key={z} value={z}>
          {z.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
