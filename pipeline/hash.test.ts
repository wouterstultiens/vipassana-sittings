import { describe, expect, it } from "vitest";
import { apiHash, hashText } from "./hash.ts";
import { anApiListing } from "./fixtures/index.ts";

describe("hashText", () => {
  it("gives the same hex digest for the same text", () => {
    expect(hashText("group sitting")).toBe(hashText("group sitting"));
    expect(hashText("group sitting")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives a different digest for different text", () => {
    expect(hashText("group sitting")).not.toBe(hashText("Group sitting"));
  });
});

describe("apiHash", () => {
  it("is stable for the same listing", () => {
    expect(apiHash(anApiListing())).toBe(apiHash(anApiListing()));
  });

  it("changes when a field the pipeline reads changes", () => {
    const before = apiHash(anApiListing());
    expect(apiHash(anApiListing({ schedule: "Tuesdays 07:00" }))).not.toBe(before);
    expect(apiHash(anApiListing({ description: "<p>Other</p>" }))).not.toBe(before);
    const sub = anApiListing().sub_location;
    expect(apiHash(anApiListing({ sub_location: { ...sub, time_zone: "Europe/Berlin" } }))).not.toBe(before);
  });

  it("ignores a field the pipeline never reads", () => {
    const other = { ...anApiListing(), event_type: "Something else" } as never;
    expect(apiHash(other)).toBe(apiHash(anApiListing()));
  });

  it("does not confuse two listings that swap two field values", () => {
    const a = anApiListing({ name: "one", short_description: "two" });
    const b = anApiListing({ name: "two", short_description: "one" });
    expect(apiHash(a)).not.toBe(apiHash(b));
  });
});
