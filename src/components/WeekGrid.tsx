// The calendar: a Monday-to-Sunday grid with one row per hour of the old
// student's day. Each cell holds the sittings that start in that hour. Opening
// one opens the detail panel.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { expandSittings, hourInZone, localDayStart, localHour, weekStart, WEEKS_AHEAD, type Sitting } from "@/lib/expand";
import { EMPTY_FILTERS, sittingMatches, type Filters } from "@/lib/filters";
import { durationTag, fmtDayMonth, fmtDayMonthYear, fmtDayOfMonth, fmtTime, fmtWeekday } from "@/lib/labels";
import { FilterToolbar } from "@/components/FilterToolbar";
import { Notice } from "@/components/Notice";
import { SittingSheet } from "@/components/SittingSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { oldStudentZone, ZoneSelect } from "@/components/ZoneSelect";
import { Button } from "@/components/ui/button";

const PER_CELL = 3;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function GridSitting({ sitting, zone, past, onOpen }: { sitting: Sitting; zone: string; past: boolean; onOpen: () => void }) {
  const tag = durationTag(sitting.rule.durationMinutes);
  return (
    <button
      type="button"
      onClick={onOpen}
      title={sitting.listing.name}
      className={`flex w-full items-center gap-1 truncate rounded border px-1 py-0.5 text-left text-[11px] leading-tight hover:shadow ${
        sitting.listing.teacherLed
          ? "border-primary/40 bg-primary/15"
          : "border-amber-300/60 bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/10"
      } ${tag ? "border-l-4 border-l-primary" : ""} ${past ? "opacity-50" : ""}`}
    >
      <span className="font-semibold tabular-nums">{fmtTime(sitting.start, zone)}</span>
      <span className="truncate">{sitting.listing.name}</span>
      {tag && <span className="ml-auto shrink-0 rounded bg-background/70 px-1 tabular-nums">{tag}</span>}
    </button>
  );
}

export function WeekGrid({ listings, builtAt }: { listings: Listing[]; builtAt: string }) {
  // The server render knows neither the old student's zone nor the current
  // time, so it draws the build-time week in UTC and the browser corrects it on
  // mount.
  const [view, setView] = React.useState(() => ({ zone: "UTC", now: new Date(builtAt) }));
  React.useEffect(() => setView({ zone: oldStudentZone(), now: new Date() }), []);
  const { zone, now } = view;

  const [weeksAhead, setWeeksAhead] = React.useState(0);
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [open, setOpen] = React.useState<Sitting | null>(null);

  const thisWeek = weekStart(now, zone);
  const from = localDayStart(thisWeek, zone, 7 * weeksAhead);
  const to = localDayStart(from, zone, 7);
  const days = Array.from({ length: 7 }, (_, i) => localDayStart(from, zone, i));
  const dayEnd = (i: number) => days[i + 1] ?? to;

  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const shown = all.filter((s) => sittingMatches(s, filters));
  const byDay = days.map((d, i) => shown.filter((s) => s.start >= d && s.start < dayEnd(i)));
  const todayIdx = days.findIndex((d, i) => now >= d && now < dayEnd(i));
  const nowHour = hourInZone(now, zone);

  // Open on the hour the old student is in, not on the empty small hours.
  const focusRow = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    focusRow.current?.scrollIntoView({ block: "start" });
  }, [zone]);

  return (
    <div className="mx-auto flex h-screen max-w-[1400px] flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Virtual group sittings</h1>
        <span className="text-sm text-muted-foreground">
          for old students · every listing on dhamma.org, in your time
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Times in</span>
          <ZoneSelect value={zone} onChange={(z) => setView((v) => ({ ...v, zone: z }))} />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={weeksAhead === 0}
          onClick={() => setWeeksAhead((w) => w - 1)}
          aria-label="Previous week"
        >
          <ChevronLeftIcon />
        </Button>
        <Button variant="outline" size="sm" disabled={weeksAhead === 0} onClick={() => setWeeksAhead(0)}>
          Today
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={weeksAhead === WEEKS_AHEAD}
          onClick={() => setWeeksAhead((w) => w + 1)}
          aria-label="Next week"
        >
          <ChevronRightIcon />
        </Button>
        <span className="ml-1 text-sm font-medium tabular-nums">
          {fmtDayMonth(from, zone)} – {fmtDayMonthYear(days[6], zone)}
        </span>
        <div className="mx-2 h-6 w-px bg-border" />
        <FilterToolbar listings={listings} filters={filters} setFilters={setFilters} shown={shown.length} total={all.length} />
      </div>

      <div className="px-4 pt-2">
        <Notice compact />
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="grid min-w-[900px] grid-cols-[3rem_repeat(7,minmax(0,1fr))]">
          <div />
          {days.map((d, i) => (
            <div
              key={i}
              className={`sticky top-0 z-10 border-b bg-background py-1.5 text-center text-sm ${i === todayIdx ? "font-semibold text-primary" : ""}`}
            >
              {fmtWeekday(d, zone)}{" "}
              <span className={i === todayIdx ? "rounded-full bg-primary px-1.5 text-primary-foreground" : "text-muted-foreground"}>
                {fmtDayOfMonth(d, zone)}
              </span>
            </div>
          ))}
          {HOURS.map((h) => (
            <React.Fragment key={h}>
              <div
                ref={h === nowHour ? focusRow : undefined}
                className="border-t py-1 pr-1 text-right text-[10px] text-muted-foreground tabular-nums"
              >
                {String(h).padStart(2, "0")}:00
              </div>
              {byDay.map((items, di) => {
                const cell = items.filter((s) => localHour(s) === h);
                const key = `${di}-${h}`;
                const isOpen = expanded.has(key);
                const visible = isOpen ? cell : cell.slice(0, PER_CELL);
                return (
                  <div
                    key={di}
                    className={`min-h-6 space-y-0.5 border-t border-l p-0.5 ${di === todayIdx ? "bg-primary/5" : ""} ${
                      di === todayIdx && h === nowHour ? "border-t-2 border-t-red-500" : ""
                    }`}
                  >
                    {visible.map((s) => (
                      <GridSitting key={s.key} sitting={s} zone={zone} past={s.end < now} onOpen={() => setOpen(s)} />
                    ))}
                    {cell.length > PER_CELL && (
                      <button
                        className="w-full rounded px-1 text-left text-[11px] text-primary hover:underline"
                        onClick={() =>
                          setExpanded((e) => {
                            const next = new Set(e);
                            if (isOpen) next.delete(key);
                            else next.add(key);
                            return next;
                          })
                        }
                      >
                        {isOpen ? "show less" : `+${cell.length - PER_CELL} more`}
                      </button>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <SittingSheet sitting={open} onClose={() => setOpen(null)} zone={zone} />
    </div>
  );
}
