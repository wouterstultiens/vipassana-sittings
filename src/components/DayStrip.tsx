// The phone's way between days: the seven days in one row under the toolbar.
// A tap turns to that day; the day on screen is marked.
import { fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
import type { Day } from "@/components/HourGrid";
import { cn } from "@/lib/utils";

export function DayStrip({
  days,
  zone,
  active,
  onPick,
  className,
}: {
  days: Day[];
  zone: string;
  active: number;
  onPick: (i: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Days" className={cn("flex gap-1 px-2 pb-1.5", className)}>
      {days.map(({ day, today }, i) => (
        <button
          key={day.getTime()}
          type="button"
          onClick={() => onPick(i)}
          aria-current={i === active ? "date" : undefined}
          className={cn(
            "flex flex-1 items-baseline justify-center gap-1 rounded-md py-1 text-xs whitespace-nowrap",
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
