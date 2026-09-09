import { describe, expect, it } from "vitest";
import { expandSittings } from "@/lib/expand";
import { asksToApply, languageTags, roundLength, slotsOf, tagsThatFit } from "@/lib/slots";
import type { Clock } from "@/lib/labels";
import { aHost, aRule } from "@/test/fixtures";
import type { Host, Rule } from "@/schema/host";

const zone = "Europe/Amsterdam";
// Monday 1 June 2026.
const from = new Date(Date.UTC(2026, 5, 1));
const to = new Date(Date.UTC(2026, 5, 2));
const withRule = (id: number, over: Partial<Rule> = {}, host: Partial<Host> = {}) =>
  aHost({ id, name: `Host ${id}`, rules: [aRule({ start: "19:00", ...over })], ...host });
const slotsFor = (...hosts: Host[]) => slotsOf(expandSittings(hosts, from, to, zone));

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
    expect(slots[0].sittings.map((s) => s.host.name)).toEqual(["Host 1", "Host 2"]);
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

describe("asksToApply", () => {
  it("marks a slot when one of its sittings asks the old student to sign up first", () => {
    const [open] = slotsFor(withRule(1));
    expect(asksToApply(open)).toBe(false);
    const [mixed] = slotsFor(withRule(1), withRule(2, { applyFirst: true }));
    expect(mixed.sittings).toHaveLength(2);
    expect(asksToApply(mixed)).toBe(true);
  });
});

// A row of one digit, no length tag, no apply tag, on a 24-hour clock.
const fit = (row: { count: number; rowWidth: number; digits?: number; hasLength?: boolean; asksToApply?: boolean; clock?: Clock }) =>
  tagsThatFit({ digits: 1, hasLength: false, asksToApply: false, clock: "24h", ...row });

describe("tagsThatFit", () => {
  it("shows every tag when the row is wide enough, as on a phone", () => {
    expect(fit({ count: 5, rowWidth: 318 })).toBe(5);
    expect(fit({ count: 3, rowWidth: 318, digits: 2, hasLength: true })).toBe(3);
  });

  it("gives the apply tag its room before the flags", () => {
    expect(fit({ count: 4, rowWidth: 181 })).toBe(4);
    expect(fit({ count: 4, rowWidth: 181, asksToApply: true })).toBe(1);
  });

  it("keeps room for a +N when they do not all fit, as in a laptop column", () => {
    expect(fit({ count: 4, rowWidth: 181 })).toBe(4);
    expect(fit({ count: 5, rowWidth: 181 })).toBe(3);
    expect(fit({ count: 3, rowWidth: 181, hasLength: true })).toBe(2);
  });

  it("shows up to three before the row is measured, and never fewer than one", () => {
    expect(fit({ count: 5, rowWidth: 0 })).toBe(3);
    expect(fit({ count: 3, rowWidth: 90, digits: 2, hasLength: true })).toBe(1);
  });
});

describe("tagsThatFit on a 12-hour clock", () => {
  it("leaves room for the AM or PM", () => {
    expect(fit({ count: 4, rowWidth: 181, clock: "12h" })).toBe(2);
  });
});
