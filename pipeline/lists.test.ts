import { describe, expect, it } from "vitest";
import { excludedIds, hostPages } from "./lists.ts";

describe("the hand-kept lists", () => {
  it("reads the exclusion list as numeric ids", () => {
    expect(excludedIds.size).toBeGreaterThan(0);
    for (const id of excludedIds) expect(Number.isInteger(id)).toBe(true);
  });

  it("keys the host page list by numeric listing id", () => {
    expect(hostPages.size).toBeGreaterThan(0);
    for (const id of hostPages.keys()) expect(Number.isInteger(id)).toBe(true);
  });

  it("gives every host page an http URL and a basic-auth flag", () => {
    for (const [id, page] of hostPages) {
      expect(page.url, `${id}`).toMatch(/^https?:\/\//);
      expect(typeof page.basicAuth, `${id}`).toBe("boolean");
    }
  });

  it("never excludes a listing that also has a host page", () => {
    for (const id of hostPages.keys()) expect(excludedIds.has(id)).toBe(false);
  });
});
