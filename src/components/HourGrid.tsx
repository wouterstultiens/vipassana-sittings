// Day lists on one hour axis: a gutter of hours on the left, one column per
// day, and in each hour cell the slots that start in that hour, one
// fixed-height row each. The rows of one hour line up across the days, so
// scrolling down is moving through the day, as on a calendar. The laptop
// shows seven days in one grid that the page scrolls; the phone shows one
// grid per day pane, each pane a scroller of its own.
import * as React from "react";
import { type Clock, fmtDayOfMonth, fmtHour, fmtWeekday, hourIn } from "@/lib/labels";
import type { Slot } from "@/lib/slots";
import { useSize } from "@/hooks/use-size";
import { SlotRow, type SlotState } from "@/components/SlotRow";
import { cn } from "@/lib/utils";

export type Day = { day: Date; slots: Slot[]; today: boolean };

const HOURS = Array.from({ length: 24 }, (_, h) => h);

const stateOf = (slot: Slot, now: Date): SlotState => (slot.end <= now ? "ended" : slot.start <= now ? "now" : "ahead");

/** The gutter cell of an hour inside a scroller: the page on a laptop, one day pane on a phone. */
const hourCell = (scroller: ParentNode, h: number) => scroller.querySelector<HTMLElement>(`[data-hour="${h}"]`);

/** The hour whose gutter cell is at the top of the view, under the sticky headers on a laptop. */
export function hourInView(scroller: ParentNode = document): number {
  const top = scroller instanceof HTMLElement ? scroller.getBoundingClientRect().top : 0;
  let active = 0;
  for (const h of HOURS) {
    const cell = hourCell(scroller, h);
    if (!cell) continue;
    const margin = scroller instanceof HTMLElement ? 0 : parseFloat(getComputedStyle(cell).scrollMarginTop);
    if (cell.getBoundingClientRect().top <= top + margin + 1) active = h;
  }
  return active;
}

/** Scrolls an hour's gutter cell to the top of its scroller. A pane scrolls itself, so the snap row it sits in stays put. */
export function jumpToHour(scroller: ParentNode, hour: number) {
  const cell = hourCell(scroller, hour);
  if (!cell) return;
  if (scroller instanceof HTMLElement) scroller.scrollTop = cell.offsetTop;
  else cell.scrollIntoView();
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
  clock,
  now,
  nowHour,
  headers = true,
  onOpen,
}: {
  days: Day[];
  zone: string;
  clock: Clock;
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
            data-hour={h}
            className={cn(
              "border-t pt-0.5 pr-2 text-[11px] leading-4 tabular-nums md:[scroll-margin-top:calc(var(--header)+2.25rem)]",
              h === nowHour ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            {fmtHour(h, clock)}
          </div>
          {days.map(({ day, today }, i) => (
            <div key={day.getTime()} className={cn("flex min-h-5 flex-col gap-0.5 border-t px-1 py-0.5", today && "bg-today")}>
              {(byHour[i].get(h) ?? []).map((slot) => (
                <SlotRow key={slot.key} slot={slot} zone={zone} clock={clock} state={stateOf(slot, now)} width={rowWidth} onOpen={onOpen} />
              ))}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
