import { TriangleAlertIcon } from "lucide-react";

/** Tells the old student the times can be out of date before they trust them. */
export function Notice() {
  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        Times come from the dhamma.org listing and the host page and may not be up to date. Check the host page before
        you join.
      </span>
    </div>
  );
}
