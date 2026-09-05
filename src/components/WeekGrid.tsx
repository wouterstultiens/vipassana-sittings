// The calendar: a Monday-to-Sunday grid with one row per hour of the old
// student's day. Each cell holds the sittings that start in that hour. Listings
// without a schedule rule sit under the grid. Opening any of them opens the
// detail panel.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { expandSittings, hourInZone, localDayStart, localHour, weekStart, WEEKS_AHEAD, type Sitting } from "@/lib/expand";
import { EMPTY_FILTERS, listingMatches, sittingMatches, type Filters } from "@/lib/filters";
import { displayHost, durationTag, flag, fmtDayMonth, fmtDayMonthYear, fmtDayOfMonth, fmtTime, fmtWeekday } from "@/lib/labels";
import { FilterToolbar } from "@/components/FilterToolbar";
import { ListingBadges } from "@/components/ListingBadges";
import { Notice } from "@/components/Notice";
import { SittingSheet, type PanelTarget } from "@/components/SittingSheet";
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
        sitting.listing.teacherLed ? "border-primary/40 bg-primary/15" : "border-amber-300/60 bg-amber-100/70"
      } ${tag ? "border-l-4 border-l-primary" : ""} ${past ? "opacity-50" : ""}`}
    >
      <span className="font-semibold tabular-nums">{fmtTime(sitting.start, zone)}</span>
      <span className="truncate">
        {flag(sitting.listing.country)} {sitting.listing.name}
      </span>
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
  const [target, setTarget] = React.useState<PanelTarget | null>(null);

  const thisWeek = weekStart(now, zone);
  const from = localDayStart(thisWeek, zone, 7 * weeksAhead);
  const to = localDayStart(from, zone, 7);
  const days = Array.from({ length: 7 }, (_, i) => localDayStart(from, zone, i));
  const dayEnd = (i: number) => days[i + 1] ?? to;

  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const shown = all.filter((s) => sittingMatches(s, filters));
  const byDay = days.map((d, i) => shown.filter((s) => s.start >= d && s.start < dayEnd(i)));
  const withoutFixedTime = listings.filter((l) => l.scheduleRules.length === 0 && listingMatches(l, filters));
  const todayIdx = days.findIndex((d, i) => now >= d && now < dayEnd(i));
  const nowHour = hourInZone(now, zone);

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
              <div className="border-t py-1 pr-1 text-right text-[10px] text-muted-foreground tabular-nums">
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
                      <GridSitting
                        key={s.key}
                        sitting={s}
                        zone={zone}
                        past={s.end < now}
                        onOpen={() => setTarget({ listing: s.listing, sitting: s })}
                      />
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

        <section className="mt-6">
          <h2 className="text-sm font-semibold">Without a fixed time · see details</h2>
          <p className="mb-2 text-xs text-muted-foreground">These listings give no schedule we can place on the grid.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {withoutFixedTime.map((l) => (
              <button key={l.id} type="button" onClick={() => setTarget({ listing: l })} className="rounded-lg border p-3 text-left hover:bg-accent">
                <div className="text-xs text-muted-foreground">
                  {flag(l.country)} {displayHost(l)}
                </div>
                <div className="text-sm font-medium">{l.name}</div>
                <div className="mt-1">
                  <ListingBadges listing={l} size="xs" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <SittingSheet target={target} onClose={() => setTarget(null)} zone={zone} referenceDate={from} />
    </div>
  );
}
