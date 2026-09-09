import { describe, expect, it } from "vitest";
import { expandSittings, type Sitting } from "@/lib/expand";
import { icsEvent, icsFileName } from "@/lib/ics";
import { aHost, aJoin, aRule } from "@/test/fixtures";
import type { Host } from "@/schema/host";

// Monday 3 August 2026 in Amsterdam. 07:00 there is 05:00 UTC in summer.
const MONDAY = new Date("2026-08-03T00:00:00Z");
const TUESDAY = new Date("2026-08-04T00:00:00Z");

const sittingsOf = (host: Host, to = TUESDAY): Sitting[] => expandSittings([host], MONDAY, to, "Europe/Amsterdam");

const lines = (ics: string) => ics.split("\r\n");
const line = (ics: string, key: string) => lines(ics).find((l) => l.startsWith(`${key}:`) || l.startsWith(`${key};`));
const unfold = (ics: string) => ics.replace(/\r\n /g, "");

describe("icsEvent", () => {
  const [sitting] = sittingsOf(aHost());

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

  it("writes one sitting, not the rule", () => {
    const [s] = sittingsOf(aHost({ rules: [aRule({ weekdays: ["mon", "tue", "thu"] })] }));
    expect(icsEvent(s)).not.toContain("RRULE");
  });

  describe("with repeat", () => {
    it("repeats every week on the sitting's weekday only, not on the rule's other weekdays", () => {
      const [s] = sittingsOf(aHost({ rules: [aRule({ weekdays: ["mon", "tue", "thu"] })] }));
      expect(line(icsEvent(s, true), "RRULE")).toBe("RRULE:FREQ=WEEKLY;BYDAY=MO");
    });

    it("repeats by the month when the rule names weeks of the month", () => {
      const [s] = sittingsOf(aHost({ rules: [aRule({ weeksOfMonth: [1, 3] })] }));
      expect(line(icsEvent(s, true), "RRULE")).toBe("RRULE:FREQ=MONTHLY;BYDAY=1MO,3MO");
      const [last] = sittingsOf(aHost({ rules: [aRule({ weeksOfMonth: [-1] })] }), new Date("2026-09-01T00:00:00Z"));
      expect(line(icsEvent(last, true), "RRULE")).toBe("RRULE:FREQ=MONTHLY;BYDAY=-1MO");
    });

    it("takes the weekday on the host's clock, not the old student's", () => {
      // 23:30 Monday in Amsterdam is Tuesday morning in Tokyo, and stays a Monday event.
      const [s] = expandSittings([aHost({ rules: [aRule({ start: "23:30" })] })], MONDAY, TUESDAY, "Asia/Tokyo");
      expect(line(icsEvent(s, true), "RRULE")).toBe("RRULE:FREQ=WEEKLY;BYDAY=MO");
    });

    it("identifies the repeats by the rule and the weekday, apart from the one sitting", () => {
      const [s] = sittingsOf(aHost({ rules: [aRule({ weekdays: ["sun"] }), aRule()] }));
      expect(line(icsEvent(s, true), "UID")).toBe("UID:772-1-mon@vipassana-sittings");
      expect(line(icsEvent(s), "UID")).toBe("UID:772-1-1785733200000@vipassana-sittings");
      expect(icsFileName(s, true)).toBe("sitting-772-1-mon.ics");
    });
  });

  it("names the host page, so the calendar holds the way to the schedule", () => {
    expect(unfold(icsEvent(sitting))).toContain("Host page: https://example.org");
    const [s] = sittingsOf(aHost({ pageUrl: null, eventsTitle: "IN, India Standard Time (IST)" }));
    expect(unfold(icsEvent(s))).toContain("Host page: https://www.dhamma.org/en-US/os/locations/virtual_events");
    expect(unfold(icsEvent(s))).toContain("Find it under: IN\\, India Standard Time (IST)");
  });

  it("names the rule's label next to the host, so a half day reads as one", () => {
    const [s] = sittingsOf(aHost({ rules: [aRule({ label: "Half-day" })] }));
    expect(unfold(icsEvent(s))).toContain("Dhamma Pajjota\\, Half-day");
  });

  it("identifies the event by the sitting, so a second download updates the first", () => {
    const host = aHost({ rules: [aRule({ weekdays: ["mon", "tue"] }), aRule({ weekdays: ["wed"], start: "20:00" })] });
    const week = sittingsOf(host, new Date("2026-08-06T00:00:00Z"));
    expect(week.map((s) => line(icsEvent(s), "UID"))).toEqual([
      "UID:772-0-1785733200000@vipassana-sittings",
      "UID:772-0-1785819600000@vipassana-sittings",
      "UID:772-1-1785952800000@vipassana-sittings",
    ]);
    expect(icsFileName(week[2])).toBe("sitting-772-1-1785952800000.ics");
  });

  it("escapes the commas and semicolons in the summary", () => {
    const [s] = sittingsOf(aHost({ name: "Sitting; morning, evening" }));
    expect(line(icsEvent(s), "SUMMARY")).toBe(String.raw`SUMMARY:Group sitting: Sitting\; morning\, evening`);
  });

  it("names the old-student password instead of writing a value", () => {
    expect(unfold(icsEvent(sitting))).toContain("Password: Use the old-student password");
  });

  it("takes the join link of the rule", () => {
    const host = aHost({
      rules: [aRule({ join: aJoin({ url: "https://example.org/morning-room" }) }), aRule({ join: aJoin({ url: "https://example.org/evening-room" }), start: "20:00" })],
    });
    const [morning, evening] = sittingsOf(host);
    expect(line(icsEvent(morning), "URL")).toBe("URL:https://example.org/morning-room");
    expect(line(icsEvent(evening), "URL")).toBe("URL:https://example.org/evening-room");
  });

  it("folds long lines the way RFC 5545 asks", () => {
    const url = `https://example.org/${"a".repeat(200)}`;
    const [s] = sittingsOf(aHost({ rules: [aRule({ join: aJoin({ url }) })] }));
    const ics = icsEvent(s);
    for (const l of lines(ics)) expect(l.length).toBeLessThanOrEqual(75);
    expect(unfold(ics)).toContain(`URL:${url}`);
  });
});
