import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Listing } from "../src/schema/listing.ts";

// The private data repo, cloned here by the workflow and by hand.
export const LISTINGS_DIR = join("data", "listings");

const path = (dir: string, id: number) => join(dir, `${id}.json`);

// The ids that have a file today, sorted.
export function storedIds(dir: string = LISTINGS_DIR): number[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => Number(name.slice(0, -".json".length)))
    .filter((id) => Number.isInteger(id))
    .sort((a, b) => a - b);
}

// The stored record, or null when the file is missing or no longer valid. An
// invalid file counts as missing, so the listing is extracted again.
export function readStored(id: number, dir: string = LISTINGS_DIR): Listing | null {
  const file = path(dir, id);
  if (!existsSync(file)) return null;
  const parsed = Listing.safeParse(JSON.parse(readFileSync(file, "utf8")));
  return parsed.success ? parsed.data : null;
}

export function writeStored(listing: Listing, dir: string = LISTINGS_DIR): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path(dir, listing.id), JSON.stringify(listing, null, 2) + "\n");
}

export function deleteStored(id: number, dir: string = LISTINGS_DIR): void {
  rmSync(path(dir, id), { force: true });
}
