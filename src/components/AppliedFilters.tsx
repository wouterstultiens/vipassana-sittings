// The applied filters as removable chips, with how many sittings they leave.
import { XIcon } from "lucide-react";
import { appliedFilters, EMPTY_FILTERS, type Filters } from "@/lib/filters";
import { Button } from "@/components/ui/button";

export function AppliedFilters({
  filters,
  setFilters,
  shown,
  total,
}: {
  filters: Filters;
  setFilters: (update: (f: Filters) => Filters) => void;
  shown: number;
  total: number;
}) {
  const chips = appliedFilters(filters);
  if (chips.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground tabular-nums">
        {shown} of {total} sittings this week
      </span>
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => setFilters(chip.remove)}
          aria-label={`Remove filter ${chip.label}`}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border bg-card pr-1.5 pl-2.5 text-xs font-medium transition-colors hover:bg-accent"
        >
          {chip.label}
          <XIcon className="size-3.5 text-muted-foreground" />
        </button>
      ))}
      {chips.length > 1 && (
        <Button variant="ghost" size="xs" className="shrink-0" onClick={() => setFilters(() => EMPTY_FILTERS)}>
          Clear all
        </Button>
      )}
    </div>
  );
}
