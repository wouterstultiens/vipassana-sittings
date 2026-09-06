import { describe, expect, it } from "vitest";
import type { Listing, ScheduleRule } from "@/schema/listing";
import { expandSittings } from "@/lib/expand";
import { placeSlots, roundLength, slotsOf } from "@/lib/slots";

const rule = (over: Partial<ScheduleRule> = {}): ScheduleRule => ({
  weekdays: ["mon"],
  weeksOfMonth: null,
  start: "19:00",
  durationMinutes: 60,
  timeZone: "Europe/Amsterdam",
  label: null,
  join: null,
  ...over,
});

const listing = (rules: ScheduleRule[], over: Partial<Listing> = {}): Listing =>
  ({
    id: 1,
    name: "Test listing",
    country: "NL",
    host: { name: "Host", city: null, email: null, url: null },
    description: "",
    hostPageUrl: null,
    apiHash: "",
    pageHash: null,
    extractedAt: "2026-01-01T00:00:00Z",
    languages: ["en"],
    medium: "video",
    teacherLed: false,
    questionsAndAnswers: false,
    platform: "zoom",
    join: { url: null, meetingId: null, password: { kind: "none" }, dialIn: null },
    scheduleRules: rules,
    ...over,
  }) as Listing;

const zone = "Europe/Amsterdam";
const from = new Date(Date.UTC(2026, 5, 1));
const to = new Date(Date.UTC(2026, 5, 2));
const slotsFor = (...listings: Listing[]) => slotsOf(expandSittings(listings, from, to, zone));

describe("roundLength", () => {
  it("rounds to the nearest half hour, and never below one", () => {
    expect(roundLength(65)).toBe(60);
    expect(roundLength(100)).toBe(90);
    expect(roundLength(390)).toBe(390);
    expect(roundLength(10)).toBe(30);
  });
});

describe("slotsOf", () => {
  it("folds sittings with the same start and rounded length into one slot", () => {
    const a = listing([rule()], { id: 1, name: "A" });
    const b = listing([rule({ durationMinutes: 65 })], { id: 2, name: "B" });
    const slots = slotsFor(a, b);
    expect(slots).toHaveLength(1);
    expect(slots[0].durationMinutes).toBe(60);
    expect(slots[0].sittings.map((s) => s.listing.name)).toEqual(["A", "B"]);
  });

  it("keeps a different length apart, and orders slots by start then length", () => {
    const a = listing([rule({ start: "20:00" })], { id: 1 });
    const b = listing([rule({ durationMinutes: 90 })], { id: 2 });
    const c = listing([rule()], { id: 3 });
    expect(slotsFor(a, b, c).map((s) => [s.minutesFromMidnight, s.durationMinutes])).toEqual([
      [19 * 60, 60],
      [19 * 60, 90],
      [20 * 60, 60],
    ]);
  });
});

describe("placeSlots", () => {
  it("gives a slot that overlaps nothing the full width", () => {
    const placed = placeSlots(slotsFor(listing([rule()]), listing([rule({ start: "20:00" })], { id: 2 })));
    expect(placed.map((p) => [p.lane, p.lanes])).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it("puts overlapping slots side by side, and reuses a lane once it is free", () => {
    const long = listing([rule({ start: "18:00", durationMinutes: 180 })], { id: 1 });
    const a = listing([rule({ start: "19:00" })], { id: 2 });
    const b = listing([rule({ start: "20:00" })], { id: 3 });
    const placed = placeSlots(slotsFor(long, a, b));
    expect(placed.map((p) => [p.slot.minutesFromMidnight / 60, p.lane, p.lanes])).toEqual([
      [18, 0, 2],
      [19, 1, 2],
      [20, 1, 2],
    ]);
  });
});
