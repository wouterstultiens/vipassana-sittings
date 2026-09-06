// The applied filters, each removable.
import { XIcon } from "lucide-react";
import { appliedFilters, type Filters, type SetFilters } from "@/lib/filters";

export function AppliedFilters({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: SetFilters;
}) {
  const applied = appliedFilters(filters);
  if (applied.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 py-1.5 text-sm">
      {applied.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={() => setFilters(a.remove)}
          aria-label={`Remove filter ${a.label}`}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border bg-card pr-1.5 pl-2.5 text-xs font-medium transition-colors hover:bg-accent"
        >
          {a.label}
          <XIcon className="size-3.5 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
