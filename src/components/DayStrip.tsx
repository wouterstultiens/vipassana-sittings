// The phone's way between days: the seven days in one row under the toolbar.
// A tap scrolls to that day; the day in view is marked as you scroll.
import * as React from "react";
import { fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
import type { Day } from "@/components/HourGrid";
import { cn } from "@/lib/utils";

export const dayId = (i: number) => `day-${i}`;

/** The day whose list is at the top of the view: the last one that starts above the header. */
function dayInView(count: number, headerHeight: number): number {
  let active = 0;
  for (let i = 0; i < count; i++) {
    const top = document.getElementById(dayId(i))?.getBoundingClientRect().top;
    if (top !== undefined && top <= headerHeight + 1) active = i;
  }
  return active;
}

export function DayStrip({
  days,
  zone,
  headerHeight,
  onPick,
  className,
}: {
  days: Day[];
  zone: string;
  headerHeight: number;
  onPick: (i: number) => void;
  className?: string;
}) {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const onScroll = () => setActive(dayInView(days.length, headerHeight));
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [days.length, headerHeight]);

  return (
    <nav aria-label="Days" className={cn("flex gap-1 px-2 pb-1.5", className)}>
      {days.map(({ day, today }, i) => (
        <button
          key={day.getTime()}
          type="button"
          onClick={() => onPick(i)}
          aria-current={i === active ? "date" : undefined}
          className={cn(
            "flex flex-1 items-baseline justify-center gap-1 rounded-md py-1 text-xs whitespace-nowrap transition-colors",
            i === active ? "bg-primary text-primary-foreground" : today ? "text-primary hover:bg-accent" : "text-muted-foreground hover:bg-accent",
          )}
        >
          <span>{fmtWeekday(day, zone)}</span>
          <span className={cn("font-semibold", i !== active && !today && "text-foreground")}>{fmtDayOfMonth(day, zone)}</span>
        </button>
      ))}
    </nav>
  );
}
