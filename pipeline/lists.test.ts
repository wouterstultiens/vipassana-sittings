import { describe, expect, it } from "vitest";
import { excludedIds, hostPages } from "./lists.ts";

describe("the hand-kept lists", () => {
  it("reads the exclusion list as numbers", () => {
    expect(excludedIds.size).toBeGreaterThan(0);
    for (const id of excludedIds) expect(Number.isInteger(id)).toBe(true);
  });

  it("keys the host pages by listing id, with a public url and an auth flag", () => {
    expect(hostPages.size).toBeGreaterThan(0);
    for (const [id, page] of hostPages) {
      expect(Number.isInteger(id)).toBe(true);
      expect(page.url.startsWith("https://")).toBe(true);
      expect(typeof page.basicAuth).toBe("boolean");
    }
  });

  it("never excludes a listing that also has a host page", () => {
    for (const id of hostPages.keys()) expect(excludedIds.has(id)).toBe(false);
  });
});
