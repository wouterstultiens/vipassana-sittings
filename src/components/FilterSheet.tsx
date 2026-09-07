// The phone's filter tray: a drawer from the bottom with the filter fields
// and the timezone at the bottom. Done closes it, and so does a drag down on
// the handle or a swipe past the top of the list. Until the old student
// opens it or a filter is chosen, a pulsing ring points at the button.
import * as React from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { activeCount, EMPTY_FILTERS, type Filters, type SetFilters } from "@/lib/filters";
import { FilterFields } from "@/components/FilterToolbar";
import { Nudge } from "@/components/Nudge";
import { ZoneSelect } from "@/components/ZoneSelect";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export function FilterSheet({
  listings,
  filters,
  setFilters,
  zone,
  setZone,
  nudge,
}: {
  listings: Listing[];
  filters: Filters;
  setFilters: SetFilters;
  zone: string | null;
  setZone: (zone: string | null) => void;
  nudge: boolean; // ring the button until a filter is chosen or the drawer is opened
}) {
  const active = activeCount(filters);
  const [noticed, setNoticed] = React.useState(false);
  return (
    <Drawer onOpenChange={() => setNoticed(true)}>
      <Nudge on={nudge && !noticed}>
        <DrawerTrigger asChild>
          <Button variant={active ? "default" : "outline"} size="sm">
            <SlidersHorizontalIcon /> Filters{active > 0 && ` · ${active}`}
          </Button>
        </DrawerTrigger>
      </Nudge>
      <DrawerContent className="max-h-[88dvh]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <DrawerTitle className="text-base">Filters</DrawerTitle>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <FilterFields listings={listings} filters={filters} setFilters={setFilters} />
          <div className="mt-6 border-t pt-4">
            <ZoneSelect value={zone} onChange={setZone} className="h-9 w-full max-w-none text-sm" />
          </div>
        </div>
        <div className="flex gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {active > 0 && (
            <Button variant="ghost" onClick={() => setFilters(() => EMPTY_FILTERS)}>
              Clear
            </Button>
          )}
          <DrawerClose asChild>
            <Button className="ml-auto">Done</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
