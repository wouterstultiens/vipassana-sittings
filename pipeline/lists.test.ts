import { describe, expect, it } from "vitest";
import { excludedIds, pageList } from "./lists.ts";

describe("the hand-kept lists", () => {
  it("reads the exclusion list as numbers", () => {
    expect(excludedIds.size).toBeGreaterThan(0);
    for (const id of excludedIds) expect(Number.isInteger(id)).toBe(true);
  });

  it("keys the pages by host id, each with a public https url and a wall", () => {
    expect(pageList.size).toBeGreaterThan(0);
    for (const [id, pages] of pageList) {
      expect(Number.isInteger(id)).toBe(true);
      expect(pages.length).toBeGreaterThan(0);
      for (const page of pages) {
        expect(page.url.startsWith("https://")).toBe(true);
        expect(["none", "typo3", "wordpress", "post-password"]).toContain(page.wall);
        if (page.wall === "typo3") expect(page.loginUrl?.startsWith("https://")).toBe(true);
      }
    }
  });

  it("never excludes a host that also has a page", () => {
    for (const id of pageList.keys()) expect(excludedIds.has(id)).toBe(false);
  });
});
