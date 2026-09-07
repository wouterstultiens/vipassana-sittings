// The phone's way between days: the seven days in one row at the bottom of
// the screen, in reach of the thumb, with the week arrows at the ends. A tap
// turns to that day. The marker under the day on screen slides with a drag
// of the day panes: --day, set by the calendar, is the day as a fraction.
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
import type { Day } from "@/components/HourGrid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DayStrip({
  days,
  zone,
  active,
  onPick,
  previousWeek,
  nextWeek,
}: {
  days: Day[];
  zone: string;
  active: number;
  onPick: (i: number) => void;
  previousWeek?: () => void; // absent at the first week
  nextWeek?: () => void; // absent at the last week
}) {
  return (
    <div className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <Button variant="ghost" size="icon-sm" disabled={!previousWeek} onClick={previousWeek} aria-label="Previous week">
          <ChevronLeftIcon />
        </Button>
        <nav aria-label="Days" className="relative grid flex-1 grid-cols-7">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1/7 translate-x-[calc(var(--day,0)*100%)] rounded-md bg-primary" />
          {days.map(({ day, today }, i) => (
            <button
              key={day.getTime()}
              type="button"
              onClick={() => onPick(i)}
              aria-current={i === active ? "date" : undefined}
              className={cn(
                "relative flex flex-col items-center rounded-md py-1 text-xs leading-tight whitespace-nowrap",
                i === active ? "text-primary-foreground" : today ? "text-primary hover:bg-accent" : "text-muted-foreground hover:bg-accent",
              )}
            >
              <span>{fmtWeekday(day, zone)}</span>
              <span className={cn("text-base font-semibold", i !== active && !today && "text-foreground")}>{fmtDayOfMonth(day, zone)}</span>
            </button>
          ))}
        </nav>
        <Button variant="ghost" size="icon-sm" disabled={!nextWeek} onClick={nextWeek} aria-label="Next week">
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
