import { describe, expect, it } from "vitest";
import { expandSittings, type Sitting } from "@/lib/expand";
import { icsEvent, icsFileName } from "@/lib/ics";
import { aJoin, aListing, aRule } from "@/test/fixtures";
import type { Listing } from "@/schema/listing";

// Monday 3 August 2026 in Amsterdam. 07:00 there is 05:00 UTC in summer.
const MONDAY = new Date("2026-08-03T00:00:00Z");
const TUESDAY = new Date("2026-08-04T00:00:00Z");

const sittingsOf = (listing: Listing, to = TUESDAY): Sitting[] => expandSittings([listing], MONDAY, to, "Europe/Amsterdam");

const lines = (ics: string) => ics.split("\r\n");
const line = (ics: string, key: string) => lines(ics).find((l) => l.startsWith(`${key}:`) || l.startsWith(`${key};`));
const unfold = (ics: string) => ics.replace(/\r\n /g, "");

describe("icsEvent", () => {
  const [sitting] = sittingsOf(aListing());

  it("wraps one event in one calendar", () => {
    const ics = icsEvent(sitting);
    expect(lines(ics)[0]).toBe("BEGIN:VCALENDAR");
    expect(lines(ics).at(-1)).toBe("END:VCALENDAR");
    expect(lines(ics).filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
    expect(ics).not.toContain("VTIMEZONE");
  });

  it("writes the start and the end as wall-clock time in the host's zone", () => {
    const ics = icsEvent(sitting);
    expect(line(ics, "DTSTART")).toBe("DTSTART;TZID=Europe/Amsterdam:20260803T070000");
    expect(line(ics, "DTEND")).toBe("DTEND;TZID=Europe/Amsterdam:20260803T080000");
  });

  it("repeats weekly on the weekdays of the rule", () => {
    const [s] = sittingsOf(aListing({ scheduleRules: [aRule({ weekdays: ["mon", "tue", "thu"] })] }));
    expect(line(icsEvent(s), "RRULE")).toBe("RRULE:FREQ=WEEKLY;BYDAY=MO,TU,TH");
  });

  it("repeats monthly for a rule with weeks of the month, with -1 for the last week", () => {
    const [s] = sittingsOf(aListing({ scheduleRules: [aRule({ weekdays: ["mon"], weeksOfMonth: [1, 3, -1] })] }));
    expect(line(icsEvent(s), "RRULE")).toBe("RRULE:FREQ=MONTHLY;BYDAY=1MO,3MO,-1MO");
  });

  it("identifies the event by the listing and the rule, so a second download updates the first", () => {
    const listing = aListing({ scheduleRules: [aRule({ weekdays: ["mon", "tue"] }), aRule({ weekdays: ["wed"], start: "20:00" })] });
    const week = sittingsOf(listing, new Date("2026-08-06T00:00:00Z"));
    expect(week.map((s) => line(icsEvent(s), "UID"))).toEqual([
      "UID:772-0@vipassana-sittings",
      "UID:772-0@vipassana-sittings",
      "UID:772-1@vipassana-sittings",
    ]);
    expect(icsFileName(week[2])).toBe("sitting-772-1.ics");
  });

  it("escapes the commas and semicolons in the summary", () => {
    const [s] = sittingsOf(aListing({ name: "Sitting; morning, evening" }));
    expect(line(icsEvent(s), "SUMMARY")).toBe(String.raw`SUMMARY:Group sitting: Sitting\; morning\, evening`);
  });

  it("names the old-student password instead of writing a value", () => {
    expect(unfold(icsEvent(sitting))).toContain("Password: Use the old-student password");
  });

  it("takes the join link of the rule when the rule carries its own", () => {
    const listing = aListing({
      join: aJoin({ url: "https://example.org/morning-room" }),
      scheduleRules: [aRule({ join: aJoin({ url: "https://example.org/evening-room" }) })],
    });
    const ics = icsEvent(sittingsOf(listing)[0]);
    expect(line(ics, "URL")).toBe("URL:https://example.org/evening-room");
    expect(ics).not.toContain("morning-room");
  });

  it("folds long lines the way RFC 5545 asks", () => {
    const url = `https://example.org/${"a".repeat(200)}`;
    const [s] = sittingsOf(aListing({ join: aJoin({ url }) }));
    const ics = icsEvent(s);
    for (const l of lines(ics)) expect(l.length).toBeLessThanOrEqual(75);
    expect(unfold(ics)).toContain(`URL:${url}`);
  });
});
