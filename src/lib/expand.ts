// Expands the rules of every host into concrete sittings for a date range,
// seen from the old student's timezone. Wall clock is built in the host's own
// IANA zone, so daylight saving is handled per host.
import { TZDate } from "@date-fns/tz";
import { addDays, differenceInCalendarDays, getDaysInMonth } from "date-fns";
import type { Host, Rule } from "@/schema/host";

export type Sitting = {
  key: string;
  host: Host;
  rule: Rule;
  start: Date; // instant
  end: Date; // instant
  local: TZDate; // start in the old student's zone
  crossesMidnight: boolean; // end falls on the next local day
};

/** How far past this week the old student can walk, in weeks. */
export const WEEKS_AHEAD = 8;

/** Weekdays in the order of Date.getDay(). */
export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** The place of a day in its week in the old student's zone: Monday 0 to Sunday 6. */
export const dayOfWeek = (d: Date, zone: string) => (new TZDate(d.getTime(), zone).getDay() + 6) % 7;

function matchesWeekOfMonth(rule: Rule, d: TZDate): boolean {
  if (!rule.weeksOfMonth) return true;
  const dom = d.getDate();
  const nth = Math.ceil(dom / 7);
  const isLast = dom + 7 > getDaysInMonth(d);
  return rule.weeksOfMonth.some((w) => (w === -1 ? isLast : w === nth));
}

/** All sittings whose start falls in [from, to). */
export function expandSittings(hosts: Host[], from: Date, to: Date, zone: string): Sitting[] {
  const out: Sitting[] = [];
  const days = differenceInCalendarDays(to, from) + 3;
  for (const host of hosts) {
    for (const [ri, rule] of host.rules.entries()) {
      const [hh, mm] = rule.start.split(":").map(Number);
      // Walk calendar days in the host's zone, one day of slack on each side.
      const first = new TZDate(addDays(from, -1), host.timeZone);
      for (let i = 0; i < days; i++) {
        const inZone = addDays(first, i);
        const wd = WEEKDAYS[inZone.getDay()];
        if (!rule.weekdays.includes(wd)) continue;
        if (!matchesWeekOfMonth(rule, inZone)) continue;
        const start = new TZDate(inZone.getFullYear(), inZone.getMonth(), inZone.getDate(), hh, mm, host.timeZone);
        if (start.getTime() < from.getTime() || start.getTime() >= to.getTime()) continue;
        const end = new Date(start.getTime() + rule.durationMinutes * 60_000);
        const local = new TZDate(start.getTime(), zone);
        const localEnd = new TZDate(end.getTime(), zone);
        out.push({
          key: `${host.id}-${ri}-${start.getTime()}`,
          host,
          rule,
          start: new Date(start.getTime()),
          end,
          local,
          crossesMidnight: localEnd.getDate() !== local.getDate() && (localEnd.getHours() > 0 || localEnd.getMinutes() > 0),
        });
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Midnight at the start of the given local day, as an instant. */
export function localDayStart(d: Date, zone: string, offsetDays = 0): Date {
  const z = new TZDate(d.getTime(), zone);
  return new Date(new TZDate(z.getFullYear(), z.getMonth(), z.getDate() + offsetDays, 0, 0, zone).getTime());
}
