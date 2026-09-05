// Variant B "Agenda": list-first. A rolling list of the next days from now,
// a "happening now and next" strip on top, all filters visible as chips in a
// left sidebar, and details unfold inline under the row you click.
import * as React from "react";
import { ChevronDownIcon, FilterXIcon, RadioIcon } from "lucide-react";
import type { VariantProps } from "../Prototype";
import { expandSittings, localDayStart, ZONES, type Sitting } from "../lib/expand";
import { activeCount, DURATION_LABEL, EMPTY_FILTERS, sittingMatches, TIME_OF_DAY_LABEL, toggle, type Filters } from "../lib/filters";
import { displayHost, flag, fmtDate, fmtDuration, fmtTime, languageName, MEDIUM_LABEL, PLATFORM_LABEL, WEEKDAY_SHORT } from "../lib/labels";
import { ListingBadges, Notice, SittingDetails } from "../SittingDetails";
import { Button } from "../ui/button";
import { Chip, ZoneSelect } from "../ui/chip";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{title}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

export function VariantB({ listings, zone, setZone, filters, setFilters, now }: VariantProps) {
  const [daysAhead, setDaysAhead] = React.useState(7);
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const from = localDayStart(now, zone, 0);
  const to = localDayStart(now, zone, daysAhead);
  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const shown = all.filter((s) => sittingMatches(s, filters));
  const live = shown.filter((s) => s.start <= now && s.end > now);
  const next = shown.filter((s) => s.start > now).slice(0, 4);
  const days = Array.from({ length: daysAhead }, (_, i) => localDayStart(now, zone, i));
  const noTime = listings.filter((l) => l.scheduleRules.length === 0);
  const languages = [...new Set(listings.flatMap((l) => l.languages))].sort((a, b) => languageName(a).localeCompare(languageName(b)));
  const platforms = [...new Set(listings.map((l) => l.platform))];
  const f = <K extends keyof Filters>(k: K) => (v: Filters[K] extends (infer U)[] ? U : never) =>
    setFilters((p) => ({ ...p, [k]: toggle(p[k] as unknown[], v) }));
  const dayTitle = (d: Date, i: number) => (i === 0 ? "Today" : i === 1 ? "Tomorrow" : fmtDate(d, zone, { weekday: "long" })) + " · " + fmtDate(d, zone, { day: "numeric", month: "long" });

  const Row = ({ s, compact = false }: { s: Sitting; compact?: boolean }) => {
    const isOpen = openKey === s.key;
    const past = s.end < now;
    return (
      <li className={`rounded-lg border bg-card ${isOpen ? "ring-2 ring-primary/40" : ""} ${past ? "opacity-50" : ""}`}>
        <button className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent/50" onClick={() => setOpenKey(isOpen ? null : s.key)}>
          <div className="w-24 shrink-0 tabular-nums">
            <div className="text-base font-semibold">{fmtTime(s.start, zone)}</div>
            <div className="text-xs text-muted-foreground">{fmtDuration(s.rule.durationMinutes)}{s.crossesMidnight ? " · +1" : ""}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{s.listing.name}{s.rule.label ? <span className="font-normal text-muted-foreground"> · {s.rule.label}</span> : null}</div>
            <div className="truncate text-xs text-muted-foreground">{flag(s.listing.country)} {displayHost(s.listing)} · {fmtTime(s.start, s.rule.timeZone)} local</div>
            {!compact && <div className="mt-1"><ListingBadges l={s.listing} size="xs" /></div>}
          </div>
          <ChevronDownIcon className={`size-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="border-t bg-background">
            <SittingDetails sitting={s} listing={s.listing} zone={zone} referenceDate={now} />
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[16rem_1fr] gap-6 px-4 py-4">
      <aside className="sticky top-4 h-fit space-y-4 text-sm">
        <div>
          <h1 className="text-lg font-semibold">Virtual group sittings</h1>
          <p className="text-xs text-muted-foreground">For old students. All times in your timezone.</p>
        </div>
        <ZoneSelect value={zone} onChange={setZone} zones={ZONES} className="w-full max-w-none" />
        <Group title="Weekday">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <Chip key={d} on={filters.weekdays.includes(d)} onClick={() => f("weekdays")(d)}>{WEEKDAY_SHORT[d]}</Chip>
          ))}
        </Group>
        <Group title="Time of day">
          {(Object.keys(TIME_OF_DAY_LABEL) as (keyof typeof TIME_OF_DAY_LABEL)[]).map((k) => (
            <Chip key={k} on={filters.timesOfDay.includes(k)} onClick={() => f("timesOfDay")(k)}>{TIME_OF_DAY_LABEL[k]}</Chip>
          ))}
        </Group>
        <Group title="Duration">
          {(Object.keys(DURATION_LABEL) as (keyof typeof DURATION_LABEL)[]).map((k) => (
            <Chip key={k} on={filters.durations.includes(k)} onClick={() => f("durations")(k)}>{DURATION_LABEL[k]}</Chip>
          ))}
        </Group>
        <Group title="Format">
          <Chip on={filters.teacherLed === true} onClick={() => setFilters((p) => ({ ...p, teacherLed: p.teacherLed ? null : true }))}>Teacher led</Chip>
          <Chip on={filters.questionsAndAnswers === true} onClick={() => setFilters((p) => ({ ...p, questionsAndAnswers: p.questionsAndAnswers ? null : true }))}>With Q&amp;A</Chip>
          {(Object.keys(MEDIUM_LABEL) as (keyof typeof MEDIUM_LABEL)[]).map((k) => (
            <Chip key={k} on={filters.medium.includes(k)} onClick={() => f("medium")(k)}>{MEDIUM_LABEL[k]}</Chip>
          ))}
        </Group>
        <Group title="Language">
          {languages.map((c) => (
            <Chip key={c} on={filters.languages.includes(c)} onClick={() => f("languages")(c)}>{languageName(c)}</Chip>
          ))}
        </Group>
        <Group title="Platform">
          {platforms.map((p) => (
            <Chip key={p} on={filters.platforms.includes(p)} onClick={() => f("platforms")(p)}>{PLATFORM_LABEL[p]}</Chip>
          ))}
        </Group>
        {activeCount(filters) > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            <FilterXIcon /> Clear {activeCount(filters)} filters
          </Button>
        )}
        <Notice compact />
      </aside>

      <main className="space-y-6">
        <section className="rounded-xl border bg-gradient-to-br from-amber-50 to-background p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <RadioIcon className="size-4 text-red-500" /> {live.length ? `Sitting now (${live.length})` : "Nothing is sitting right now"}
            <span className="ml-auto text-xs font-normal text-muted-foreground">Up next</span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[...live, ...next].slice(0, 4).map((s) => (
              <Row key={s.key} s={s} compact />
            ))}
          </ul>
        </section>

        {days.map((d, i) => {
          const items = shown.filter((s) => s.start >= d && s.start < localDayStart(now, zone, i + 1));
          return (
            <section key={i}>
              <h2 className="sticky top-0 z-10 -mx-1 mb-2 bg-background/95 px-1 py-1 text-sm font-semibold backdrop-blur">
                {dayTitle(d, i)} <span className="font-normal text-muted-foreground">· {items.length}</span>
              </h2>
              {items.length ? (
                <ul className="space-y-1.5">
                  {items.map((s) => (
                    <Row key={s.key} s={s} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No sitting matches your filters on this day.</p>
              )}
            </section>
          );
        })}
        <Button variant="outline" onClick={() => setDaysAhead((d) => d + 7)}>Show 7 more days</Button>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Without a fixed time · see details</h2>
          <ul className="space-y-1.5">
            {noTime.map((l) => {
              const isOpen = openKey === `listing-${l.id}`;
              return (
                <li key={l.id} className="rounded-lg border bg-card">
                  <button className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent/50" onClick={() => setOpenKey(isOpen ? null : `listing-${l.id}`)}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{flag(l.country)} {displayHost(l)}</div>
                    </div>
                    <ChevronDownIcon className={`size-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && <div className="border-t"><SittingDetails listing={l} zone={zone} referenceDate={now} /></div>}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
