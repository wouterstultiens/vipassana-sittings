import { describe, expect, it } from "vitest";
import { fmtLength, fmtRepeat, languageFlag, languageTitle, sortLanguages } from "@/lib/labels";
import { aRule } from "@/test/fixtures";

describe("languageFlag", () => {
  it("maps the languages of the listings, English included", () => {
    expect(languageFlag("es")).toBe("ES");
    expect(languageFlag("hi")).toBe("IN");
    expect(languageFlag("en")).toBe("GB");
    expect(languageFlag("eo")).toBeNull();
  });
});

describe("languageTitle", () => {
  it("names the language in itself and in English, once when both are the same", () => {
    expect(languageTitle("es")).toBe("Español (Spanish)");
    expect(languageTitle("zh")).toBe("中文 (Chinese)");
    expect(languageTitle("en")).toBe("English");
  });
});

describe("sortLanguages", () => {
  it("orders by English name", () => {
    expect(sortLanguages(["fr", "nl", "es", "en"])).toEqual(["nl", "en", "fr", "es"]);
  });
});

describe("fmtLength", () => {
  it("writes a slot length in half hours", () => {
    expect(fmtLength(30)).toBe("30 min");
    expect(fmtLength(90)).toBe("1½ h");
    expect(fmtLength(180)).toBe("3 h");
    expect(fmtLength(390)).toBe("6½ h");
  });
});

describe("fmtRepeat", () => {
  it("names the weekday, every week or on the weeks of the month", () => {
    expect(fmtRepeat(aRule({ weekdays: ["mon", "wed"] }), "wed")).toBe("Every Wednesday");
    expect(fmtRepeat(aRule({ weeksOfMonth: [1] }), "mon")).toBe("Every 1st Monday");
    expect(fmtRepeat(aRule({ weeksOfMonth: [1, 3] }), "mon")).toBe("Every 1st and 3rd Monday");
    expect(fmtRepeat(aRule({ weeksOfMonth: [2, 4, -1] }), "sun")).toBe("Every 2nd, 4th and last Sunday");
  });
});
