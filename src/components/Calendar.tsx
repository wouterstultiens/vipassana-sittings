// The calendar: seven day lists from today on one hour axis, side by side on
// a laptop and one day per screen on a phone, under a toolbar that sticks to
// the top. Filters and the timezone come back from local storage on the next
// visit. A row opens the sitting sheet.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { expandSittings, localDayStart, WEEKS_AHEAD } from "@/lib/expand";
import { activeCount, EMPTY_FILTERS, sittingMatches, type SetFilters } from "@/lib/filters";
import { fmtDate, fmtDayMonth, fmtDayMonthYear, hourIn } from "@/lib/labels";
import { readPreferences, writePreferences, type Preferences } from "@/lib/preferences";
import { slotsOf, type Slot } from "@/lib/slots";
import { useSize } from "@/hooks/use-size";
import { usePhone } from "@/hooks/use-phone";
import { AppliedFilters } from "@/components/AppliedFilters";
import { DayStrip } from "@/components/DayStrip";
import { FilterSheet } from "@/components/FilterSheet";
import { FilterToolbar } from "@/components/FilterToolbar";
import { HourGrid, hourInView, jumpToHour, type Day } from "@/components/HourGrid";
import { SittingSheet } from "@/components/SittingSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { oldStudentZone, ZoneSelect } from "@/components/ZoneSelect";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Where the calendar is open: which week from today, and on a phone which day of it fills the screen. */
type Page = { weeks: number; day: number };
const FIRST_PAGE: Page = { weeks: 0, day: 0 };

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
  // The ring around the filters, until one is chosen. Not before the stored filters are known, so it never flashes.
  const nudge = prefs !== null && activeCount(filters) === 0;

  const [page, setPage] = React.useState<Page>(FIRST_PAGE);
  const { weeks } = page;
  const [open, setOpen] = React.useState<Slot | null>(null);

  // The week's data only changes with the week, the zone, or the filters. It
  // is kept stable across the other renders (a row opening, the clock
  // ticking), so the memoised rows below skip their work.
  const from = localDayStart(now, zone, 7 * weeks);
  const fromTime = from.getTime();
  const [days, to] = React.useMemo(() => {
    const starts = Array.from({ length: 8 }, (_, i) => localDayStart(from, zone, i));
    return [starts.slice(0, 7), starts[7]] as const;
  }, [fromTime, zone]);
  const dayEnd = (i: number) => days[i + 1] ?? to;

  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, fromTime, to, zone]);
  const shown = React.useMemo(() => all.filter((s) => sittingMatches(s, filters)), [all, filters]);
  const todayIdx = days.findIndex((d, i) => now >= d && now < dayEnd(i));
  const dayLists: Day[] = React.useMemo(
    () =>
      days.map((d, i) => ({
        day: d,
        slots: slotsOf(shown.filter((s) => s.start >= d && s.start < dayEnd(i))),
        today: i === todayIdx,
      })),
    [days, to, shown, todayIdx],
  );
  const nowHour = todayIdx === -1 ? null : hourIn(now, zone);
  const phone = usePhone();

  // The phone's day panes sit in one row that snaps a pane per screen. Each
  // pane scrolls its own hours, so a drag peeks at the next day, and the
  // pane the drag settles on becomes the day.
  const pagerRef = React.useRef<HTMLDivElement>(null);
  const panes = () => Array.from(pagerRef.current?.children ?? []) as HTMLElement[];
  // Where the hour jumps go: every pane on a phone, the page on a laptop.
  const scrollers = (): ParentNode[] => (phone ? panes() : [document]);

  // The header's height feeds --header, so the laptop's day headers and jumps land under it.
  const [headerRef, { height: headerHeight }] = useSize<HTMLDivElement>();

  // Once per layout, after the zone is known and the header is measured, so
  // the jump lands under it: open on the current hour, as a calendar does.
  // The phone layout arrives a render after hydration, so it gets its own jump.
  const scrolledFor = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (!prefs || !headerHeight || scrolledFor.current === phone || nowHour === null) return;
    scrolledFor.current = phone;
    for (const s of scrollers()) jumpToHour(s, nowHour);
  }, [prefs, headerHeight, nowHour, phone]);

  // Turning the week keeps the hour at the top of the view, so the old
  // student compares the same hour across days and weeks, as on a calendar.
  const keptHour = React.useRef<number | null>(null);
  const turnTo = (next: Page) => {
    keptHour.current = hourInView(phone ? panes()[page.day] : document);
    setPage(next);
  };
  React.useLayoutEffect(() => {
    if (keptHour.current === null) return;
    for (const s of scrollers()) jumpToHour(s, keptHour.current);
    keptHour.current = null;
  }, [page]);

  // The strip's marker follows the drag through --day on the phone root: a
  // fraction between two days while the row moves, the day once it settles.
  const phoneRef = React.useRef<HTMLDivElement>(null);
  const settled = React.useRef(true);

  // Every other pane opens on the hour of the pane on screen, so a peek shows the same hour on the next day.
  const alignPanes = () => {
    const all = panes();
    const hour = hourInView(all[page.day]);
    all.forEach((pane, i) => i !== page.day && jumpToHour(pane, hour));
  };
  const onDrag = () => {
    const pager = pagerRef.current;
    if (!pager) return;
    const progress = pager.scrollLeft / pager.clientWidth;
    phoneRef.current?.style.setProperty("--day", String(progress));
    const nearest = Math.round(progress);
    if (Math.abs(progress - nearest) < 0.01) {
      settled.current = true;
      if (nearest !== page.day) setPage((p) => ({ ...p, day: nearest }));
    } else if (settled.current) {
      settled.current = false;
      alignPanes();
    }
  };
  const slideTo = (day: number) => {
    const pager = pagerRef.current;
    if (!pager) return;
    alignPanes();
    pager.scrollTo({ left: day * pager.clientWidth, behavior: "smooth" });
  };

  const shownDay = dayLists[page.day];
  const laptop = (
    <>
      <div ref={headerRef} className="sticky top-0 z-20 border-b bg-background">
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5">
          <Button variant="outline" size="icon-sm" disabled={weeks === 0} onClick={() => turnTo({ weeks: weeks - 1, day: 0 })} aria-label="Previous week">
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" disabled={weeks === 0} onClick={() => turnTo(FIRST_PAGE)}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" disabled={weeks === WEEKS_AHEAD} onClick={() => turnTo({ weeks: weeks + 1, day: 0 })} aria-label="Next week">
            <ChevronRightIcon />
          </Button>
          <span className="ml-1 text-sm font-medium tabular-nums">
            {fmtDayMonth(from, zone)} – {fmtDayMonthYear(days[6], zone)}
          </span>
          <div className="mx-1 h-6 w-px bg-border" />
          <FilterToolbar listings={listings} filters={filters} setFilters={setFilters} nudge={nudge} />
          <div className="ml-auto flex items-center gap-2">
            <ZoneSelect value={prefs?.zone ?? null} onChange={setZone} />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <AppliedFilters filters={filters} setFilters={setFilters} />
      <div className="px-3 pb-6">
        <HourGrid days={dayLists} zone={zone} now={now} nowHour={nowHour} onOpen={setOpen} />
      </div>
    </>
  );

  // The phone fills the screen: the toolbar names the day in full, with the
  // filters and the theme at the right; the day panes take the middle; the
  // day strip at the bottom turns the day, in reach of the thumb.
  const phoneView = (
    <div ref={phoneRef} className="flex h-dvh flex-col" style={{ "--day": page.day } as React.CSSProperties}>
      <div ref={headerRef} className="border-b">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <h2 className={cn("truncate text-sm font-semibold", shownDay.today && "text-primary")}>{fmtDate(shownDay.day, zone)}</h2>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <FilterSheet listings={listings} filters={filters} setFilters={setFilters} zone={prefs?.zone ?? null} setZone={setZone} nudge={nudge} />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <AppliedFilters filters={filters} setFilters={setFilters} />
      <div ref={pagerRef} onScroll={onDrag} className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        {dayLists.map((day, i) => (
          <div key={i} className="relative h-full w-full shrink-0 snap-start overflow-y-auto px-3 pb-6 [scrollbar-width:none]">
            <HourGrid days={[day]} zone={zone} now={now} nowHour={day.today ? nowHour : null} headers={false} onOpen={setOpen} />
          </div>
        ))}
      </div>
      <DayStrip
        days={dayLists}
        zone={zone}
        active={page.day}
        onPick={slideTo}
        previousWeek={weeks > 0 ? () => turnTo({ ...page, weeks: weeks - 1 }) : undefined}
        nextWeek={weeks < WEEKS_AHEAD ? () => turnTo({ ...page, weeks: weeks + 1 }) : undefined}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px]" style={{ "--header": `${headerHeight}px` } as React.CSSProperties}>
      <h1 className="sr-only">Virtual group sittings</h1>
      {phone ? phoneView : laptop}
      <SittingSheet slot={open} onClose={() => setOpen(null)} zone={zone} />
    </div>
  );
}
