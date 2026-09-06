import { describe, expect, it } from "vitest";
import { expandSittings } from "@/lib/expand";
import { languageTags, roundLength, slotsOf, tagsThatFit } from "@/lib/slots";
import { aListing, aRule } from "@/test/fixtures";
import type { Listing, ScheduleRule } from "@/schema/listing";

const zone = "Europe/Amsterdam";
// Monday 1 June 2026.
const from = new Date(Date.UTC(2026, 5, 1));
const to = new Date(Date.UTC(2026, 5, 2));
const withRule = (id: number, over: Partial<ScheduleRule> = {}, listing: Partial<Listing> = {}) =>
  aListing({ id, name: `Listing ${id}`, scheduleRules: [aRule({ start: "19:00", ...over })], ...listing });
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
    const slots = slotsFor(withRule(1), withRule(2, { durationMinutes: 65 }));
    expect(slots).toHaveLength(1);
    expect(slots[0].durationMinutes).toBe(60);
    expect(slots[0].sittings.map((s) => s.listing.name)).toEqual(["Listing 1", "Listing 2"]);
  });

  it("keeps a different length apart, and orders slots by start then length", () => {
    const slots = slotsFor(withRule(1, { start: "20:00" }), withRule(2, { durationMinutes: 90 }), withRule(3));
    expect(slots.map((s) => [s.start.toISOString().slice(11, 16), s.durationMinutes])).toEqual([
      ["17:00", 60],
      ["17:00", 90],
      ["18:00", 60],
    ]);
  });
});

describe("languageTags", () => {
  it("tags English like any other language, so a row without the flag has no English", () => {
    const [slot] = slotsFor(withRule(1), withRule(2));
    expect(languageTags(slot)).toEqual([{ flag: "GB", codes: ["en"] }]);
  });

  it("tags every language on offer, English first, then sorted, once each", () => {
    const [slot] = slotsFor(
      withRule(1, {}, { languages: ["fr"] }),
      withRule(2, {}, { languages: ["es", "fr"] }),
      withRule(3, {}, { languages: ["nl", "en"] }),
    );
    expect(languageTags(slot).map((t) => t.codes)).toEqual([["en"], ["es"], ["fr"], ["nl"]]);
  });

  it("tags a slot without English by its languages alone", () => {
    const [slot] = slotsFor(withRule(1, {}, { languages: ["es"] }));
    expect(languageTags(slot)).toEqual([{ flag: "ES", codes: ["es"] }]);
  });

  it("merges the languages that share one flag into one tag", () => {
    const [slot] = slotsFor(withRule(1, {}, { languages: ["te"] }), withRule(2, {}, { languages: ["hi", "kn"] }));
    expect(languageTags(slot)).toEqual([{ flag: "IN", codes: ["hi", "kn", "te"] }]);
  });

  it("falls back to the code for a language without a flag", () => {
    const [slot] = slotsFor(withRule(1, {}, { languages: ["eo"] }));
    expect(languageTags(slot)).toEqual([{ flag: null, codes: ["eo"] }]);
  });
});

describe("tagsThatFit", () => {
  it("shows every tag when the row is wide enough, as on a phone", () => {
    expect(tagsThatFit(5, 318, 1, false)).toBe(5);
    expect(tagsThatFit(3, 318, 2, true)).toBe(3);
  });

  it("keeps room for a +N when they do not all fit, as in a laptop column", () => {
    expect(tagsThatFit(4, 181, 1, false)).toBe(4);
    expect(tagsThatFit(5, 181, 1, false)).toBe(3);
    expect(tagsThatFit(3, 181, 1, true)).toBe(2);
  });

  it("shows up to three before the row is measured, and never fewer than one", () => {
    expect(tagsThatFit(5, 0, 1, false)).toBe(3);
    expect(tagsThatFit(3, 90, 2, true)).toBe(1);
  });
});
