// A field-by-field diff of two extractions, for the dry run.
import { ListingExtraction } from "../src/schema/listing.ts";

const FIELDS = Object.keys(ListingExtraction.shape) as (keyof ListingExtraction)[];

const show = (value: unknown) => JSON.stringify(value);

// One line per field that differs. Empty when the two extractions match.
export function diffExtraction(before: ListingExtraction, after: ListingExtraction): string[] {
  return FIELDS.filter((f) => show(before[f]) !== show(after[f])).map(
    (f) => `${f}: ${show(before[f])} -> ${show(after[f])}`,
  );
}
