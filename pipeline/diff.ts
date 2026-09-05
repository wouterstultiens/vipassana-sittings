import type { Listing } from "../src/schema/listing.ts";

const CUT = 120;

const show = (value: unknown) => {
  const text = JSON.stringify(value) ?? "undefined";
  return text.length <= CUT ? text : text.slice(0, CUT) + "…";
};

// The fields that moved between the stored record and the new one, one line
// each. `extractedAt` moves on every extraction, so it is left out.
export function diffFields(before: Listing, after: Listing): string[] {
  const keys = Object.keys(after) as (keyof Listing)[];
  return keys
    .filter((key) => key !== "extractedAt")
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => `${key}: ${show(before[key])} -> ${show(after[key])}`);
}
