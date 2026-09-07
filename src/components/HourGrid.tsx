// Day lists on one hour axis: a gutter of hours on the left, one column per
// day, and in each hour cell the slots that start in that hour, one
// fixed-height row each. The rows of one hour line up across the days, so
// scrolling down is moving through the day, as on a calendar. The laptop
// shows seven days in one grid; the phone shows one day's grid at a time.
import * as React from "react";
import { fmtDayOfMonth, fmtWeekday, hourIn } from "@/lib/labels";
import type { Slot } from "@/lib/slots";
import { useSize } from "@/hooks/use-size";
import { SlotRow, type SlotState } from "@/components/SlotRow";
import { cn } from "@/lib/utils";

export type Day = { day: Date; slots: Slot[]; today: boolean };

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

const stateOf = (slot: Slot, now: Date): SlotState => (slot.end <= now ? "ended" : slot.start <= now ? "now" : "ahead");

/** The id of an hour's gutter cell, where the page scrolls to on load and when a day is turned. */
export const hourId = (h: number) => `hour-${h}`;

/** The hour whose gutter cell is at the top of the view, under the sticky headers. */
export function hourInView(): number {
  let active = 0;
  for (const h of HOURS) {
    const cell = document.getElementById(hourId(h));
    if (!cell) continue;
    const margin = parseFloat(getComputedStyle(cell).scrollMarginTop);
    if (cell.getBoundingClientRect().top <= margin + 1) active = h;
  }
  return active;
}

// On a laptop the day headers stick under the toolbar, whose height is
// --header. On a phone the toolbar names the day and the grid has no headers.
const STICKY_HEADER = "z-10 border-b bg-background md:sticky md:top-(--header)";

// What a row's width loses to the gutter column and the cell's own padding.
const GUTTER_WIDTH = 40;
const CELL_PADDING = 8;

export function HourGrid({
  days,
  zone,
  now,
  nowHour,
  headers = true,
  onOpen,
}: {
  days: Day[];
  zone: string;
  now: Date;
  nowHour: number | null; // the current hour when today is one of the days
  headers?: boolean; // the day headers on top of the columns, off on a phone
  onOpen: (slot: Slot) => void;
}) {
  const byHour = days.map(({ slots }) => Map.groupBy(slots, (s) => hourIn(s.start, zone)));
  const [gridRef, grid] = useSize<HTMLDivElement>();
  const rowWidth = grid.width ? (grid.width - GUTTER_WIDTH) / days.length - CELL_PADDING : 0;

  return (
    <div ref={gridRef} className="grid" style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(0, 1fr))` }}>
      {headers && (
        <>
          <div className={STICKY_HEADER} />
          {days.map(({ day, today }) => (
            <h2
              key={day.getTime()}
              className={cn(
                STICKY_HEADER,
                "flex items-baseline gap-1.5 px-2 py-1 text-sm whitespace-nowrap",
                today ? "bg-today text-primary" : "text-muted-foreground",
              )}
            >
              <span>{fmtWeekday(day, zone)}</span>
              <span className={cn("text-base font-semibold", !today && "text-foreground")}>{fmtDayOfMonth(day, zone)}</span>
            </h2>
          ))}
        </>
      )}

      {HOURS.map((h) => (
        <React.Fragment key={h}>
          <div
            id={hourId(h)}
            className={cn(
              "border-t pt-0.5 pr-2 text-[11px] leading-4 tabular-nums scroll-mt-(--header) md:[scroll-margin-top:calc(var(--header)+2.25rem)]",
              h === nowHour ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            {hourLabel(h)}
          </div>
          {days.map(({ day, today }, i) => (
            <div key={day.getTime()} className={cn("flex min-h-5 flex-col gap-0.5 border-t px-1 py-0.5", today && "bg-today")}>
              {(byHour[i].get(h) ?? []).map((slot) => (
                <SlotRow key={slot.key} slot={slot} zone={zone} state={stateOf(slot, now)} width={rowWidth} onOpen={onOpen} />
              ))}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
