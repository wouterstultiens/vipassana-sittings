import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ApiListing } from "./api.ts";
import { apiHash, hashText } from "./hash.ts";

const listing = () =>
  JSON.parse(readFileSync(new URL("./fixtures/api-listing.json", import.meta.url), "utf8")) as
    ApiListing & Record<string, unknown>;

describe("hashText", () => {
  it("gives a sha256 hex digest", () => {
    expect(hashText("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("separates different texts", () => {
    expect(hashText("a")).not.toBe(hashText("b"));
  });
});

describe("apiHash", () => {
  it("is stable for the same listing", () => {
    expect(apiHash(listing())).toBe(apiHash(listing()));
  });

  it("moves when a field the pipeline reads changes", () => {
    const changed = listing();
    changed.description = changed.description + " Extra sitting on Friday.";
    expect(apiHash(changed)).not.toBe(apiHash(listing()));
  });

  it("moves when a sub-location field the pipeline reads changes", () => {
    const changed = listing();
    changed.sub_location.time_zone = "Europe/Lisbon";
    expect(apiHash(changed)).not.toBe(apiHash(listing()));
  });

  it("does not confuse two listings that swap two field values", () => {
    const one = listing();
    one.name = "first";
    one.short_description = "second";
    const other = listing();
    other.name = "second";
    other.short_description = "first";
    expect(apiHash(one)).not.toBe(apiHash(other));
  });

  it("stays put when a field the pipeline never reads changes", () => {
    const changed = listing();
    changed.gmt_offset = "+02:00";
    expect(apiHash(changed)).toBe(apiHash(listing()));
  });
});
