// The sheet a row opens: from the right on a laptop, full height from the
// bottom on a phone. One sitting shows its details at once; several show a
// list to pick from, and the pick replaces the list with a way back.
import * as React from "react";
import { ChevronLeftIcon } from "lucide-react";
import type { Sitting } from "@/lib/expand";
import type { Slot } from "@/lib/slots";
import { countryName, displayHost, fmtDate, fmtDuration, fmtTime } from "@/lib/labels";
import { usePhone } from "@/hooks/use-phone";
import { ListingBadges } from "@/components/ListingBadges";
import { SittingDetails } from "@/components/SittingDetails";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

function SlotContent({ slot, zone }: { slot: Slot; zone: string }) {
  const [picked, setPicked] = React.useState<Sitting | null>(slot.sittings.length === 1 ? slot.sittings[0] : null);
  const time = fmtTime(slot.start, zone);

  if (picked) {
    return (
      <>
        {slot.sittings.length > 1 && (
          <div className="border-b px-3 py-2">
            <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
              <ChevronLeftIcon /> Back to {time}
            </Button>
          </div>
        )}
        <SheetTitle className="sr-only">{picked.listing.name}</SheetTitle>
        <SittingDetails listing={picked.listing} sitting={picked} zone={zone} />
      </>
    );
  }

  return (
    <>
      <header className="border-b p-5 pr-12">
        <div className="text-sm text-muted-foreground">{fmtDate(slot.start, zone)}</div>
        <SheetTitle className="text-2xl font-semibold tabular-nums">
          {time} – {fmtTime(slot.end, zone)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{fmtDuration(slot.durationMinutes)}</span>
        </SheetTitle>
        <div className="mt-1 text-sm text-muted-foreground">{slot.sittings.length} sittings start then. Pick one.</div>
      </header>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {slot.sittings.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent"
              onClick={() => setPicked(s)}
            >
              <div className="font-medium">{s.listing.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {displayHost(s.listing)} · {countryName(s.listing.country)}
              </div>
              <div className="mt-1.5">
                <ListingBadges listing={s.listing} size="xs" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function SittingSheet({ slot, onClose, zone }: { slot: Slot | null; onClose: () => void; zone: string }) {
  const phone = usePhone();
  return (
    <Sheet open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      {slot && (
        <SheetContent side={phone ? "bottom" : "right"} className={phone ? "h-dvh gap-0" : "gap-0 sm:max-w-lg"}>
          {/* Keyed on the slot, so a new row starts from its list again. */}
          <SlotContent key={slot.key} slot={slot} zone={zone} />
        </SheetContent>
      )}
    </Sheet>
  );
}
