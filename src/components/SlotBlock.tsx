// One block on the calendar: every sitting of a day that starts at the same
// time and lasts as long. Its height is its length. Hover tells the time and
// names the sittings, a click opens the one sitting or a list to pick from.
import * as React from "react";
import type { Sitting } from "@/lib/expand";
import type { Slot } from "@/lib/slots";
import { countryName, displayHost, fmtDuration, fmtTime } from "@/lib/labels";
import { ListingBadges } from "@/components/ListingBadges";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function When({ slot, zone }: { slot: Slot; zone: string }) {
  return (
    <div className="font-semibold tabular-nums">
      {fmtTime(slot.start, zone)} – {fmtTime(slot.end, zone)}
      <span className="ml-1 font-normal text-muted-foreground">{fmtDuration(slot.durationMinutes)}</span>
    </div>
  );
}

export function SlotBlock({
  slot,
  zone,
  past,
  style,
  onOpen,
}: {
  slot: Slot;
  zone: string;
  past: boolean;
  style: React.CSSProperties;
  onOpen: (sitting: Sitting) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const count = slot.sittings.length;
  const single = count === 1 ? slot.sittings[0] : null;

  const block = (
    <button
      type="button"
      style={style}
      onClick={single ? () => onOpen(single) : undefined}
      aria-label={`${fmtTime(slot.start, zone)}, ${count} ${count === 1 ? "sitting" : "sittings"}`}
      className={`absolute flex items-start justify-center overflow-hidden rounded border border-primary/40 bg-primary/15 text-[11px] leading-4 font-semibold tabular-nums hover:bg-primary/25 data-[state=open]:bg-primary/30 ${
        past ? "opacity-40" : ""
      }`}
    >
      {count}
    </button>
  );

  const tip = (
    <TooltipContent side="right" align="start">
      <When slot={slot} zone={zone} />
      <ul className="mt-1">
        {slot.sittings.map((s) => (
          <li key={s.key} className="truncate">
            {s.listing.name}
          </li>
        ))}
      </ul>
    </TooltipContent>
  );

  if (single) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{block}</TooltipTrigger>
        {tip}
      </Tooltip>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{block}</PopoverTrigger>
        </TooltipTrigger>
        {tip}
      </Tooltip>
      <PopoverContent side="right" align="start" className="max-h-96 w-80 overflow-y-auto p-1">
        <div className="px-2 py-1.5 text-sm">
          <When slot={slot} zone={zone} />
        </div>
        <ul className="space-y-0.5">
          {slot.sittings.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setOpen(false);
                  onOpen(s);
                }}
              >
                <div className="truncate font-medium">{s.listing.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {displayHost(s.listing)} · {countryName(s.listing.country)}
                </div>
                <div className="mt-1">
                  <ListingBadges listing={s.listing} size="xs" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
