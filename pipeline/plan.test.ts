import { describe, expect, it } from "vitest";
import { apiHash, hashText } from "./hash.ts";
import { extractReason, removedIds, unknownIds } from "./plan.ts";
import { anApiListing } from "./fixtures/index.ts";
import { aListing } from "../src/test/fixtures.ts";

const api = anApiListing();
const unchanged = aListing({ id: api.id, apiHash: apiHash(api), pageHash: null });

describe("extractReason", () => {
  it("says nothing to do when both hashes still match", () => {
    expect(extractReason({ stored: unchanged, api, pageText: null, all: false })).toBeNull();
  });

  it("calls a listing with no stored file new", () => {
    expect(extractReason({ stored: null, api, pageText: null, all: false })).toBe("new");
  });

  it("re-extracts everything under --all", () => {
    expect(extractReason({ stored: unchanged, api, pageText: null, all: true })).toBe("re-extract all");
  });

  it("sees a changed API listing", () => {
    const changed = anApiListing({ schedule: "Tuesdays 07:00" });
    expect(extractReason({ stored: unchanged, api: changed, pageText: null, all: false })).toBe("api changed");
  });

  it("sees a changed host page", () => {
    const stored = aListing({ apiHash: apiHash(api), pageHash: hashText("old page") });
    expect(extractReason({ stored, api, pageText: "new page", all: false })).toBe("host page changed");
  });

  it("sees a host page that was added to the list", () => {
    expect(extractReason({ stored: unchanged, api, pageText: "a page", all: false })).toBe("host page changed");
  });

  it("sees a host page that was taken off the list", () => {
    const stored = aListing({ apiHash: apiHash(api), pageHash: hashText("a page") });
    expect(extractReason({ stored, api, pageText: null, all: false })).toBe("host page changed");
  });

  it("leaves an unchanged host page alone", () => {
    const stored = aListing({ apiHash: apiHash(api), pageHash: hashText("a page") });
    expect(extractReason({ stored, api, pageText: "a page", all: false })).toBeNull();
  });
});

describe("removedIds", () => {
  const apiIds = new Set([1, 2, 3]);

  it("removes a stored listing the API no longer returns", () => {
    expect(removedIds([1, 2, 9], apiIds, new Set())).toEqual([9]);
  });

  it("removes a stored listing that reached the exclusion list", () => {
    expect(removedIds([1, 2, 3], apiIds, new Set([2]))).toEqual([2]);
  });

  it("keeps every listing the API still returns", () => {
    expect(removedIds([1, 2, 3], apiIds, new Set())).toEqual([]);
  });

  it("sorts the ids, so the summary reads the same on every run", () => {
    expect(removedIds([31, 9, 20], apiIds, new Set())).toEqual([9, 20, 31]);
  });
});

describe("unknownIds", () => {
  it("names a hand-kept id the API no longer returns", () => {
    expect(unknownIds([1, 829], new Set([1, 2]))).toEqual([829]);
  });

  it("says nothing when every hand-kept id is still there", () => {
    expect(unknownIds([1, 2], new Set([1, 2]))).toEqual([]);
  });
});
