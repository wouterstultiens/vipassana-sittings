// The calendar: seven day lists from today on one hour axis, side by side on
// a laptop and stacked in one scroll on a phone, under a toolbar that sticks
// to the top. Filters and the timezone come back from local storage on the
// next visit. A row opens the sitting sheet.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { expandSittings, localDayStart, WEEKS_AHEAD } from "@/lib/expand";
import { EMPTY_FILTERS, sittingMatches, type SetFilters } from "@/lib/filters";
import { fmtDayMonth, fmtDayMonthYear, hourIn } from "@/lib/labels";
import { readPreferences, writePreferences, type Preferences } from "@/lib/preferences";
import { slotsOf, type Slot } from "@/lib/slots";
import { useSize } from "@/hooks/use-size";
import { usePhone } from "@/hooks/use-phone";
import { AppliedFilters } from "@/components/AppliedFilters";
import { dayId, DayStrip } from "@/components/DayStrip";
import { FilterSheet } from "@/components/FilterSheet";
import { FilterToolbar } from "@/components/FilterToolbar";
import { HourGrid, NOW_HOUR_ID, type Day } from "@/components/HourGrid";
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
    setPrefs(readPreferences(localStorage) ?? { zone: null, filters: EMPTY_FILTERS });
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);
  React.useEffect(() => {
    if (prefs) writePreferences(localStorage, prefs);
  }, [prefs]);

  // A null zone follows the device, so a traveller's calendar moves with them.
  const zone = prefs ? (prefs.zone ?? oldStudentZone()) : "UTC";
  const filters = prefs?.filters ?? EMPTY_FILTERS;
  const setFilters: SetFilters = (update) => setPrefs((p) => p && { ...p, filters: update(p.filters) });
  const setZone = (z: string | null) => setPrefs((p) => p && { ...p, zone: z });

  const [weeks, setWeeks] = React.useState(0);
  const [open, setOpen] = React.useState<Slot | null>(null);

  const from = localDayStart(now, zone, 7 * weeks);
  const to = localDayStart(from, zone, 7);
  const days = Array.from({ length: 7 }, (_, i) => localDayStart(from, zone, i));
  const dayEnd = (i: number) => days[i + 1] ?? to;

  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const shown = all.filter((s) => sittingMatches(s, filters));
  const todayIdx = days.findIndex((d, i) => now >= d && now < dayEnd(i));
  const dayLists: Day[] = days.map((d, i) => ({
    day: d,
    slots: slotsOf(shown.filter((s) => s.start >= d && s.start < dayEnd(i))),
    today: i === todayIdx,
  }));
  const nowHour = todayIdx === -1 ? null : hourIn(now, zone);
  const phone = usePhone();

  // The header's height feeds --header, so the day headers and the jumps land under it.
  const [headerRef, { height: headerHeight }] = useSize<HTMLDivElement>();
  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView();

  // Once, after the zone is known: open on the current hour, as a calendar does.
  const scrolled = React.useRef(false);
  React.useEffect(() => {
    if (!prefs || scrolled.current) return;
    scrolled.current = true;
    jumpTo(NOW_HOUR_ID);
  }, [prefs]);

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
    <div className="mx-auto max-w-[1400px]" style={{ "--header": `${headerHeight}px` } as React.CSSProperties}>
      <h1 className="sr-only">Virtual group sittings</h1>

      <div ref={headerRef} className="sticky top-0 z-20 border-b bg-background">
        <div className="hidden flex-wrap items-center gap-2 px-3 py-1.5 md:flex">
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
            <ZoneSelect value={prefs?.zone ?? null} onChange={setZone} />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 md:hidden">
          {previous}
          {next}
          <span className="ml-1 text-sm font-medium tabular-nums">
            {fmtDayMonth(from, zone)} – {fmtDayMonth(days[6], zone)}
          </span>
          <div className="ml-auto">
            <FilterSheet listings={listings} filters={filters} setFilters={setFilters} zone={prefs?.zone ?? null} setZone={setZone} />
          </div>
        </div>
        <DayStrip className="md:hidden" days={dayLists} zone={zone} headerHeight={headerHeight} onPick={(i) => jumpTo(dayId(i))} />
      </div>

      <AppliedFilters filters={filters} setFilters={setFilters} />

      <div className="px-3 pb-6">
        {phone ? (
          dayLists.map((d, i) => (
            <div key={d.day.getTime()} id={dayId(i)} className="scroll-mt-(--header)">
              <HourGrid days={[d]} zone={zone} now={now} nowHour={d.today ? nowHour : null} onOpen={setOpen} />
            </div>
          ))
        ) : (
          <HourGrid days={dayLists} zone={zone} now={now} nowHour={nowHour} onOpen={setOpen} />
        )}
      </div>

      <SittingSheet slot={open} onClose={() => setOpen(null)} zone={zone} />
    </div>
  );
}
