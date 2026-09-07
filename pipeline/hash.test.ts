import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ApiRow } from "./api.ts";
import { hashText, inputHash } from "./hash.ts";

const row = () =>
  JSON.parse(readFileSync(new URL("./fixtures/api-row.json", import.meta.url), "utf8")) as ApiRow &
    Record<string, unknown>;

const page = { url: "https://example.invalid/os/", text: "Sittings on Monday" };

describe("hashText", () => {
  it("gives a sha256 hex digest", () => {
    expect(hashText("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("separates different texts", () => {
    expect(hashText("a")).not.toBe(hashText("b"));
  });
});

describe("inputHash", () => {
  it("is stable for the same rows and pages", () => {
    expect(inputHash([row()], [page])).toBe(inputHash([row()], [page]));
  });

  it("does not depend on the order of the rows", () => {
    const second = { ...row(), id: 4243 };
    expect(inputHash([row(), second], [])).toBe(inputHash([second, row()], []));
  });

  it("moves when a row field the pipeline reads changes", () => {
    const changed = row();
    changed.description = changed.description + " Extra sitting on Friday.";
    expect(inputHash([changed], [])).not.toBe(inputHash([row()], []));
  });

  it("moves when a host field the pipeline reads changes", () => {
    const changed = row();
    changed.sub_location.time_zone = "Europe/Lisbon";
    expect(inputHash([changed], [])).not.toBe(inputHash([row()], []));
  });

  it("moves when a page text changes, or a page is added", () => {
    expect(inputHash([row()], [{ ...page, text: "Sittings on Tuesday" }])).not.toBe(inputHash([row()], [page]));
    expect(inputHash([row()], [page])).not.toBe(inputHash([row()], []));
  });

  it("does not confuse two rows that swap two field values", () => {
    const one = row();
    one.name = "first";
    one.short_description = "second";
    const other = row();
    other.name = "second";
    other.short_description = "first";
    expect(inputHash([one], [])).not.toBe(inputHash([other], []));
  });

  it("stays put when a field the pipeline never reads changes", () => {
    const changed = row();
    (changed.sub_location as Record<string, unknown>).gmt_offset = "+02:00";
    expect(inputHash([changed], [])).toBe(inputHash([row()], []));
  });
});
