import { TriangleAlertIcon } from "lucide-react";

/** Tells the old student where the times come from, before they trust them. Shown in the detail panel only. */
export function Notice() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        The dates and times come from the dhamma.org virtual group sittings page and, when there is one, the host page.
        Please check the host page before you join.
      </span>
    </div>
  );
}
