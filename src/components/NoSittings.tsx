// What a day or a week shows when no sitting is on it: why, and the way on.
// The filters are the usual reason, so the way on is the first sitting after
// this day or week that passes them, however many weeks ahead it lies, and a
// way to clear them. Without filters it is the first sitting ahead. The
// calendar's own paging would otherwise be the only way to find a rare
// sitting, a week at a time.
import { CalendarSearchIcon, ChevronRightIcon, FilterXIcon } from "lucide-react";
import type { Sitting } from "@/lib/expand";
import { type Clock, fmtDate, fmtTime } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function NoSittings({
  span,
  filtered,
  next,
  zone,
  clock,
  onNext,
  onClear,
}: {
  span: "day" | "week"; // what is empty: the day pane on a phone, the week on a laptop
  filtered: boolean; // filters are active
  next: Sitting | null; // the first sitting after the span that passes the filters, as far as the calendar reaches
  zone: string;
  clock: Clock;
  onNext: (sitting: Sitting) => void; // turn the calendar to the day and hour of the sitting
  onClear: () => void;
}) {
  const why = filtered
    ? next
      ? `Nothing this ${span} passes your filters.`
      : "Nothing in the weeks ahead passes your filters."
    : next
      ? null
      : "Nothing in the weeks ahead either.";
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarSearchIcon />
        </EmptyMedia>
        <EmptyTitle>No sittings this {span}</EmptyTitle>
        {why && <EmptyDescription>{why}</EmptyDescription>}
      </EmptyHeader>
      <EmptyContent>
        {next && (
          <Button onClick={() => onNext(next)}>
            <span className="tabular-nums">
              {filtered ? "Next match" : "Next sitting"}: {fmtDate(next.start, zone, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
              {fmtTime(next.start, zone, clock)}
            </span>
            <ChevronRightIcon />
          </Button>
        )}
        {filtered && (
          <Button variant="ghost" onClick={onClear}>
            <FilterXIcon /> Clear filters
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
