// The sheet a row opens: from the right on a laptop, full height from the
// bottom on a phone. One sitting shows its details at once; several show a
// list to pick from, and the pick replaces the list. Every page starts with
// the same back row: to the list from a picked sitting, else to the calendar.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Sitting } from "@/lib/expand";
import type { Slot } from "@/lib/slots";
import { type Clock, fmtDate, fmtDuration, fmtTime } from "@/lib/labels";
import { usePhone } from "@/hooks/use-phone";
import { ListingBadges } from "@/components/ListingBadges";
import { SittingDetails } from "@/components/SittingDetails";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const BackRow = ({ onBack }: { onBack: () => void }) => (
  <div className="border-b px-3 py-2">
    <Button variant="ghost" size="sm" onClick={onBack}>
      <ChevronLeftIcon /> Back
    </Button>
  </div>
);

function SlotContent({ slot, zone, clock, onClose }: { slot: Slot; zone: string; clock: Clock; onClose: () => void }) {
  const several = slot.sittings.length > 1;
  const [picked, setPicked] = React.useState<Sitting | null>(several ? null : slot.sittings[0]);
  const time = fmtTime(slot.start, zone, clock);

  if (picked) {
    return (
      <>
        <BackRow onBack={several ? () => setPicked(null) : onClose} />
        <SheetTitle className="sr-only">{picked.listing.name}</SheetTitle>
        <SittingDetails listing={picked.listing} sitting={picked} zone={zone} clock={clock} />
      </>
    );
  }

  return (
    <>
      <BackRow onBack={onClose} />
      <header className="border-b p-5">
        <div className="text-sm text-muted-foreground">{fmtDate(slot.start, zone)}</div>
        <SheetTitle className="text-2xl font-semibold tabular-nums">
          {time} – {fmtTime(slot.end, zone, clock)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{fmtDuration(slot.durationMinutes)}</span>
        </SheetTitle>
      </header>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {slot.sittings.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-accent active:bg-accent"
              onClick={() => setPicked(s)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium" title={s.listing.name}>
                  {s.listing.name}
                </div>
                <div className="mt-1">
                  <ListingBadges listing={s.listing} size="xs" />
                </div>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function SittingSheet({ slot, onClose, zone, clock }: { slot: Slot | null; onClose: () => void; zone: string; clock: Clock }) {
  const phone = usePhone();
  return (
    <Sheet open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      {slot && (
        <SheetContent side={phone ? "bottom" : "right"} className={phone ? "h-dvh gap-0" : "gap-0 sm:max-w-lg"}>
          {/* Keyed on the slot, so a new row starts from its list again. */}
          <SlotContent key={slot.key} slot={slot} zone={zone} clock={clock} onClose={onClose} />
        </SheetContent>
      )}
    </Sheet>
  );
}
