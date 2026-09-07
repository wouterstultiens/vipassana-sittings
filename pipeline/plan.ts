import type { Host } from "../src/schema/host.ts";

// True when the host must go to the LLM: its file is missing, its input hash
// moved, or the run re-extracts everything.
export function needsExtraction(input: { stored: Host | null; inputHash: string; all: boolean }): boolean {
  const { stored, inputHash, all } = input;
  if (all || stored === null) return true;
  return stored.inputHash !== inputHash;
}

// Stored ids that must lose their file: gone from the API, or excluded. The
// arguments are named, because three collections of ids are easy to swap.
export function removedIds(input: {
  storedIds: number[];
  apiIds: Set<number>;
  excludedIds: Set<number>;
}): number[] {
  const { storedIds, apiIds, excludedIds } = input;
  return storedIds.filter((id) => !apiIds.has(id) || excludedIds.has(id));
}

// Ids on a hand-kept list that the API does not return. A warning, not a failure.
export function unknownListIds(input: {
  excludedIds: number[];
  pageListIds: number[];
  apiIds: Set<number>;
}): number[] {
  const { excludedIds, pageListIds, apiIds } = input;
  return [...excludedIds, ...pageListIds].filter((id) => !apiIds.has(id));
}
