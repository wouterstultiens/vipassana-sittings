import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Listing } from "../src/schema/listing.ts";
import { deleteStored, readStored, storedIds, writeStored } from "./store.ts";

const record: Listing = {
  id: 4242,
  name: "Example Online Group Sittings",
  country: "NL",
  host: { name: "Example Host", city: "Example City", email: null, url: null },
  description: "<p>Sittings</p>",
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: false,
  platform: "zoom",
  join: { url: null, meetingId: null, password: { kind: "old-student" }, dialIn: null },
  scheduleRules: [],
  hostPageUrl: null,
  apiHash: "a",
  pageHash: null,
  extractedAt: "2026-09-05T10:00:00Z",
};

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), "sittings-"))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("the listing store", () => {
  it("writes and reads a record", () => {
    writeStored(record, dir);
    expect(readStored(4242, dir)).toEqual(record);
  });

  it("gives null for a missing file", () => {
    expect(readStored(4242, dir)).toBeNull();
  });

  it("treats a file that no longer fits the schema as missing", () => {
    writeFileSync(join(dir, "4242.json"), JSON.stringify({ id: 4242, medium: "hologram" }));
    expect(readStored(4242, dir)).toBeNull();
  });

  it("lists the stored ids in order", () => {
    writeStored({ ...record, id: 20 }, dir);
    writeStored({ ...record, id: 3 }, dir);
    expect(storedIds(dir)).toEqual([3, 20]);
  });

  it("gives no ids when the folder does not exist", () => {
    expect(storedIds(join(dir, "nowhere"))).toEqual([]);
  });

  it("deletes a record, and stays quiet when there is none", () => {
    writeStored(record, dir);
    deleteStored(4242, dir);
    deleteStored(4242, dir);
    expect(storedIds(dir)).toEqual([]);
  });
});
