// The phone's filter tray: a bottom sheet with the filter fields, the result
// count fixed at the top, and the timezone and theme at the bottom.
import * as React from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { activeCount, EMPTY_FILTERS, type Filters } from "@/lib/filters";
import { FilterFields } from "@/components/FilterToolbar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ZoneSelect } from "@/components/ZoneSelect";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function FilterSheet({
  listings,
  filters,
  setFilters,
  zone,
  setZone,
  shown,
  total,
}: {
  listings: Listing[];
  filters: Filters;
  setFilters: (update: (f: Filters) => Filters) => void;
  zone: string;
  setZone: (zone: string) => void;
  shown: number;
  total: number;
}) {
  const active = activeCount(filters);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={active ? "default" : "outline"} size="sm">
          <SlidersHorizontalIcon /> Filters{active > 0 && ` · ${active}`}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88dvh] gap-0 rounded-t-xl p-0" showCloseButton={false}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">Filters</SheetTitle>
          <span className="text-sm text-muted-foreground tabular-nums">
            {shown} of {total} sittings
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <FilterFields listings={listings} filters={filters} setFilters={setFilters} />
          <div className="mt-6 flex items-center gap-2 border-t pt-4">
            <ZoneSelect value={zone} onChange={setZone} className="h-9 max-w-none flex-1 text-sm" />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex gap-2 border-t p-3">
          {active > 0 && (
            <Button variant="ghost" onClick={() => setFilters(() => EMPTY_FILTERS)}>
              Clear
            </Button>
          )}
          <SheetClose asChild>
            <Button className="ml-auto">Done</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
