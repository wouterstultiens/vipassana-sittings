// Variant C "Timetable": listing-first. One row per listing, one column per
// weekday, start times as chips. A "find a sitting that fits" bar on top
// narrows the rows; details open in a centred dialog.
import * as React from "react";
import { FilterXIcon, SlidersHorizontalIcon } from "lucide-react";
import type { VariantProps } from "../Prototype";
import { expandSittings, localDayStart, weekStart, ZONES, type Sitting } from "../lib/expand";
import { activeCount, DURATION_LABEL, EMPTY_FILTERS, sittingMatches, TIME_OF_DAY_LABEL, toggle, type Filters } from "../lib/filters";
import { displayHost, flag, fmtDuration, fmtTime, languageName, MEDIUM_LABEL, PLATFORM_LABEL, WEEKDAY_SHORT } from "../lib/labels";
import { ListingBadges, Notice, SittingDetails } from "../SittingDetails";
import { Button } from "../ui/button";
import { Chip, ZoneSelect } from "../ui/chip";
import { Dialog, DialogContent } from "../ui/sheet";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function VariantC({ listings, zone, setZone, filters, setFilters, now }: VariantProps) {
  const [more, setMore] = React.useState(false);
  const [hideOthers, setHideOthers] = React.useState(true);
  const [open, setOpen] = React.useState<{ sitting?: Sitting; listingId: number } | null>(null);
  const from = weekStart(now, zone);
  const to = localDayStart(from, zone, 7);
  const all = React.useMemo(() => expandSittings(listings, from, to, zone), [listings, from.getTime(), to.getTime(), zone]);
  const byListing = new Map<number, Sitting[]>();
  for (const s of all) byListing.set(s.listing.id, [...(byListing.get(s.listing.id) ?? []), s]);
  const languages = [...new Set(listings.flatMap((l) => l.languages))].sort((a, b) => languageName(a).localeCompare(languageName(b)));
  const platforms = [...new Set(listings.map((l) => l.platform))];
  const f = <K extends keyof Filters>(k: K) => (v: Filters[K] extends (infer U)[] ? U : never) =>
    setFilters((p) => ({ ...p, [k]: toggle(p[k] as unknown[], v) }));
  const rows = listings
    .filter((l) => l.scheduleRules.length > 0)
    .map((l) => {
      const items = byListing.get(l.id) ?? [];
      const hits = items.filter((s) => sittingMatches(s, filters));
      return { l, items, hits };
    })
    .sort((a, b) => b.hits.length - a.hits.length || (a.items[0]?.minutesFromMidnight ?? 0) - (b.items[0]?.minutesFromMidnight ?? 0));
  const visible = hideOthers && activeCount(filters) > 0 ? rows.filter((r) => r.hits.length) : rows;
  const noTime = listings.filter((l) => l.scheduleRules.length === 0);
  const openListing = open ? listings.find((l) => l.id === open.listingId)! : null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Find a group sitting that fits your week</h1>
          <p className="text-sm text-muted-foreground">Every virtual sitting listed on dhamma.org for old students, shown in your own time.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Your timezone <ZoneSelect value={zone} onChange={setZone} zones={ZONES} />
        </div>
      </header>

      <section className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
          <span className="text-sm font-medium">I want to sit on</span>
          <div className="flex flex-wrap gap-1">
            {DAY_ORDER.map((d) => (
              <Chip key={d} on={filters.weekdays.includes(d)} onClick={() => f("weekdays")(d)}>{WEEKDAY_SHORT[d]}</Chip>
            ))}
            <span className="ml-3 self-center text-sm font-medium">in the</span>
            {(Object.keys(TIME_OF_DAY_LABEL) as (keyof typeof TIME_OF_DAY_LABEL)[]).map((k) => (
              <Chip key={k} on={filters.timesOfDay.includes(k)} onClick={() => f("timesOfDay")(k)}>{TIME_OF_DAY_LABEL[k].split(" ")[0]}</Chip>
            ))}
          </div>
          <span className="text-sm font-medium">for</span>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(DURATION_LABEL) as (keyof typeof DURATION_LABEL)[]).map((k) => (
              <Chip key={k} on={filters.durations.includes(k)} onClick={() => f("durations")(k)}>{DURATION_LABEL[k]}</Chip>
            ))}
            <span className="ml-3 self-center text-sm font-medium">in</span>
            {["en", "fr", "es", "pt", "zh", "ar"].map((c) => (
              <Chip key={c} on={filters.languages.includes(c)} onClick={() => f("languages")(c)}>{languageName(c)}</Chip>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setMore((m) => !m)}>
              <SlidersHorizontalIcon /> {more ? "Fewer" : "More"} filters
            </Button>
          </div>
        </div>
        {more && (
          <div className="mt-3 flex flex-wrap gap-1 border-t pt-3">
            <Chip on={filters.teacherLed === true} onClick={() => setFilters((p) => ({ ...p, teacherLed: p.teacherLed ? null : true }))}>Teacher led</Chip>
            <Chip on={filters.questionsAndAnswers === true} onClick={() => setFilters((p) => ({ ...p, questionsAndAnswers: p.questionsAndAnswers ? null : true }))}>With Q&amp;A</Chip>
            <span className="mx-1 self-center text-muted-foreground">·</span>
            {(Object.keys(MEDIUM_LABEL) as (keyof typeof MEDIUM_LABEL)[]).map((k) => (
              <Chip key={k} on={filters.medium.includes(k)} onClick={() => f("medium")(k)}>{MEDIUM_LABEL[k]}</Chip>
            ))}
            <span className="mx-1 self-center text-muted-foreground">·</span>
            {platforms.map((p) => (
              <Chip key={p} on={filters.platforms.includes(p)} onClick={() => f("platforms")(p)}>{PLATFORM_LABEL[p]}</Chip>
            ))}
            <span className="mx-1 self-center text-muted-foreground">·</span>
            {languages.filter((c) => !["en", "fr", "es", "pt", "zh", "ar"].includes(c)).map((c) => (
              <Chip key={c} on={filters.languages.includes(c)} onClick={() => f("languages")(c)}>{languageName(c)}</Chip>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{visible.length} of {rows.length} listings{activeCount(filters) ? " match" : ""}</span>
          {activeCount(filters) > 0 && (
            <>
              <label className="flex items-center gap-1"><input type="checkbox" checked={hideOthers} onChange={(e) => setHideOthers(e.target.checked)} /> hide listings that do not match</label>
              <Button variant="ghost" size="sm" className="h-6" onClick={() => setFilters(EMPTY_FILTERS)}><FilterXIcon /> Clear</Button>
            </>
          )}
          <span className="ml-auto"><Notice compact /></span>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr>
              <th className="w-72 px-3 py-2 text-left font-medium">Listing</th>
              {DAY_ORDER.map((d) => {
                const date = localDayStart(from, zone, DAY_ORDER.indexOf(d));
                const isToday = now >= date && now < localDayStart(date, zone, 1);
                return (
                  <th key={d} className={`px-2 py-2 text-left font-medium ${isToday ? "text-primary" : ""}`}>
                    {WEEKDAY_SHORT[d]} <span className="font-normal text-muted-foreground">{new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: zone }).format(date)}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map(({ l, items, hits }) => (
              <tr key={l.id} className={`border-t align-top ${activeCount(filters) && !hits.length ? "opacity-40" : ""}`}>
                <td className="px-3 py-2">
                  <button className="text-left hover:underline" onClick={() => setOpen({ listingId: l.id })}>
                    <div className="font-medium leading-tight">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{flag(l.country)} {displayHost(l)} · {fmtDuration(l.scheduleRules[0].durationMinutes)}</div>
                  </button>
                  <div className="mt-1"><ListingBadges l={l} size="xs" /></div>
                </td>
                {DAY_ORDER.map((d) => (
                  <td key={d} className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {items
                        .filter((s) => s.local.getDay() === d)
                        .map((s) => {
                          const hit = hits.includes(s);
                          return (
                            <button
                              key={s.key}
                              onClick={() => setOpen({ sitting: s, listingId: l.id })}
                              title={s.rule.label ?? undefined}
                              className={`rounded-md border px-1.5 py-0.5 font-mono text-xs tabular-nums transition ${
                                activeCount(filters) && hit ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
                              } ${s.end < now ? "line-through opacity-60" : ""}`}
                            >
                              {fmtTime(s.start, zone)}
                              {s.crossesMidnight ? "⁺" : ""}
                            </button>
                          );
                        })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {noTime.map((l) => (
              <tr key={l.id} className="border-t bg-muted/30 align-top">
                <td className="px-3 py-2">
                  <button className="text-left hover:underline" onClick={() => setOpen({ listingId: l.id })}>
                    <div className="font-medium leading-tight">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{flag(l.country)} {displayHost(l)}</div>
                  </button>
                </td>
                <td colSpan={7} className="px-2 py-2 text-xs text-muted-foreground italic">No fixed time in the listing. Open it for details.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {openListing && (
          <DialogContent title={openListing.name}>
            <SittingDetails sitting={open?.sitting} listing={openListing} zone={zone} referenceDate={now} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
