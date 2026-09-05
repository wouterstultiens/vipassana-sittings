import { describe, expect, it } from "vitest";
import type { Listing } from "../src/schema/listing.ts";
import { diffFields } from "./diff.ts";

const record = {
  id: 1,
  medium: "video",
  languages: ["en"],
  extractedAt: "2026-09-05T10:00:00Z",
} as unknown as Listing;

describe("diffFields", () => {
  it("gives nothing for two equal records", () => {
    expect(diffFields(record, { ...record })).toEqual([]);
  });

  it("ignores the extraction time", () => {
    expect(diffFields(record, { ...record, extractedAt: "2026-09-06T10:00:00Z" })).toEqual([]);
  });

  it("names the field, the old value and the new one", () => {
    const after = { ...record, medium: "audio" } as Listing;
    expect(diffFields(record, after)).toEqual(['medium: "video" -> "audio"']);
  });

  it("cuts a long value", () => {
    const after = { ...record, languages: Array(80).fill("en") } as unknown as Listing;
    expect(diffFields(record, after)[0]!.length).toBeLessThan(300);
  });
});
