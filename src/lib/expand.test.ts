import { describe, expect, it } from "vitest";
import type { Rule } from "@/schema/host";
import { dayOfWeek, expandSittings, localDayStart } from "@/lib/expand";
import { aHost, aRule } from "@/test/fixtures";

const rule = (over: Partial<Rule> = {}): Rule => aRule({ start: "19:00", ...over });

const host = (rules: Rule[], timeZone = "Europe/Amsterdam") => aHost({ id: 1, rules, timeZone });

/** The days of the month a rule fires on, over one month in the host's zone. */
const daysInMonth = (r: Rule, zone = "Europe/Amsterdam") => {
  const from = new Date(Date.UTC(2026, 5, 1));
  const to = new Date(Date.UTC(2026, 6, 1));
  return expandSittings([host([r])], from, to, zone).map((s) => s.local.getDate());
};

describe("expandSittings", () => {
  it("fires every week when weeksOfMonth is null", () => {
    // June 2026 has Mondays on the 1st, 8th, 15th, 22nd and 29th.
    expect(daysInMonth(rule())).toEqual([1, 8, 15, 22, 29]);
  });

  it("takes the nth weekday of the month for a positive week number", () => {
    expect(daysInMonth(rule({ weeksOfMonth: [1, 3] }))).toEqual([1, 15]);
  });

  it("takes the last weekday of the month for -1", () => {
    expect(daysInMonth(rule({ weeksOfMonth: [-1] }))).toEqual([29]);
  });

  it("takes a 5th weekday only in a month that has one", () => {
    expect(daysInMonth(rule({ weeksOfMonth: [5] }))).toEqual([29]);
    // July 2026 has only four Mondays.
    const from = new Date(Date.UTC(2026, 6, 1));
    const to = new Date(Date.UTC(2026, 7, 1));
    expect(expandSittings([host([rule({ weeksOfMonth: [5] })])], from, to, "Europe/Amsterdam")).toEqual([]);
  });

  it("places a sitting on the day and hour it starts in the old student's zone", () => {
    // Monday 19:00 in Kolkata is Monday 15:30 in Amsterdam.
    const from = new Date(Date.UTC(2026, 5, 1));
    const to = new Date(Date.UTC(2026, 5, 8));
    const [s] = expandSittings([host([rule()], "Asia/Kolkata")], from, to, "Europe/Amsterdam");
    expect(s.local.getDate()).toBe(1);
    expect([s.local.getHours(), s.local.getMinutes()]).toEqual([15, 30]);
  });

  it("keeps a sitting that starts late on the last day inside the window", () => {
    const now = new Date(Date.UTC(2026, 5, 1, 12, 0));
    const zone = "Europe/Amsterdam";
    const from = localDayStart(now, zone);
    const to = localDayStart(from, zone, 7);
    const r = rule({ weekdays: ["sun"], start: "23:30" });
    const [s] = expandSittings([host([r])], from, to, zone);
    expect(s.local.getDate()).toBe(7); // Sunday 7 June, the last day of the window
    expect(s.local.getHours()).toBe(23);
  });
});

describe("daylight saving in the old student's zone", () => {
  const zone = "Europe/Amsterdam";

  it("merges the repeated hour of the autumn change into one row", () => {
    // 25 October 2026: 03:00 CEST falls back to 02:00 CET, so local 02:30 happens
    // twice, at 00:30 UTC and again at 01:30 UTC.
    const from = new Date(Date.UTC(2026, 9, 25));
    const to = new Date(Date.UTC(2026, 9, 26));
    const rules = [rule({ weekdays: ["sun"], start: "00:30" }), rule({ weekdays: ["sun"], start: "01:30" })];
    const hours = expandSittings([host(rules, "UTC")], from, to, zone).map((s) => s.local.getHours());
    expect(hours).toEqual([2, 2]);
  });

  it("leaves the skipped hour of the spring change empty", () => {
    // 29 March 2026: 02:00 CET jumps to 03:00 CEST, so no sitting can start at 02:xx.
    const from = new Date(Date.UTC(2026, 2, 29));
    const to = new Date(Date.UTC(2026, 2, 30));
    const r = rule({ weekdays: ["sun"], start: "02:30" });
    const hours = expandSittings([host([r])], from, to, zone).map((s) => s.local.getHours());
    expect(hours).not.toContain(2);
  });
});

describe("dayOfWeek", () => {
  it("counts from Monday, in the old student's zone", () => {
    // Sunday 6 September 2026, 23:00 UTC: still Sunday in Honolulu, already Monday in Amsterdam.
    const at = new Date(Date.UTC(2026, 8, 6, 23));
    expect(dayOfWeek(at, "Pacific/Honolulu")).toBe(6);
    expect(dayOfWeek(at, "Europe/Amsterdam")).toBe(0);
  });
});
