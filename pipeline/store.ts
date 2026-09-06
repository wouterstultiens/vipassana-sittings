// Reading and writing data/listings/, the only place the pipeline changes.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Listing } from "../src/schema/listing.ts";

export const LISTINGS_DIR = join("data", "listings");

export function storedIds(dir: string): number[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => Number(f.slice(0, -".json".length)))
    .filter((id) => Number.isInteger(id))
    .sort((a, b) => a - b);
}

const path = (dir: string, id: number) => join(dir, `${id}.json`);

// The stored listing, null when there is no file, or "unreadable" when the
// file is there but no longer fits the schema. The run cannot compare hashes
// with an unreadable file, so it extracts again and says so.
export function readStored(dir: string, id: number): Listing | "unreadable" | null {
  const file = path(dir, id);
  if (!existsSync(file)) return null;
  try {
    return Listing.parse(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return "unreadable";
  }
}

export function writeStored(dir: string, listing: Listing): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path(dir, listing.id), JSON.stringify(listing, null, 2) + "\n");
}

export function deleteStored(dir: string, id: number): void {
  rmSync(path(dir, id), { force: true });
}
