import { describe, expect, it } from "vitest";
import { expandSittings } from "@/lib/expand";
import { endedSlots, roundLength, slotsOf, slotTags } from "@/lib/slots";
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

describe("slotTags", () => {
  it("shows no language tag when every sitting offers English", () => {
    const [slot] = slotsFor(withRule(1, {}, { languages: ["en", "nl"] }), withRule(2));
    expect(slotTags(slot).languages).toEqual([]);
  });

  it("tags the languages of the sittings that do not offer English, once each, sorted", () => {
    const [slot] = slotsFor(
      withRule(1, {}, { languages: ["fr"] }),
      withRule(2, {}, { languages: ["es", "fr"] }),
      withRule(3, {}, { languages: ["en", "de"] }),
    );
    expect(slotTags(slot).languages.map((t) => t.codes)).toEqual([["es"], ["fr"]]);
  });

  it("merges the languages that share one flag into one tag", () => {
    const [slot] = slotsFor(withRule(1, {}, { languages: ["te"] }), withRule(2, {}, { languages: ["hi", "kn"] }));
    const [tag] = slotTags(slot).languages;
    expect(tag.flag).toBe("IN");
    expect(tag.codes).toEqual(["hi", "kn", "te"]);
    expect(tag.label).toBe("हिन्दी (Hindi), ಕನ್ನಡ (Kannada), తెలుగు (Telugu)");
  });

  it("falls back to the code for a language without a flag", () => {
    const [slot] = slotsFor(withRule(1, {}, { languages: ["eo"] }));
    expect(slotTags(slot).languages).toEqual([{ flag: null, codes: ["eo"], label: "Esperanto (Esperanto)" }]);
  });

  it("tags the length only when the slot is not one hour", () => {
    const [hour, long] = slotsFor(withRule(1), withRule(2, { durationMinutes: 90 }));
    expect(slotTags(hour).length).toBeNull();
    expect(slotTags(long).length).toBe("1 h 30 min");
  });
});

describe("endedSlots", () => {
  const slots = slotsFor(withRule(1, { start: "18:00" }), withRule(2, { start: "19:00" }), withRule(3, { start: "20:00" }));

  it("splits the slots that have ended from the ones in progress or ahead", () => {
    // 19:30 in Amsterdam: the 18:00 slot has ended, the 19:00 slot is in progress.
    const now = new Date("2026-06-01T17:30:00Z");
    const { ended, rest } = endedSlots(slots, now);
    expect(ended.map((s) => s.sittings[0].listing.id)).toEqual([1]);
    expect(rest.map((s) => s.sittings[0].listing.id)).toEqual([2, 3]);
  });

  it("treats a slot that ends exactly now as ended", () => {
    const { ended } = endedSlots(slots, new Date("2026-06-01T17:00:00Z"));
    expect(ended).toHaveLength(1);
  });
});
