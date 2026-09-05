import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteStored, readStored, storedIds, writeStored } from "./store.ts";
import { aListing } from "../src/test/fixtures.ts";

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), "listings-"))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("the listings folder", () => {
  it("writes a record and reads it back unchanged", () => {
    const listing = aListing({ id: 772 });
    writeStored(dir, listing);
    expect(readStored(dir, 772)).toEqual(listing);
  });

  it("reads a missing record as null, so the run treats it as new", () => {
    expect(readStored(dir, 772)).toBeNull();
  });

  it("reads a record that no longer fits the schema as null, so the run repairs it", () => {
    writeFileSync(join(dir, "772.json"), '{"id": 772}');
    expect(readStored(dir, 772)).toBeNull();
  });

  it("lists the stored ids in order", () => {
    for (const id of [900, 20, 300]) writeStored(dir, aListing({ id }));
    expect(storedIds(dir)).toEqual([20, 300, 900]);
  });

  it("lists nothing when the folder is not there", () => {
    expect(storedIds(join(dir, "gone"))).toEqual([]);
  });

  it("deletes a record and is quiet when it is already gone", () => {
    writeStored(dir, aListing({ id: 772 }));
    deleteStored(dir, 772);
    deleteStored(dir, 772);
    expect(storedIds(dir)).toEqual([]);
  });
});
