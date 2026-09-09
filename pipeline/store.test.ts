import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Host } from "../src/schema/host.ts";
import { deleteStored, readStored, storedIds, writeStored } from "./store.ts";

const host: Host = {
  id: 4200,
  name: "Example",
  timeZone: "Europe/Amsterdam",
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: false,
  pageUrl: null,
  rules: [],
  country: "NL",
  city: "Example City",
  email: null,
  eventsTitle: "NL, Central European Time (CET)",
  inputHash: "a",
  sourcesChanged: false,
};

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), "sittings-"))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("the host store", () => {
  it("writes and reads a host", () => {
    writeStored(host, dir);
    expect(readStored(4200, dir)).toEqual(host);
  });

  it("gives null for a missing file", () => {
    expect(readStored(4200, dir)).toBeNull();
  });

  it("treats a file that no longer fits the schema as missing", () => {
    writeFileSync(join(dir, "4200.json"), JSON.stringify({ id: 4200, medium: "hologram" }));
    expect(readStored(4200, dir)).toBeNull();
  });

  it("lists the stored ids in order", () => {
    writeStored({ ...host, id: 20 }, dir);
    writeStored({ ...host, id: 3 }, dir);
    expect(storedIds(dir)).toEqual([3, 20]);
  });

  it("gives no ids when the folder does not exist", () => {
    expect(storedIds(join(dir, "nowhere"))).toEqual([]);
  });

  it("deletes a host, and stays quiet when there is none", () => {
    writeStored(host, dir);
    deleteStored(4200, dir);
    deleteStored(4200, dir);
    expect(storedIds(dir)).toEqual([]);
  });
});
