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

// What one run found about one stored host, from its live input hash.
//   changed        the sources moved, and the file did not know yet
//   still-changed  the sources moved and the file already says so
//   settled        the file says the sources moved, but they match again
//   unchanged      nothing to do
export type HostState = "changed" | "still-changed" | "settled" | "unchanged";

export function hostState(input: { stored: { inputHash: string; sourcesChanged: boolean }; inputHash: string }): HostState {
  const { stored, inputHash } = input;
  if (stored.inputHash === inputHash) return stored.sourcesChanged ? "settled" : "unchanged";
  return stored.sourcesChanged ? "still-changed" : "changed";
}
