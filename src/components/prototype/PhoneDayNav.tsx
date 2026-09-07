// PROTOTYPE, throwaway. Three variants of the phone's way between days, on
// the existing / route, switchable via ?variant=A|B|C and a floating bar.
//   A: a day pager in the toolbar, the day strip under it, and a "next day"
//      row at the end of the list.
//   B: the day strip fixed at the bottom of the screen, the day's name in
//      the toolbar.
//   C: the shadcn Carousel (Embla): the seven days side by side, swipe or
//      arrows to turn, the next day peeking in at the edge.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { WEEKS_AHEAD } from "@/lib/expand";
import type { Filters, SetFilters } from "@/lib/filters";
import { fmtDate, fmtDayMonth, fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
import { turnDay, type Page } from "@/lib/page";
import type { Slot } from "@/lib/slots";
import { AppliedFilters } from "@/components/AppliedFilters";
import { FilterSheet } from "@/components/FilterSheet";
import { HourGrid, type Day } from "@/components/HourGrid";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type PhoneProps = {
  headerRef: React.RefCallback<HTMLDivElement>;
  dayLists: Day[];
  zone: string;
  now: Date;
  nowHour: number | null;
  page: Page;
  turnTo: (next: Page) => void; // keeps the hour at the top of the view
  setPage: (next: Page) => void; // does not
  listings: Listing[];
  filters: Filters;
  setFilters: SetFilters;
  prefZone: string | null;
  setZone: (z: string | null) => void;
  onOpen: (slot: Slot) => void;
};

const VARIANTS = ["A", "B", "C"] as const;
type Variant = (typeof VARIANTS)[number];
const NAMES: Record<Variant, string> = { A: "Day pager + next-day row", B: "Bottom day strip", C: "Carousel" };

const dayTitle = (d: Date, zone: string) => fmtDate(d, zone, { weekday: "long", day: "numeric", month: "short" });

export function PhoneDayNav(props: PhoneProps) {
  const [variant, setVariant] = React.useState<Variant>("A");
  React.useEffect(() => {
    const v = new URLSearchParams(location.search).get("variant");
    if (v && (VARIANTS as readonly string[]).includes(v)) setVariant(v as Variant);
  }, []);
  const cycle = (dir: 1 | -1) => {
    const next = VARIANTS[(VARIANTS.indexOf(variant) + dir + VARIANTS.length) % VARIANTS.length];
    const url = new URL(location.href);
    url.searchParams.set("variant", next);
    history.replaceState(null, "", url);
    setVariant(next);
  };
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const View = { A: VariantA, B: VariantB, C: VariantC }[variant];
  return (
    <>
      <View {...props} />
      {import.meta.env.DEV && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900 px-1 py-1 text-xs font-medium text-white shadow-lg ring-2 ring-fuchsia-500">
          <button type="button" onClick={() => cycle(-1)} className="rounded-full px-2 py-1 hover:bg-white/15" aria-label="Previous variant">
            ←
          </button>
          <span className="px-1 whitespace-nowrap">
            {variant} ({NAMES[variant]})
          </span>
          <button type="button" onClick={() => cycle(1)} className="rounded-full px-2 py-1 hover:bg-white/15" aria-label="Next variant">
            →
          </button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared bits: the filter sheet button and the day strip. Each variant lays
// them out its own way.

const filterButton = (p: PhoneProps) => (
  <FilterSheet listings={p.listings} filters={p.filters} setFilters={p.setFilters} zone={p.prefZone} setZone={p.setZone} />
);

function Strip({ days, zone, active, onPick, stacked }: { days: Day[]; zone: string; active: number; onPick: (i: number) => void; stacked?: boolean }) {
  return (
    <nav aria-label="Days" className="flex flex-1 gap-1">
      {days.map(({ day, today }, i) => (
        <button
          key={day.getTime()}
          type="button"
          onClick={() => onPick(i)}
          aria-current={i === active ? "date" : undefined}
          className={cn(
            "flex flex-1 justify-center rounded-md text-xs whitespace-nowrap",
            stacked ? "flex-col items-center py-1 leading-tight" : "items-baseline gap-1 py-1",
            i === active ? "bg-primary text-primary-foreground" : today ? "text-primary hover:bg-accent" : "text-muted-foreground hover:bg-accent",
          )}
        >
          <span>{fmtWeekday(day, zone)}</span>
          <span className={cn("font-semibold", stacked && "text-base", i !== active && !today && "text-foreground")}>{fmtDayOfMonth(day, zone)}</span>
        </button>
      ))}
    </nav>
  );
}

const grid = (p: PhoneProps, i: number) => (
  <HourGrid days={[p.dayLists[i]]} zone={p.zone} now={p.now} nowHour={p.dayLists[i].today ? p.nowHour : null} onOpen={p.onOpen} />
);

// ---------------------------------------------------------------------------
// Variant A: day pager in the toolbar, strip under it, next-day row at the end.

function VariantA(p: PhoneProps) {
  const { page, turnTo, dayLists, zone } = p;
  const prev = turnDay(page, -1);
  const next = turnDay(page, 1);
  const day = dayLists[page.day].day;
  // The next day's date, also across the week edge.
  const nextDay = next.weeks === page.weeks ? dayLists[next.day].day : new Date(dayLists[6].day.getTime() + 86_400_000);
  return (
    <>
      <div ref={p.headerRef} className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-1 px-3 py-1.5">
          <Button variant="outline" size="icon-sm" disabled={prev === page} onClick={() => turnTo(prev)} aria-label="Previous day">
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" disabled={next === page} onClick={() => turnTo(next)} aria-label="Next day">
            <ChevronRightIcon />
          </Button>
          <span className="ml-1 truncate text-sm font-medium">{dayTitle(day, zone)}</span>
          <div className="ml-auto">{filterButton(p)}</div>
        </div>
        <div className="flex px-2 pb-1.5">
          <Strip days={dayLists} zone={zone} active={page.day} onPick={(d) => turnTo({ ...page, day: d })} />
        </div>
      </div>
      <AppliedFilters filters={p.filters} setFilters={p.setFilters} />
      <div className="px-3 pb-6">
        {grid(p, page.day)}
        {next !== page && (
          <Button variant="outline" className="mt-3 h-11 w-full justify-between" onClick={() => turnTo(next)}>
            <span className="text-muted-foreground">Next day</span>
            <span className="flex items-center gap-1 font-semibold">
              {dayTitle(nextDay, zone)} <ChevronRightIcon />
            </span>
          </Button>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Variant B: the day strip fixed at the bottom, in thumb reach.

function VariantB(p: PhoneProps) {
  const { page, turnTo, dayLists, zone } = p;
  const day = dayLists[page.day].day;
  return (
    <>
      <div ref={p.headerRef} className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-sm font-semibold">{dayTitle(day, zone)}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {fmtDayMonth(dayLists[0].day, zone)} – {fmtDayMonth(dayLists[6].day, zone)}
          </span>
          <div className="ml-auto">{filterButton(p)}</div>
        </div>
      </div>
      <AppliedFilters filters={p.filters} setFilters={p.setFilters} />
      <div className="px-3 pb-28">{grid(p, page.day)}</div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Button variant="ghost" size="icon-sm" disabled={page.weeks === 0} onClick={() => turnTo({ weeks: page.weeks - 1, day: 0 })} aria-label="Previous week">
            <ChevronLeftIcon />
          </Button>
          <Strip stacked days={dayLists} zone={zone} active={page.day} onPick={(d) => turnTo({ ...page, day: d })} />
          <Button variant="ghost" size="icon-sm" disabled={page.weeks === WEEKS_AHEAD} onClick={() => turnTo({ weeks: page.weeks + 1, day: 0 })} aria-label="Next week">
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Variant C: the shadcn Carousel. Seven days side by side, the next one
// peeking in at the right edge, arrows at the bottom corners.
// Note: the seven grids repeat the hour ids, so a turn keeps the pixel
// position, not the hour, and the page is as tall as the longest day.

function VariantC(p: PhoneProps) {
  const { page, setPage, dayLists, zone } = p;
  const [api, setApi] = React.useState<CarouselApi>();
  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setPage({ ...page, day: api.selectedScrollSnap() });
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, page, setPage]);
  React.useEffect(() => {
    if (api && api.selectedScrollSnap() !== page.day) api.scrollTo(page.day);
  }, [api, page.day]);
  const week = (w: number) => {
    setPage({ weeks: w, day: 0 });
    api?.scrollTo(0, true);
  };
  return (
    <>
      <div ref={p.headerRef} className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Button variant="outline" size="icon-sm" disabled={page.weeks === 0} onClick={() => week(page.weeks - 1)} aria-label="Previous week">
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" disabled={page.weeks === WEEKS_AHEAD} onClick={() => week(page.weeks + 1)} aria-label="Next week">
            <ChevronRightIcon />
          </Button>
          <span className="ml-1 text-sm font-medium tabular-nums">
            {fmtDayMonth(dayLists[0].day, zone)} – {fmtDayMonth(dayLists[6].day, zone)}
          </span>
          <div className="ml-auto">{filterButton(p)}</div>
        </div>
        <div className="flex px-2 pb-1.5">
          <Strip days={dayLists} zone={zone} active={page.day} onPick={(d) => api?.scrollTo(d)} />
        </div>
      </div>
      <AppliedFilters filters={p.filters} setFilters={p.setFilters} />
      <Carousel setApi={setApi} opts={{ align: "start", containScroll: "trimSnaps" }} className="pb-6 pl-3">
        <CarouselContent className="-ml-2 items-start">
          {dayLists.map((d, i) => (
            <CarouselItem key={d.day.getTime()} className="basis-[92%] pl-2">
              {grid(p, i)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 flex justify-between">
        <Button variant="outline" size="icon" className="pointer-events-auto rounded-full shadow-md" disabled={!api?.canScrollPrev()} onClick={() => api?.scrollPrev()} aria-label="Previous day">
          <ChevronLeftIcon />
        </Button>
        <Button variant="outline" size="icon" className="pointer-events-auto rounded-full shadow-md" disabled={!api?.canScrollNext()} onClick={() => api?.scrollNext()} aria-label="Next day">
          <ChevronRightIcon />
        </Button>
      </div>
    </>
  );
}
