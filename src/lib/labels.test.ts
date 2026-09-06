import { describe, expect, it } from "vitest";
import { expandSittings } from "@/lib/expand";
import { fmtRepeat, languageFlag, languageLabel, sortLanguages } from "@/lib/labels";
import { aListing, aRule } from "@/test/fixtures";

describe("languageFlag", () => {
  it("maps the languages of the listings, and never English", () => {
    expect(languageFlag("es")).toBe("ES");
    expect(languageFlag("hi")).toBe("IN");
    expect(languageFlag("en")).toBeNull();
  });
});

describe("languageLabel", () => {
  it("names the language in itself and in English", () => {
    expect(languageLabel("es")).toBe("Español (Spanish)");
    expect(languageLabel("zh")).toBe("中文 (Chinese)");
  });
});

describe("sortLanguages", () => {
  it("puts the browser language first when the data has it, then the rest by English name", () => {
    expect(sortLanguages(["fr", "nl", "es", "en"], "nl")).toEqual(["nl", "en", "fr", "es"]);
    expect(sortLanguages(["fr", "nl", "es", "en"], "de")).toEqual(["nl", "en", "fr", "es"]);
  });
});

describe("fmtRepeat", () => {
  // Monday 3 August 2026 to the Monday after, seen from the given zone.
  const week = (zone: string, rule = aRule()) =>
    expandSittings([aListing({ scheduleRules: [rule] })], new Date("2026-08-03T00:00:00Z"), new Date("2026-08-10T00:00:00Z"), zone);

  it("names the weekdays and the start time in the old student's zone", () => {
    const [s] = week("Europe/Amsterdam", aRule({ weekdays: ["tue", "thu"], start: "20:00" }));
    expect(fmtRepeat(s, "Europe/Amsterdam")).toBe("every Tue and Thu at 20:00");
  });

  it("shifts the weekdays when the old student's day differs from the host's", () => {
    // Monday 07:00 in Amsterdam is Sunday 22:00 in Los Angeles.
    const [s] = week("America/Los_Angeles", aRule({ weekdays: ["mon", "wed", "fri"], start: "07:00" }));
    expect(fmtRepeat(s, "America/Los_Angeles")).toBe("every Sun, Tue and Thu at 22:00");
  });

  it("says every day for a rule on all seven weekdays", () => {
    const [s] = week("Europe/Amsterdam", aRule({ weekdays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], start: "07:00" }));
    expect(fmtRepeat(s, "Europe/Amsterdam")).toBe("every day at 07:00");
  });

  it("names the weeks of the month", () => {
    const [s] = week("Europe/Amsterdam", aRule({ weekdays: ["sun"], weeksOfMonth: [2, -1], start: "10:00" }));
    expect(fmtRepeat(s, "Europe/Amsterdam")).toBe("every 2nd and last Sun at 10:00");
  });
});
