import { describe, expect, it } from "vitest";
import { searchZones, zoneOffset } from "@/components/ZoneSelect";

describe("zoneOffset", () => {
  it("names the offset from GMT right now, with minutes when the zone has them", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    expect(zoneOffset("Europe/Amsterdam", winter)).toBe("GMT+1");
    expect(zoneOffset("Asia/Kolkata", winter)).toBe("GMT+5:30");
    expect(zoneOffset("UTC", winter)).toBe("GMT");
  });
});

describe("searchZones", () => {
  const ids = (q: string) => searchZones(q).map((z) => z.id);

  it("finds a zone by the start of its city", () => {
    expect(ids("amst")).toEqual(["Europe/Amsterdam"]);
  });

  it("needs every word, so a region narrows a city", () => {
    expect(ids("europe lond")).toEqual(["Europe/London"]);
    expect(ids("america lond")).toEqual([]);
  });

  it("finds zones by their offset", () => {
    expect(ids("+5:30")).toContain("Asia/Colombo");
  });

  it("lists every zone for an empty query", () => {
    expect(ids("").length).toBeGreaterThan(300);
  });
});
