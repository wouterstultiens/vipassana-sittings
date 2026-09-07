// The phone's way between days: the seven days in one row fixed at the
// bottom of the screen, in reach of the thumb, with the week arrows at the
// ends. A tap turns to that day. The day on screen is marked and widens to
// show its month, so the strip is the only place the date is said.
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { fmtDayMonth, fmtDayOfMonth, fmtWeekday } from "@/lib/labels";
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
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-2 py-1.5">
        <Button variant="ghost" size="icon-sm" disabled={!previousWeek} onClick={previousWeek} aria-label="Previous week">
          <ChevronLeftIcon />
        </Button>
        <nav aria-label="Days" className="flex flex-1 gap-1">
          {days.map(({ day, today }, i) => (
            <button
              key={day.getTime()}
              type="button"
              onClick={() => onPick(i)}
              aria-current={i === active ? "date" : undefined}
              className={cn(
                "flex flex-col items-center rounded-md py-1 text-xs leading-tight whitespace-nowrap transition-[flex-grow] duration-200",
                i === active ? "flex-[2] bg-primary text-primary-foreground" : today ? "flex-1 text-primary hover:bg-accent" : "flex-1 text-muted-foreground hover:bg-accent",
              )}
            >
              <span>{fmtWeekday(day, zone)}</span>
              <span className={cn("text-base font-semibold", i !== active && !today && "text-foreground")}>
                {i === active ? fmtDayMonth(day, zone) : fmtDayOfMonth(day, zone)}
              </span>
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
