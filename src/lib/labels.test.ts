import { describe, expect, it } from "vitest";
import { fmtHour, fmtLength, fmtRepeat, fmtSite, fmtTime, languageFlag, languageTitle, sortLanguages } from "@/lib/labels";
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

describe("fmtTime and fmtHour", () => {
  const at = new Date(Date.UTC(2026, 8, 7, 18, 30)); // 20:30 in Amsterdam

  it("writes the time on a 24-hour or a 12-hour clock", () => {
    expect(fmtTime(at, "Europe/Amsterdam", "24h")).toBe("20:30");
    expect(fmtTime(at, "Europe/Amsterdam", "12h")).toBe("8:30 PM");
    expect(fmtTime(at, "Asia/Kolkata", "12h")).toBe("12:00 AM");
  });

  it("writes the hours of the axis", () => {
    expect(fmtHour(0, "24h")).toBe("00:00");
    expect(fmtHour(0, "12h")).toBe("12 AM");
    expect(fmtHour(12, "12h")).toBe("12 PM");
    expect(fmtHour(20, "12h")).toBe("8 PM");
  });
});

describe("fmtSite", () => {
  it("names a link by its host, without www", () => {
    expect(fmtSite("https://www.dhamma.org/en/os/online-sittings?x=1")).toBe("dhamma.org");
    expect(fmtSite("https://nordic.dhamma.org/")).toBe("nordic.dhamma.org");
    expect(fmtSite("not a url")).toBe("not a url");
  });
});
