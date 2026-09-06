// The calendar: seven day lists from today, side by side on a laptop and
// stacked in one scroll on a phone. Filters and the timezone come back from
// local storage on the next visit. A row opens the sitting sheet.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { expandSittings, localDayStart, WEEKS_AHEAD } from "@/lib/expand";
import { EMPTY_FILTERS, sittingMatches, type Filters } from "@/lib/filters";
import { fmtDayMonth, fmtDayMonthYear } from "@/lib/labels";
import { readPreferences, writePreferences, type Preferences } from "@/lib/preferences";
import { slotsOf, type Slot } from "@/lib/slots";
import { AppliedFilters } from "@/components/AppliedFilters";
import { DayList } from "@/components/DayList";
import { FilterSheet } from "@/components/FilterSheet";
import { FilterToolbar } from "@/components/FilterToolbar";
import { Notice } from "@/components/Notice";
import { SittingSheet } from "@/components/SittingSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { oldStudentZone, ZoneSelect } from "@/components/ZoneSelect";
import { Button } from "@/components/ui/button";

export function Calendar({ listings, builtAt }: { listings: Listing[]; builtAt: string }) {
  // The server render knows neither the old student's zone nor the current
  // time, so it draws the build-time week in UTC and the browser corrects it
  // on mount, from local storage where a previous visit left something.
  const [prefs, setPrefs] = React.useState<Preferences | null>(null);
  const [now, setNow] = React.useState(() => new Date(builtAt));
  React.useEffect(() => {
    setPrefs(readPreferences(localStorage) ?? { zone: oldStudentZone(), filters: EMPTY_FILTERS });
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);
  React.useEffect(() => {
    if (prefs) writePreferences(localStorage, prefs);
  }, [prefs]);

  const zone = prefs?.zone ?? "UTC";
  const filters = prefs?.filters ?? EMPTY_FILTERS;
  const setFilters = (update: (f: Filters) => Filters) => setPrefs((p) => p && { ...p, filters: update(p.filters) });
  const setZone = (z: string) => setPrefs((p) => p && { ...p, zone: z });

  const [weeks, setWeeks] = React.useState(0);
  const [open, setOpen] = React.useState<Slot | null>(null);

  const from = localDayStart(now, zone, 7 * weeks);
  const to = localDayStart(from, zone, 7);
  const days = Array.from({ length: 7 }, (_, i) => localDayStart(from, zone, i));
  const dayEnd = (i: number) => days[i + 1] ?? to;

  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const shown = all.filter((s) => sittingMatches(s, filters));
  const slotsByDay = days.map((d, i) => slotsOf(shown.filter((s) => s.start >= d && s.start < dayEnd(i))));
  const todayIdx = days.findIndex((d, i) => now >= d && now < dayEnd(i));

  const previous = (
    <Button variant="outline" size="icon-sm" disabled={weeks === 0} onClick={() => setWeeks((w) => w - 1)} aria-label="Previous week">
      <ChevronLeftIcon />
    </Button>
  );
  const next = (
    <Button variant="outline" size="icon-sm" disabled={weeks === WEEKS_AHEAD} onClick={() => setWeeks((w) => w + 1)} aria-label="Next week">
      <ChevronRightIcon />
    </Button>
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <h1 className="sr-only">Virtual group sittings</h1>

      <div className="hidden flex-wrap items-center gap-2 border-b px-3 py-1.5 md:flex">
        {previous}
        <Button variant="outline" size="sm" disabled={weeks === 0} onClick={() => setWeeks(0)}>
          Today
        </Button>
        {next}
        <span className="ml-1 text-sm font-medium tabular-nums">
          {fmtDayMonth(from, zone)} – {fmtDayMonthYear(days[6], zone)}
        </span>
        <div className="mx-1 h-6 w-px bg-border" />
        <FilterToolbar listings={listings} filters={filters} setFilters={setFilters} />
        <div className="ml-auto flex items-center gap-2">
          <ZoneSelect value={zone} onChange={setZone} />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b px-3 py-1.5 md:hidden">
        {previous}
        {next}
        <span className="ml-1 text-sm font-medium tabular-nums">
          {fmtDayMonth(from, zone)} – {fmtDayMonth(days[6], zone)}
        </span>
        <div className="ml-auto">
          <FilterSheet
            listings={listings}
            filters={filters}
            setFilters={setFilters}
            zone={zone}
            setZone={setZone}
            shown={shown.length}
            total={all.length}
          />
        </div>
      </div>

      <div className="px-3 py-1">
        <Notice compact />
      </div>
      <AppliedFilters filters={filters} setFilters={setFilters} shown={shown.length} total={all.length} />

      <div className="grid grid-cols-1 px-3 pb-6 md:grid-cols-7 md:gap-x-2">
        {days.map((d, i) => (
          <DayList key={d.getTime()} day={d} slots={slotsByDay[i]} zone={zone} now={now} today={i === todayIdx} onOpen={setOpen} />
        ))}
      </div>

      <SittingSheet slot={open} onClose={() => setOpen(null)} zone={zone} />
    </div>
  );
}
