import { describe, expect, it } from "vitest";
import { expandSittings, type Sitting } from "@/lib/expand";
import { icsEvent } from "@/lib/ics";
import { aJoin, aListing, aRule } from "@/test/fixtures";
import type { Listing } from "@/schema/listing";

// Monday 3 August 2026 in Amsterdam. 07:00 there is 05:00 UTC in summer.
const MONDAY = new Date("2026-08-03T00:00:00Z");
const TUESDAY = new Date("2026-08-04T00:00:00Z");

const sittingsOf = (listing: Listing): Sitting[] =>
  expandSittings([listing], MONDAY, TUESDAY, "Europe/Amsterdam");

const lines = (ics: string) => ics.split("\r\n");
const line = (ics: string, key: string) => lines(ics).find((l) => l.startsWith(`${key}:`));
const unfold = (ics: string) => ics.replace(/\r\n /g, "");

describe("icsEvent", () => {
  const [sitting] = sittingsOf(aListing());

  it("wraps one event in one calendar", () => {
    const ics = icsEvent(sitting);
    expect(lines(ics)[0]).toBe("BEGIN:VCALENDAR");
    expect(lines(ics).at(-1)).toBe("END:VCALENDAR");
    expect(lines(ics).filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
  });

  it("writes the start and the end as the UTC instants of the sitting", () => {
    const ics = icsEvent(sitting);
    expect(line(ics, "DTSTART")).toBe("DTSTART:20260803T050000Z");
    expect(line(ics, "DTEND")).toBe("DTEND:20260803T060000Z");
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

  it("gives every sitting its own stable identifier", () => {
    const listing = aListing({ scheduleRules: [aRule({ weekdays: ["mon", "tue"] })] });
    const week = expandSittings([listing], MONDAY, new Date("2026-08-05T00:00:00Z"), "Europe/Amsterdam");
    const uids = week.map((s) => line(icsEvent(s), "UID"));
    expect(new Set(uids).size).toBe(week.length);
  });
});
