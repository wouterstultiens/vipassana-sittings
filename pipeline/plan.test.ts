import { describe, expect, it } from "vitest";
import type { Listing } from "../src/schema/listing.ts";
import { needsExtraction, removedIds, unknownListIds } from "./plan.ts";

const stored = (over: Partial<Listing> = {}) =>
  ({ id: 1, apiHash: "a", pageHash: null, ...over }) as Listing;

describe("needsExtraction", () => {
  it("extracts when no file is stored", () => {
    expect(needsExtraction({ stored: null, apiHash: "a", pageHash: null, all: false })).toBe(true);
  });

  it("leaves an unchanged listing alone", () => {
    expect(needsExtraction({ stored: stored(), apiHash: "a", pageHash: null, all: false })).toBe(
      false,
    );
  });

  it("extracts when the api hash differs", () => {
    expect(needsExtraction({ stored: stored(), apiHash: "b", pageHash: null, all: false })).toBe(
      true,
    );
  });

  it("extracts when the page hash differs", () => {
    const previous = stored({ pageHash: "p" });
    expect(needsExtraction({ stored: previous, apiHash: "a", pageHash: "q", all: false })).toBe(
      true,
    );
  });

  it("extracts when a host page is added to a listing that had none", () => {
    expect(needsExtraction({ stored: stored(), apiHash: "a", pageHash: "p", all: false })).toBe(
      true,
    );
  });

  it("extracts every listing under --all", () => {
    expect(needsExtraction({ stored: stored(), apiHash: "a", pageHash: null, all: true })).toBe(
      true,
    );
  });
});

describe("removedIds", () => {
  it("drops a stored id the api no longer returns", () => {
    expect(removedIds([1, 2, 3], new Set([1, 3]), new Set())).toEqual([2]);
  });

  it("drops a stored id that is excluded, even when the api still returns it", () => {
    expect(removedIds([1, 2], new Set([1, 2]), new Set([2]))).toEqual([2]);
  });

  it("keeps every stored id when nothing vanished", () => {
    expect(removedIds([1, 2], new Set([1, 2]), new Set())).toEqual([]);
  });
});

describe("unknownListIds", () => {
  it("names hand-kept ids the api does not return", () => {
    expect(unknownListIds([9, 1], [8, 2], new Set([1, 2]))).toEqual([9, 8]);
  });
});
