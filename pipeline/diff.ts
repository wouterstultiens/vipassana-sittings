import type { Host } from "../src/schema/host.ts";

const CUT = 120;

const preview = (value: unknown) => {
  const text = JSON.stringify(value) ?? "undefined";
  return text.length <= CUT ? text : text.slice(0, CUT) + "…";
};

// The fields that moved between the stored host and the new one, one line each.
export function diffFields(before: Host, after: Host): string[] {
  const keys = Object.keys(after) as (keyof Host)[];
  return keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => `${key}: ${preview(before[key])} -> ${preview(after[key])}`);
}
