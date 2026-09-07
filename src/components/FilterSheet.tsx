// The phone's filter tray: a drawer from the bottom with the filter fields
// and the timezone and clock at the bottom. Done closes it, and so does a
// drag down on the handle or a swipe past the top of the list. The list has
// no bounce at its ends: the drawer only takes a swipe when the list stands
// at zero, and a bounce past the top would hold it off. The bottom edge
// fades over the list until its end is on screen, so the fields under the
// languages are seen to be there. Until the old student has ever opened
// the drawer, a pulsing ring points at the button.
import * as React from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import type { Host } from "@/schema/host";
import { activeCount, EMPTY_FILTERS, type Filters, type SetFilters } from "@/lib/filters";
import type { Clock } from "@/lib/labels";
import { ClockToggle } from "@/components/ClockToggle";
import { FilterFields } from "@/components/FilterToolbar";
import { Nudge } from "@/components/Nudge";
import { useMoreBelow } from "@/hooks/use-more-below";
import { ZoneSelect } from "@/components/ZoneSelect";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export function FilterSheet({
  hosts,
  filters,
  setFilters,
  zone,
  setZone,
  clock,
  setClock,
  nudge,
  onNotice,
}: {
  hosts: Host[];
  filters: Filters;
  setFilters: SetFilters;
  zone: string | null;
  setZone: (zone: string | null) => void;
  clock: Clock;
  setClock: (clock: Clock) => void;
  nudge: boolean; // ring the button
  onNotice: () => void; // the drawer was opened, so the ring has done its work
}) {
  const active = activeCount(filters);
  const [listRef, more] = useMoreBelow<HTMLDivElement>();
  return (
    <Drawer onOpenChange={onNotice}>
      <Nudge on={nudge}>
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
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-none px-4 py-4">
            <FilterFields hosts={hosts} filters={filters} setFilters={setFilters} />
            <div className="mt-6 flex gap-2 border-t pt-4">
              <ZoneSelect value={zone} onChange={setZone} className="h-9 min-w-0 flex-1 max-w-none text-sm" />
              <ClockToggle clock={clock} onChange={setClock} className="h-9 shrink-0 text-sm" />
            </div>
          </div>
          {more && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent" />}
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
