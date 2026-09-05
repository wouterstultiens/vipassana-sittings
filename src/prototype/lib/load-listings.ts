// Reads the golden dataset at build time. The data repo is cloned into the
// gitignored data/ folder; nothing here is served as a separate file.
import type { Listing } from "../../schema/listing";

export function loadListings(): Listing[] {
  const files = import.meta.glob<{ default: Listing }>("../../../data/listings/*.json", { eager: true });
  return Object.values(files)
    .map((m) => m.default)
    .sort((a, b) => a.name.localeCompare(b.name));
}
