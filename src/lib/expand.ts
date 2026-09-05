// Expands schedule rules into concrete sittings for a date range, seen from
// the old student's timezone. Wall clock is built in the rule's own IANA zone,
// so daylight saving is handled per rule.
import { TZDate } from "@date-fns/tz";
import { addDays, differenceInCalendarDays, getDaysInMonth } from "date-fns";
import type { Listing, ScheduleRule } from "@/schema/listing";

export type Sitting = {
  key: string;
  listing: Listing;
  rule: ScheduleRule;
  start: Date; // instant
  end: Date; // instant
  local: TZDate; // start in the old student's zone
  minutesFromMidnight: number; // in the old student's zone
};

/** How far ahead of the current week the old student can walk. */
export const WEEKS_AHEAD = 8;

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function matchesWeekOfMonth(rule: ScheduleRule, d: TZDate): boolean {
  if (!rule.weeksOfMonth) return true;
  const dom = d.getDate();
  const nth = Math.ceil(dom / 7);
  const isLast = dom + 7 > getDaysInMonth(d);
  return rule.weeksOfMonth.some((w) => (w === -1 ? isLast : w === nth));
}

/** All sittings whose start falls in [from, to). */
export function expandSittings(listings: Listing[], from: Date, to: Date, zone: string): Sitting[] {
  const out: Sitting[] = [];
  const days = differenceInCalendarDays(to, from) + 3;
  for (const listing of listings) {
    for (const [ri, rule] of listing.scheduleRules.entries()) {
      const [hh, mm] = rule.start.split(":").map(Number);
      // Walk calendar days in the rule's zone, one day of slack on each side.
      const first = new TZDate(addDays(from, -1), rule.timeZone);
      for (let i = 0; i < days; i++) {
        const inZone = addDays(first, i);
        const wd = WEEKDAYS[inZone.getDay()];
        if (!rule.weekdays.includes(wd)) continue;
        if (!matchesWeekOfMonth(rule, inZone)) continue;
        const start = new TZDate(inZone.getFullYear(), inZone.getMonth(), inZone.getDate(), hh, mm, rule.timeZone);
        if (start.getTime() < from.getTime() || start.getTime() >= to.getTime()) continue;
        const end = new Date(start.getTime() + rule.durationMinutes * 60_000);
        const local = new TZDate(start.getTime(), zone);
        out.push({
          key: `${listing.id}-${ri}-${start.getTime()}`,
          listing,
          rule,
          start: new Date(start.getTime()),
          end,
          local,
          minutesFromMidnight: local.getHours() * 60 + local.getMinutes(),
        });
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** The grid row a sitting belongs to: the hour it starts in the old student's zone. */
export const localHour = (s: Sitting): number => Math.floor(s.minutesFromMidnight / 60);

/** The hour an instant falls in on the wall clock of the given zone. */
export const hourInZone = (d: Date, zone: string): number => new TZDate(d.getTime(), zone).getHours();

/** Midnight at the start of the given local day, as an instant. */
export function localDayStart(d: Date, zone: string, offsetDays = 0): Date {
  const z = new TZDate(d.getTime(), zone);
  return new Date(new TZDate(z.getFullYear(), z.getMonth(), z.getDate() + offsetDays, 0, 0, zone).getTime());
}

/** Monday 00:00 of the week holding `d`, in the old student's zone. */
export function weekStart(d: Date, zone: string): Date {
  const z = new TZDate(d.getTime(), zone);
  const back = (z.getDay() + 6) % 7;
  return localDayStart(d, zone, -back);
}
