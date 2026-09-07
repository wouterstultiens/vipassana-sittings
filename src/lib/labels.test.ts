import { describe, expect, it } from "vitest";
import { fmtLength, languageFlag, languageTitle, sortLanguages } from "@/lib/labels";

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
  it("puts the browser language first when the data has it, then the rest by English name", () => {
    expect(sortLanguages(["fr", "nl", "es", "en"], "nl")).toEqual(["nl", "en", "fr", "es"]);
    expect(sortLanguages(["fr", "nl", "es", "en"], "de")).toEqual(["nl", "en", "fr", "es"]);
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
