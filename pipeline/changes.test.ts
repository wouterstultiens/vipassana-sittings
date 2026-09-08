import { describe, expect, it } from "vitest";
import { hostState, removedIds, unknownListIds } from "./changes.ts";

const stored = (inputHash: string, sourcesChanged = false) => ({ inputHash, sourcesChanged });

describe("hostState", () => {
  it("leaves a host whose sources did not move", () => {
    expect(hostState({ stored: stored("a"), inputHash: "a" })).toBe("unchanged");
  });

  it("marks a host whose sources moved", () => {
    expect(hostState({ stored: stored("a"), inputHash: "b" })).toBe("changed");
  });

  it("tells a marked host apart from a newly changed one", () => {
    expect(hostState({ stored: stored("a", true), inputHash: "b" })).toBe("still-changed");
  });

  it("settles a marked host whose sources match again", () => {
    expect(hostState({ stored: stored("a", true), inputHash: "a" })).toBe("settled");
  });
});

describe("removedIds", () => {
  it("drops a stored id the api no longer returns", () => {
    expect(removedIds({ storedIds: [1, 2, 3], apiIds: new Set([1, 3]), excludedIds: new Set() })).toEqual([2]);
  });

  it("drops a stored id that is excluded, even when the api still returns it", () => {
    expect(removedIds({ storedIds: [1, 2], apiIds: new Set([1, 2]), excludedIds: new Set([2]) })).toEqual([2]);
  });

  it("keeps every stored id when nothing vanished", () => {
    expect(removedIds({ storedIds: [1, 2], apiIds: new Set([1, 2]), excludedIds: new Set() })).toEqual([]);
  });
});

describe("unknownListIds", () => {
  it("names hand-kept ids the api does not return", () => {
    expect(unknownListIds({ excludedIds: [9, 1], pageListIds: [8, 2], apiIds: new Set([1, 2]) })).toEqual([9, 8]);
  });
});
