import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseListings } from "@/lib/load-listings";

const DIR = new URL("../../data/listings/", import.meta.url);

const dataFiles = (): Record<string, unknown> =>
  Object.fromEntries(
    readdirSync(DIR).map((f) => [f, JSON.parse(readFileSync(new URL(f, DIR), "utf8"))]),
  );

describe("parseListings", () => {
  it("accepts every file in the golden dataset", () => {
    const listings = parseListings(dataFiles());
    expect(listings.length).toBeGreaterThan(0);
  });

  it("sorts by name", () => {
    const names = parseListings(dataFiles()).map((l) => l.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("drops an excluded listing", () => {
    const files = dataFiles();
    const one = Object.values(files)[0] as { id: number };
    expect(parseListings({ a: { ...one, id: 829 } })).toEqual([]);
  });

  it("refuses a file that does not match the schema", () => {
    expect(() => parseListings({ "bad.json": { id: 1 } })).toThrow(/bad\.json/);
  });
});
