import { describe, expect, it } from "vitest";
import { diffExtraction } from "./diff.ts";
import { aJoin, aListing, aRule } from "../src/test/fixtures.ts";

describe("diffExtraction", () => {
  it("finds nothing when the two extractions match", () => {
    expect(diffExtraction(aListing(), aListing())).toEqual([]);
  });

  it("names each field that differs", () => {
    const lines = diffExtraction(aListing(), aListing({ medium: "audio", teacherLed: true }));
    expect(lines).toEqual(['medium: "video" -> "audio"', "teacherLed: false -> true"]);
  });

  it("sees a changed schedule rule", () => {
    const lines = diffExtraction(aListing(), aListing({ scheduleRules: [aRule({ start: "18:00" })] }));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("scheduleRules");
    expect(lines[0]).toContain("18:00");
  });

  it("ignores the stored fields that are not part of the extraction", () => {
    const later = aListing({ apiHash: "b", extractedAt: "2026-06-01T00:00:00Z" });
    expect(diffExtraction(aListing(), later)).toEqual([]);
  });

  it("sees a join detail that moved to a rule", () => {
    const evening = aJoin({ url: "https://us02web.zoom.us/j/200" });
    expect(diffExtraction(aListing(), aListing({ scheduleRules: [aRule({ join: evening })] }))).toHaveLength(1);
  });
});
