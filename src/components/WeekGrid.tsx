// The calendar: seven days from today, drawn to scale. Each day is a column of
// 24 hours, and every slot is a block whose top is its start and whose height
// is its length. Opening a sitting opens the detail panel.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { expandSittings, localDayStart, WEEKS_AHEAD, WEEKS_BACK, type Sitting } from "@/lib/expand";
import { EMPTY_FILTERS, sittingMatches, type Filters } from "@/lib/filters";
import { placeSlots, slotsOf } from "@/lib/slots";
import { fmtDayMonth, fmtDayMonthYear, fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
import { FilterToolbar } from "@/components/FilterToolbar";
import { Notice } from "@/components/Notice";
import { SittingSheet } from "@/components/SittingSheet";
import { SlotBlock } from "@/components/SlotBlock";
import { ThemeToggle } from "@/components/ThemeToggle";
import { oldStudentZone, ZoneSelect } from "@/components/ZoneSelect";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Pixels per hour. 24 hours fit a laptop screen under the toolbar. */
const HOUR_PX = 30;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const y = (minutes: number) => (minutes / 60) * HOUR_PX;

export function WeekGrid({ listings, builtAt }: { listings: Listing[]; builtAt: string }) {
  // The server render knows neither the old student's zone nor the current
  // time, so it draws the build-time week in UTC and the browser corrects it on
  // mount.
  const [view, setView] = React.useState(() => ({ zone: "UTC", now: new Date(builtAt) }));
  React.useEffect(() => setView({ zone: oldStudentZone(), now: new Date() }), []);
  const { zone, now } = view;

  const [weeks, setWeeks] = React.useState(0);
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [open, setOpen] = React.useState<Sitting | null>(null);

  const from = localDayStart(now, zone, 7 * weeks);
  const to = localDayStart(from, zone, 7);
  const days = Array.from({ length: 7 }, (_, i) => localDayStart(from, zone, i));
  const dayEnd = (i: number) => days[i + 1] ?? to;

  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const shown = all.filter((s) => sittingMatches(s, filters));
  const placedByDay = days.map((d, i) => placeSlots(slotsOf(shown.filter((s) => s.start >= d && s.start < dayEnd(i)))));
  const todayIdx = days.findIndex((d, i) => now >= d && now < dayEnd(i));
  const nowMinutes = todayIdx === -1 ? null : (now.getTime() - days[todayIdx].getTime()) / 60_000;

  return (
    <TooltipProvider>
      <div className="mx-auto flex h-screen max-w-[1400px] flex-col">
        <h1 className="sr-only">Virtual group sittings</h1>

        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={weeks === -WEEKS_BACK}
            onClick={() => setWeeks((w) => w - 1)}
            aria-label="Previous week"
          >
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" disabled={weeks === 0} onClick={() => setWeeks(0)}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={weeks === WEEKS_AHEAD}
            onClick={() => setWeeks((w) => w + 1)}
            aria-label="Next week"
          >
            <ChevronRightIcon />
          </Button>
          <span className="ml-1 text-sm font-medium tabular-nums">
            {fmtDayMonth(from, zone)} – {fmtDayMonthYear(days[6], zone)}
          </span>
          <div className="mx-1 h-6 w-px bg-border" />
          <FilterToolbar listings={listings} filters={filters} setFilters={setFilters} />
          <div className="ml-auto flex items-center gap-2">
            <ZoneSelect value={zone} onChange={(z) => setView((v) => ({ ...v, zone: z }))} />
            <ThemeToggle />
          </div>
        </div>

        <div className="px-3 py-1">
          <Notice compact />
        </div>

        <div className="flex-1 overflow-auto px-3 pb-3">
          <div className="grid min-w-[700px] grid-cols-[2.75rem_repeat(7,minmax(0,1fr))]">
            <div />
            {days.map((d, i) => (
              <div
                key={i}
                className={`sticky top-0 z-10 border-b bg-background py-1 text-center text-sm ${i === todayIdx ? "font-semibold text-primary" : ""}`}
              >
                {fmtWeekday(d, zone)}{" "}
                <span className={i === todayIdx ? "rounded-full bg-primary px-1.5 text-primary-foreground" : "text-muted-foreground"}>
                  {fmtDayOfMonth(d, zone)}
                </span>
              </div>
            ))}

            <div className="relative" style={{ height: 24 * HOUR_PX }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums"
                  style={{ top: y(h * 60) }}
                >
                  {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
            {placedByDay.map((placed, di) => (
              <div
                key={di}
                className={`relative overflow-hidden border-l ${di === todayIdx ? "bg-primary/5" : ""}`}
                style={{ height: 24 * HOUR_PX }}
              >
                {HOURS.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t" style={{ top: y(h * 60) }} />
                ))}
                {placed.map(({ slot, lane, lanes }) => (
                  <SlotBlock
                    key={slot.key}
                    slot={slot}
                    zone={zone}
                    past={slot.end < now}
                    style={{
                      top: y(slot.minutesFromMidnight),
                      height: y(slot.durationMinutes) - 1,
                      left: `calc(${(lane / lanes) * 100}% + 1px)`,
                      width: `calc(${100 / lanes}% - 2px)`,
                    }}
                    onOpen={setOpen}
                  />
                ))}
                {di === todayIdx && nowMinutes !== null && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500" style={{ top: y(nowMinutes) }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <SittingSheet sitting={open} onClose={() => setOpen(null)} zone={zone} />
      </div>
    </TooltipProvider>
  );
}
