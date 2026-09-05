// Variant A "Week grid": time-first. A Monday-to-Sunday grid with one row per
// hour; each cell lists the sittings that start in that hour, filters as popover dropdowns in a toolbar, and a right
// side sheet for the detail panel.
import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, FilterXIcon } from "lucide-react";
import type { VariantProps } from "../Prototype";
import { expandSittings, localDayStart, weekStart, ZONES, type Sitting } from "../lib/expand";
import { activeCount, DURATION_LABEL, EMPTY_FILTERS, sittingMatches, TIME_OF_DAY_LABEL, toggle, type Filters } from "../lib/filters";
import { displayHost, flag, fmtTime, languageName, MEDIUM_LABEL, PLATFORM_LABEL, WEEKDAY_SHORT, zoneAbbr } from "../lib/labels";
import { ListingBadges, Notice, SittingDetails } from "../SittingDetails";
import { Button } from "../ui/button";
import { Chip, ZoneSelect } from "../ui/chip";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Sheet, SheetContent } from "../ui/sheet";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function FilterMenu<T extends string | number>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={selected.length ? "default" : "outline"} size="sm">
          {label}
          {selected.length > 0 && <span className="rounded-full bg-white/30 px-1.5">{selected.length}</span>}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-80 overflow-y-auto">
        <ul className="space-y-1">
          {options.map((o) => (
            <li key={String(o.value)}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent">
                <input type="checkbox" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
                {o.label}
              </label>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function VariantA({ listings, zone, setZone, filters, setFilters, now }: VariantProps) {
  const [anchor, setAnchor] = React.useState(now);
  const [open, setOpen] = React.useState<{ sitting?: Sitting; listingId: number } | null>(null);
  const from = weekStart(anchor, zone);
  const to = localDayStart(from, zone, 7);
  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const shown = all.filter((s) => sittingMatches(s, filters));
  const days = Array.from({ length: 7 }, (_, i) => localDayStart(from, zone, i));
  const byDay = days.map((d, i) => shown.filter((s) => s.start >= d && s.start < (days[i + 1] ?? to)));
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const MAX = 3;
  const noTime = listings.filter((l) => l.scheduleRules.length === 0);
  const languages = [...new Set(listings.flatMap((l) => l.languages))].sort((a, b) => languageName(a).localeCompare(languageName(b)));
  const platforms = [...new Set(listings.map((l) => l.platform))];
  const openListing = open ? listings.find((l) => l.id === open.listingId)! : null;
  const todayIdx = days.findIndex((d, i) => now >= d && now < (days[i + 1] ?? to));
  const f = <K extends keyof Filters>(k: K) => (v: Filters[K] extends (infer U)[] ? U : never) =>
    setFilters((p) => ({ ...p, [k]: toggle(p[k] as unknown[], v) }));

  return (
    <div className="mx-auto flex h-screen max-w-[1400px] flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Virtual group sittings</h1>
        <span className="text-sm text-muted-foreground">for old students · every listing on dhamma.org, in your time</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Times in</span>
          <ZoneSelect value={zone} onChange={setZone} zones={ZONES} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <Button variant="outline" size="icon" className="size-8" onClick={() => setAnchor(localDayStart(anchor, zone, -7))} aria-label="Previous week">
          <ChevronLeftIcon />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAnchor(now)}>Today</Button>
        <Button variant="outline" size="icon" className="size-8" onClick={() => setAnchor(localDayStart(anchor, zone, 7))} aria-label="Next week">
          <ChevronRightIcon />
        </Button>
        <span className="ml-1 text-sm font-medium tabular-nums">
          {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: zone }).format(from)} – {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: zone }).format(days[6])}
        </span>
        <div className="mx-2 h-6 w-px bg-border" />
        <FilterMenu label="Weekday" options={DAY_ORDER.map((d) => ({ value: d, label: WEEKDAY_SHORT[d] }))} selected={filters.weekdays} onToggle={f("weekdays")} />
        <FilterMenu label="Time of day" options={(Object.keys(TIME_OF_DAY_LABEL) as (keyof typeof TIME_OF_DAY_LABEL)[]).map((k) => ({ value: k, label: TIME_OF_DAY_LABEL[k] }))} selected={filters.timesOfDay} onToggle={f("timesOfDay")} />
        <FilterMenu label="Duration" options={(Object.keys(DURATION_LABEL) as (keyof typeof DURATION_LABEL)[]).map((k) => ({ value: k, label: DURATION_LABEL[k] }))} selected={filters.durations} onToggle={f("durations")} />
        <FilterMenu label="Language" options={languages.map((c) => ({ value: c, label: languageName(c) }))} selected={filters.languages} onToggle={f("languages")} />
        <FilterMenu label="Medium" options={(Object.keys(MEDIUM_LABEL) as (keyof typeof MEDIUM_LABEL)[]).map((k) => ({ value: k, label: MEDIUM_LABEL[k] }))} selected={filters.medium} onToggle={f("medium")} />
        <FilterMenu label="Platform" options={platforms.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))} selected={filters.platforms} onToggle={f("platforms")} />
        <Chip on={filters.teacherLed === true} onClick={() => setFilters((p) => ({ ...p, teacherLed: p.teacherLed ? null : true }))}>Teacher led</Chip>
        <Chip on={filters.questionsAndAnswers === true} onClick={() => setFilters((p) => ({ ...p, questionsAndAnswers: p.questionsAndAnswers ? null : true }))}>With Q&amp;A</Chip>
        {activeCount(filters) > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            <FilterXIcon /> Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{shown.length} of {all.length} sittings this week</span>
      </div>

      <div className="px-4 pt-2">
        <Notice compact />
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="grid min-w-[900px] grid-cols-[3rem_repeat(7,minmax(0,1fr))]">
          <div />
          {days.map((d, i) => (
            <div key={i} className={`sticky top-0 z-10 border-b bg-background py-1.5 text-center text-sm ${i === todayIdx ? "font-semibold text-primary" : ""}`}>
              {new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: zone }).format(d)}{" "}
              <span className={i === todayIdx ? "rounded-full bg-primary px-1.5 text-primary-foreground" : "text-muted-foreground"}>
                {new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: zone }).format(d)}
              </span>
            </div>
          ))}
          {Array.from({ length: 24 }, (_, h) => (
            <React.Fragment key={h}>
              <div className="border-t py-1 pr-1 text-right text-[10px] text-muted-foreground tabular-nums">{String(h).padStart(2, "0")}:00</div>
              {byDay.map((items, di) => {
                const cell = items.filter((s) => Math.floor(s.minutesFromMidnight / 60) === h);
                const key = `${di}-${h}`;
                const isOpen = expanded.has(key);
                const show = isOpen ? cell : cell.slice(0, MAX);
                const nowHour = di === todayIdx && Math.floor((now.getTime() - days[di].getTime()) / 3_600_000) === h;
                return (
                  <div key={di} className={`min-h-6 space-y-0.5 border-t border-l p-0.5 ${di === todayIdx ? "bg-primary/5" : ""} ${nowHour ? "border-t-2 border-t-red-500" : ""}`}>
                    {show.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setOpen({ sitting: s, listingId: s.listing.id })}
                        title={s.listing.name}
                        className={`flex w-full items-center gap-1 truncate rounded border px-1 py-0.5 text-left text-[11px] leading-tight hover:shadow ${
                          s.listing.teacherLed ? "border-primary/40 bg-primary/15" : "border-amber-300/60 bg-amber-100/70"
                        } ${s.end < now ? "opacity-50" : ""}`}
                      >
                        <span className="font-semibold tabular-nums">{fmtTime(s.start, zone)}</span>
                        <span className="truncate">{flag(s.listing.country)} {s.listing.name}</span>
                      </button>
                    ))}
                    {cell.length > MAX && (
                      <button
                        className="w-full rounded px-1 text-left text-[11px] text-primary hover:underline"
                        onClick={() => setExpanded((e) => { const n = new Set(e); isOpen ? n.delete(key) : n.add(key); return n; })}
                      >
                        {isOpen ? "show less" : `+${cell.length - MAX} more`}
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
            {noTime.map((l) => (
              <button key={l.id} onClick={() => setOpen({ listingId: l.id })} className="rounded-lg border p-3 text-left hover:bg-accent">
                <div className="text-xs text-muted-foreground">{flag(l.country)} {displayHost(l)}</div>
                <div className="text-sm font-medium">{l.name}</div>
                <div className="mt-1"><ListingBadges l={l} size="xs" /></div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {openListing && (
          <SheetContent title={openListing.name}>
            <SittingDetails sitting={open?.sitting} listing={openListing} zone={zone} referenceDate={anchor} />
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
