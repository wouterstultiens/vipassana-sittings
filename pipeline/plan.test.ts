import { describe, expect, it } from "vitest";
import type { Host } from "../src/schema/host.ts";
import { needsExtraction, removedIds, unknownListIds } from "./plan.ts";

const stored = (over: Partial<Host> = {}) => ({ id: 1, inputHash: "a", ...over }) as Host;

describe("needsExtraction", () => {
  it("extracts when no file is stored", () => {
    expect(needsExtraction({ stored: null, inputHash: "a", all: false })).toBe(true);
  });

  it("leaves an unchanged host alone", () => {
    expect(needsExtraction({ stored: stored(), inputHash: "a", all: false })).toBe(false);
  });

  it("extracts when the input hash differs", () => {
    expect(needsExtraction({ stored: stored(), inputHash: "b", all: false })).toBe(true);
  });

  it("extracts every host under --all", () => {
    expect(needsExtraction({ stored: stored(), inputHash: "a", all: true })).toBe(true);
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
