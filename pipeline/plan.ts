// What one refresh run must do, decided from the hashes alone. Pure, so the
// vanish logic and the change detection are testable without network or LLM.
import type { Listing } from "../src/schema/listing.ts";
import type { ApiListing } from "./api.ts";
import { apiHash, hashText } from "./hash.ts";

export type Reason = "new" | "api changed" | "host page changed" | "re-extract all";

// Why this listing needs a fresh extraction, or null when the stored file
// still matches both sources.
export function extractReason(input: {
  stored: Listing | null;
  api: ApiListing;
  pageText: string | null;
  all: boolean;
}): Reason | null {
  const { stored, api, pageText, all } = input;
  if (stored === null) return "new";
  if (all) return "re-extract all";
  if (stored.apiHash !== apiHash(api)) return "api changed";
  const pageHash = pageText === null ? null : hashText(pageText);
  if (stored.pageHash !== pageHash) return "host page changed";
  return null;
}

// Stored files the run deletes: listings the API no longer returns, and
// listings that reached the exclusion list after they were written.
export function removedIds(
  stored: Iterable<number>,
  apiIds: ReadonlySet<number>,
  excludedIds: ReadonlySet<number>,
): number[] {
  return [...stored].filter((id) => !apiIds.has(id) || excludedIds.has(id)).sort((a, b) => a - b);
}

// Ids on a hand-kept list that the API no longer returns. A warning, no failure.
export function unknownIds(handKept: Iterable<number>, apiIds: ReadonlySet<number>): number[] {
  return [...handKept].filter((id) => !apiIds.has(id)).sort((a, b) => a - b);
}
