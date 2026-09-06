// The applied filters, each removable, with how many sittings they leave.
import { XIcon } from "lucide-react";
import { appliedFilters, type Filters, type SetFilters } from "@/lib/filters";

export function AppliedFilters({
  filters,
  setFilters,
  shown,
  total,
}: {
  filters: Filters;
  setFilters: SetFilters;
  shown: number;
  total: number;
}) {
  const applied = appliedFilters(filters);
  if (applied.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground tabular-nums">
        {shown} of {total} sittings this week
      </span>
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
