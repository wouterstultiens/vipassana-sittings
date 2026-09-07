// The phone's way between days: every day the calendar can show, Monday to
// Sunday, seven per screen, in a strip at the bottom of the screen that snaps
// a week per screen, with the week arrows at the ends. The days of this week
// that are gone are dimmed. A tap turns to that day. The strip follows the
// day on screen into its week, and a week the strip is brought to, by an
// arrow or a swipe, turns to the same weekday of that week. The marker under
// the day on screen slides with a drag of the day panes: --day, set by the
// calendar, is the day as a fraction, and each cell's ink blends toward the
// marker's as the marker slides over it.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The width of the strip, unrounded: clientWidth rounds to whole pixels and the fractions add up across the weeks. */
const widthOf = (el: HTMLElement) => el.getBoundingClientRect().width;

export function DayStrip({
  days,
  zone,
  today,
  active,
  onPick,
  onWeek,
}: {
  days: Date[]; // the start of every day the calendar can show, from a Monday, a whole number of weeks
  zone: string;
  today: number; // today, as an index into days
  active: number; // the day on screen, as an index into days
  onPick: (i: number) => void;
  onWeek: (week: number) => void; // the strip settled on a week
}) {
  const weeks = Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const stripRef = React.useRef<HTMLDivElement>(null);
  const [week, setWeek] = React.useState(0);
  const settled = React.useRef(true);

  const showWeek = (w: number) => {
    const strip = stripRef.current;
    strip?.scrollTo({ left: w * widthOf(strip), behavior: "smooth" });
  };
  // A settle, after motion, is what turns the week: the first scroll event of a smooth slide is still near the week left behind.
  const onScroll = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const progress = strip.scrollLeft / widthOf(strip);
    const nearest = Math.round(progress);
    if (Math.abs(progress - nearest) >= 0.01) {
      settled.current = false;
    } else if (!settled.current) {
      settled.current = true;
      setWeek(nearest);
      onWeek(nearest);
    }
  };
  const activeWeek = Math.floor(active / 7);
  React.useEffect(() => {
    const strip = stripRef.current;
    if (strip && Math.round(strip.scrollLeft / widthOf(strip)) !== activeWeek) showWeek(activeWeek);
  }, [activeWeek]);

  return (
    <div className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <Button variant="ghost" size="icon-sm" disabled={week === 0} onClick={() => showWeek(week - 1)} aria-label="Previous week">
          <ChevronLeftIcon />
        </Button>
        <nav
          ref={stripRef}
          onScroll={onScroll}
          aria-label="Days"
          className="min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        >
          <div className="relative flex">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1/7 translate-x-[calc(var(--day,0)*100%)] rounded-md bg-primary" />
            {weeks.map((weekDays, w) => (
              <div key={weekDays[0].getTime()} className="grid w-full shrink-0 snap-start grid-cols-7">
                {weekDays.map((day, d) => {
                  const i = w * 7 + d;
                  const isToday = i === today;
                  return (
                    <button
                      key={day.getTime()}
                      type="button"
                      onClick={() => onPick(i)}
                      aria-current={i === active ? "date" : undefined}
                      style={{ "--i": i } as React.CSSProperties}
                      className={cn(
                        "strip-cell relative flex flex-col items-center rounded-md py-1 text-xs leading-tight whitespace-nowrap",
                        i !== active && "hover:bg-accent",
                        i < today && "opacity-50",
                      )}
                    >
                      <span className={isToday ? "strip-ink-primary" : "strip-ink-muted-foreground"}>{fmtWeekday(day, zone)}</span>
                      <span className={cn("text-base font-semibold", isToday ? "strip-ink-primary" : "strip-ink-foreground")}>
                        {fmtDayOfMonth(day, zone)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={week === weeks.length - 1}
          onClick={() => showWeek(week + 1)}
          aria-label="Next week"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
