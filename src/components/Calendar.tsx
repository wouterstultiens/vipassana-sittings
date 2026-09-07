// The calendar: day lists from today on one hour axis, seven side by side on
// a laptop and one per screen on a phone, under a toolbar that sticks to the
// top. Filters and the timezone come back from local storage on the next
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

/** How many days the calendar can show, from today: this week and the weeks ahead. */
const DAYS = 7 * (WEEKS_AHEAD + 1);

const PANE = "relative h-full w-full shrink-0 snap-start overflow-y-auto px-3 pb-6 [scrollbar-width:none]";

/** The width of a scroller, unrounded: clientWidth rounds to whole pixels and the fractions add up across the panes. */
const widthOf = (el: HTMLElement) => el.getBoundingClientRect().width;

/** One day pane on a phone: a scroller of its own that opens on the hour the other panes stand at. */
function Pane({ day, zone, now, nowHour, hour, onOpen }: { day: Day; zone: string; now: Date; nowHour: number | null; hour: React.RefObject<number>; onOpen: (slot: Slot) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (ref.current) jumpToHour(ref.current, hour.current);
  }, []);
  return (
    <div ref={ref} className={PANE}>
      <HourGrid days={[day]} zone={zone} now={now} nowHour={nowHour} headers={false} onOpen={onOpen} />
    </div>
  );
}

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

  // Where the calendar is open: the week from today on a laptop, the day from today on a phone.
  const [weeks, setWeeks] = React.useState(0);
  const [day, setDay] = React.useState(0);
  const [open, setOpen] = React.useState<Slot | null>(null);
  const phone = usePhone();

  // The start of every day the calendar can show, and the end of the last.
  const todayStart = localDayStart(now, zone);
  const todayTime = todayStart.getTime();
  const days = React.useMemo(() => Array.from({ length: DAYS + 1 }, (_, i) => localDayStart(todayStart, zone, i)), [todayTime, zone]);
  const starts = React.useMemo(() => days.slice(0, DAYS), [days]);
  const nowHour = hourIn(now, zone);

  // Only the days on or next to the screen get a day list: the week on a
  // laptop, the day and its two neighbours on a phone. The lists change
  // only with those days, the zone, or the filters, and stay stable across
  // the other renders (a row opening, the clock ticking), so the memoised
  // rows below skip their work.
  const [first, last] = phone ? [Math.max(0, day - 1), Math.min(DAYS - 1, day + 1)] : [7 * weeks, 7 * weeks + 6];
  const all = React.useMemo(() => expandSittings(listings, days[first], days[last + 1], zone), [listings, days, first, last, zone]);
  const dayLists = React.useMemo(() => {
    const shown = all.filter((s) => sittingMatches(s, filters));
    return new Map(
      Array.from({ length: last - first + 1 }, (_, n) => {
        const i = first + n;
        const slots = slotsOf(shown.filter((s) => s.start >= days[i] && s.start < days[i + 1]));
        return [i, { day: days[i], slots, today: i === 0 }] as const;
      }),
    );
  }, [all, filters, days, first, last]);

  // The phone's day panes sit in one row that snaps a pane per screen. Each
  // pane scrolls its own hours, so a drag peeks at the next day, and the
  // pane the drag would settle on is the day from the moment the drag passes
  // half way, so the toolbar names it before the finger lifts.
  const pagerRef = React.useRef<HTMLDivElement>(null);
  const panes = () => Array.from(pagerRef.current?.children ?? []) as HTMLElement[];
  // Where the hour jumps go: every pane on a phone, the page on a laptop.
  const scrollers = (): ParentNode[] => (phone ? panes() : [document]);

  // The header's height feeds --header, so the laptop's day headers and jumps land under it.
  const [headerRef, { height: headerHeight }] = useSize<HTMLDivElement>();

  // The hour at the top of the pane on screen when the last move started. A
  // pane that comes on next to it opens on that hour, so a peek shows the
  // same hour on the next day.
  const hour = React.useRef(0);

  // Once per layout, after the zone is known and the header is measured, so
  // the jump lands under it: open on the current hour, as a calendar does.
  // The phone layout arrives a render after hydration, so it gets its own jump.
  const scrolledFor = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (!prefs || !headerHeight || scrolledFor.current === phone) return;
    scrolledFor.current = phone;
    hour.current = nowHour;
    for (const s of scrollers()) jumpToHour(s, nowHour);
  }, [prefs, headerHeight, nowHour, phone]);

  // Turning the week on a laptop keeps the hour at the top of the view, so the
  // old student compares the same hour across days and weeks, as on a calendar.
  const keptHour = React.useRef<number | null>(null);
  const turnTo = (next: number) => {
    keptHour.current = hourInView(document);
    setWeeks(next);
  };
  React.useLayoutEffect(() => {
    if (keptHour.current === null) return;
    jumpToHour(document, keptHour.current);
    keptHour.current = null;
  }, [weeks]);

  // The strip's marker follows the drag through --day on the phone root: a
  // fraction between two days while the row moves, the day once it settles.
  const phoneRef = React.useRef<HTMLDivElement>(null);
  const settled = React.useRef(true);

  // Every other pane opens on the hour of the pane on screen.
  const alignPanes = () => {
    const all = panes();
    hour.current = hourInView(all[day]);
    all.forEach((pane, i) => i !== day && jumpToHour(pane, hour.current));
  };
  const onDrag = () => {
    const pager = pagerRef.current;
    if (!pager) return;
    const progress = pager.scrollLeft / widthOf(pager);
    phoneRef.current?.style.setProperty("--day", String(progress));
    const nearest = Math.round(progress);
    if (Math.abs(progress - nearest) < 0.01) {
      settled.current = true;
    } else if (settled.current) {
      settled.current = false;
      alignPanes();
    }
    if (nearest !== day) setDay(nearest);
  };
  const slideTo = (i: number) => {
    const pager = pagerRef.current;
    if (!pager) return;
    alignPanes();
    pager.scrollTo({ left: i * widthOf(pager), behavior: "smooth" });
  };
  // A turn to another week goes straight there, on the same hour: the strip already moved.
  const jump = React.useRef<number | null>(null);
  const jumpTo = (i: number) => {
    hour.current = hourInView(panes()[day]);
    jump.current = i;
    setDay(i);
  };
  React.useLayoutEffect(() => {
    const pager = pagerRef.current;
    if (jump.current === null || !pager) return;
    pager.scrollTo({ left: jump.current * widthOf(pager) });
    jump.current = null;
  }, [day]);
  const onWeek = (w: number) => {
    if (Math.floor(day / 7) !== w) jumpTo(7 * w + (day % 7));
  };

  const laptop = (
    <>
      <div ref={headerRef} className="sticky top-0 z-20 border-b bg-background">
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5">
          <Button variant="outline" size="icon-sm" disabled={weeks === 0} onClick={() => turnTo(weeks - 1)} aria-label="Previous week">
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" disabled={weeks === 0} onClick={() => turnTo(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" disabled={weeks === WEEKS_AHEAD} onClick={() => turnTo(weeks + 1)} aria-label="Next week">
            <ChevronRightIcon />
          </Button>
          <span className="ml-1 text-sm font-medium tabular-nums">
            {fmtDayMonth(days[7 * weeks], zone)} – {fmtDayMonthYear(days[7 * weeks + 6], zone)}
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
        <HourGrid days={starts.slice(first, last + 1).map((_, n) => dayLists.get(first + n)!)} zone={zone} now={now} nowHour={weeks === 0 ? nowHour : null} onOpen={setOpen} />
      </div>
    </>
  );

  // The phone fills the screen: the toolbar names the day in full, with the
  // filters and the theme at the right; the day panes take the middle; the
  // day strip at the bottom turns the day, in reach of the thumb.
  const phoneView = (
    <div ref={phoneRef} className="flex h-dvh flex-col">
      <div ref={headerRef} className="border-b">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <h2 className={cn("truncate text-sm font-semibold", day === 0 && "text-primary")}>{fmtDate(days[day], zone)}</h2>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <FilterSheet listings={listings} filters={filters} setFilters={setFilters} zone={prefs?.zone ?? null} setZone={setZone} nudge={nudge} />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <AppliedFilters filters={filters} setFilters={setFilters} />
      <div ref={pagerRef} onScroll={onDrag} className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        {starts.map((_, i) => {
          const list = dayLists.get(i);
          return list ? (
            <Pane key={i} day={list} zone={zone} now={now} nowHour={list.today ? nowHour : null} hour={hour} onOpen={setOpen} />
          ) : (
            <div key={i} className={PANE} />
          );
        })}
      </div>
      <DayStrip days={starts} zone={zone} active={day} onPick={slideTo} onWeek={onWeek} />
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
