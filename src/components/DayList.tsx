// One day: a sticky one-line header, then one row per slot in start order.
// On today, the slots that have ended fold into one "Earlier today" row that
// opens in place.
import * as React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
import { endedSlots, type Slot } from "@/lib/slots";
import { SlotRow } from "@/components/SlotRow";
import { cn } from "@/lib/utils";

export function DayList({
  day,
  slots,
  zone,
  now,
  today,
  onOpen,
}: {
  day: Date;
  slots: Slot[];
  zone: string;
  now: Date;
  today: boolean;
  onOpen: (slot: Slot) => void;
}) {
  const [showEnded, setShowEnded] = React.useState(false);
  const { ended, rest } = today ? endedSlots(slots, now) : { ended: [], rest: slots };
  const endedCount = ended.reduce((n, s) => n + s.sittings.length, 0);

  return (
    <section aria-label={`${fmtWeekday(day, zone)} ${fmtDayOfMonth(day, zone)}`}>
      <h2
        className={cn(
          "sticky top-0 z-10 flex items-baseline gap-1.5 border-b bg-background px-1 py-2 text-sm whitespace-nowrap",
          today ? "text-primary" : "text-muted-foreground",
        )}
      >
        <span>{fmtWeekday(day, zone)}</span>
        <span className={cn("text-base font-semibold", !today && "text-foreground")}>{fmtDayOfMonth(day, zone)}</span>
      </h2>

      <div className="flex flex-col gap-1 py-2">
        {ended.length > 0 && (
          <button
            type="button"
            onClick={() => setShowEnded((v) => !v)}
            aria-expanded={showEnded}
            className="flex h-11 items-center justify-between rounded-md border border-dashed px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent md:h-9"
          >
            <span>
              Earlier today · <span className="tabular-nums">{endedCount}</span>
            </span>
            {showEnded ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          </button>
        )}
        {showEnded && ended.map((slot) => <SlotRow key={slot.key} slot={slot} zone={zone} state="ended" onOpen={onOpen} />)}
        {rest.map((slot) => (
          <SlotRow
            key={slot.key}
            slot={slot}
            zone={zone}
            state={slot.start <= now && now < slot.end ? "now" : "ahead"}
            onOpen={onOpen}
          />
        ))}
        {slots.length === 0 && <p className="px-1 py-2 text-sm text-muted-foreground">No sittings</p>}
      </div>
    </section>
  );
}
