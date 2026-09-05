// Reads the golden dataset at build time. The data repo is cloned into the
// gitignored data/ folder; nothing here is served as a separate file.
import excludedIds from "../../pipeline/excluded-ids.json" with { type: "json" };
import { Listing } from "@/schema/listing";

const excluded = new Set<number>(excludedIds);

/** Validates every data file, drops the excluded listings, and sorts by name. */
export function parseListings(files: Record<string, unknown>): Listing[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const parsed = Listing.safeParse(raw);
      if (!parsed.success) throw new Error(`${path} is not a valid listing: ${parsed.error.message}`);
      return parsed.data;
    })
    .filter((l) => !excluded.has(l.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadListings(): Listing[] {
  return parseListings(import.meta.glob("../../data/listings/*.json", { eager: true, import: "default" }));
}
