import { describe, expect, it } from "vitest";
import {
  activeCount,
  appliedFilters,
  durationBand,
  EMPTY_FILTERS,
  listingMatches,
  sittingMatches,
  toggle,
  type Filters,
} from "@/lib/filters";
import { expandSittings } from "@/lib/expand";
import { aListing, aRule } from "@/test/fixtures";

const withFilters = (over: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...over });

describe("durationBand", () => {
  it("uses the three bands of the expansion decision", () => {
    expect(durationBand(60)).toBe("hour");
    expect(durationBand(90)).toBe("hour");
    expect(durationBand(91)).toBe("long");
    expect(durationBand(240)).toBe("long");
    expect(durationBand(241)).toBe("day");
    expect(durationBand(600)).toBe("day");
  });
});

describe("listingMatches", () => {
  const listing = aListing({
    languages: ["en", "nl"],
    medium: "video",
    platform: "zoom",
    teacherLed: false,
    questionsAndAnswers: true,
  });

  it("keeps every listing when no filter is set", () => {
    expect(listingMatches(listing, EMPTY_FILTERS)).toBe(true);
  });

  it("keeps a listing that speaks one of the chosen languages", () => {
    expect(listingMatches(listing, withFilters({ languages: ["nl"] }))).toBe(true);
    expect(listingMatches(listing, withFilters({ languages: ["de"] }))).toBe(false);
  });

  it("filters on medium", () => {
    expect(listingMatches(listing, withFilters({ medium: ["audio"] }))).toBe(false);
    expect(listingMatches(listing, withFilters({ medium: ["video", "audio"] }))).toBe(true);
  });

  it("treats the two toggles as off when they are null", () => {
    expect(listingMatches(listing, withFilters({ teacherLed: null }))).toBe(true);
    expect(listingMatches(listing, withFilters({ teacherLed: true }))).toBe(false);
    expect(listingMatches(listing, withFilters({ questionsAndAnswers: true }))).toBe(true);
  });
});

describe("sittingMatches", () => {
  // Monday 3 August 2026, 07:00 in Amsterdam, one hour long.
  const listing = aListing({ scheduleRules: [aRule({ weekdays: ["mon"], start: "07:00", durationMinutes: 60 })] });
  const [sitting] = expandSittings(
    [listing],
    new Date("2026-08-03T00:00:00Z"),
    new Date("2026-08-04T00:00:00Z"),
    "Europe/Amsterdam",
  );

  it("expands to one sitting", () => {
    expect(sitting).toBeDefined();
  });

  it("filters on the duration band", () => {
    expect(sittingMatches(sitting, withFilters({ durations: ["hour"] }))).toBe(true);
    expect(sittingMatches(sitting, withFilters({ durations: ["day"] }))).toBe(false);
  });

  it("also applies the listing filters", () => {
    expect(sittingMatches(sitting, withFilters({ medium: ["stream"] }))).toBe(false);
  });
});

describe("activeCount", () => {
  it("counts nothing when no filter is set", () => {
    expect(activeCount(EMPTY_FILTERS)).toBe(0);
  });

  it("counts each chosen option and each toggle that is on", () => {
    expect(activeCount(withFilters({ durations: ["hour", "day"], languages: ["en"], teacherLed: true }))).toBe(4);
  });
});

describe("toggle", () => {
  it("adds a value that is absent and drops one that is present", () => {
    expect(toggle([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggle([1, 2], 2)).toEqual([1]);
  });
});

describe("appliedFilters", () => {
  it("lists every chosen option, each able to remove itself", () => {
    const f = withFilters({ durations: ["long"], languages: ["es", "fr"], medium: ["audio"], teacherLed: true });
    const applied = appliedFilters(f);
    expect(applied.map((a) => a.label)).toEqual(["2 to 4 hours", "Spanish", "French", "Audio only", "Teacher led"]);
    expect(applied[1].remove(f)).toEqual(withFilters({ durations: ["long"], languages: ["fr"], medium: ["audio"], teacherLed: true }));
    expect(applied[4].remove(f)).toEqual(withFilters({ durations: ["long"], languages: ["es", "fr"], medium: ["audio"] }));
  });

  it("is empty when nothing is applied", () => {
    expect(appliedFilters(EMPTY_FILTERS)).toEqual([]);
  });
});
