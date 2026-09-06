import { TriangleAlertIcon } from "lucide-react";

/**
 * Tells the old student the times can be out of date before they trust them.
 * Boxed in the detail panel, one quiet line under the toolbar.
 */
export function Notice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex items-start gap-2 text-xs text-muted-foreground"
          : "flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
      }
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        Times come from the dhamma.org listing and the host page and may not be up to date. Check the host page before
        you join.
      </span>
    </div>
  );
}
