import type { Listing } from "../src/schema/listing.ts";

// True when the listing must go to the LLM: its file is missing, one of its two
// hashes moved, or the run re-extracts everything.
export function needsExtraction(input: {
  stored: Listing | null;
  apiHash: string;
  pageHash: string | null;
  all: boolean;
}): boolean {
  const { stored, apiHash, pageHash, all } = input;
  if (all || stored === null) return true;
  return stored.apiHash !== apiHash || stored.pageHash !== pageHash;
}

// Stored ids that must lose their file: gone from the API, or excluded.
export function removedIds(
  storedIds: number[],
  apiIds: Set<number>,
  excludedIds: Set<number>,
): number[] {
  return storedIds.filter((id) => !apiIds.has(id) || excludedIds.has(id));
}

// Ids on a hand-kept list that the API does not return. A warning, not a failure.
export function unknownListIds(
  excludedIds: number[],
  hostPageIds: number[],
  apiIds: Set<number>,
): number[] {
  return [...excludedIds, ...hostPageIds].filter((id) => !apiIds.has(id));
}
