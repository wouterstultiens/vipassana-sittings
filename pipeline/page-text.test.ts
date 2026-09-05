import { describe, expect, it } from "vitest";
import { PAGE_TEXT_CAP, htmlToText, pageText } from "./page-text.ts";
import { hostPageHtml } from "./fixtures/index.ts";

describe("htmlToText", () => {
  const text = htmlToText(hostPageHtml);

  it("drops scripts and styles", () => {
    expect(text).not.toContain("should not survive");
    expect(text).not.toContain("color: red");
  });

  it("keeps the join link href next to its text", () => {
    expect(text).toContain("Join the room [https://example.org/room]");
  });

  it("drops the per-request Cloudflare link, absolute or relative", () => {
    // The link differs on every fetch. Left in, it would re-extract the
    // listing every week for nothing.
    expect(text).not.toContain("cdn-cgi");
  });

  it("collapses runs of spaces and runs of blank lines", () => {
    expect(text).toContain("GROUP SITTINGS"); // html-to-text renders an h1 in capitals
    expect(text).not.toMatch(/\n{3,}/);
    expect(text).not.toMatch(/ {2,}/);
  });
});

describe("pageText", () => {
  it("leaves a page under the cap untouched", () => {
    expect(pageText(hostPageHtml)).toBe(htmlToText(hostPageHtml));
  });

  it("cuts a page over the cap and marks it", () => {
    const long = `<p>${"sitting ".repeat(5000)}</p>`;
    const cut = pageText(long);
    expect(cut.endsWith("\n[truncated]")).toBe(true);
    expect(cut.length).toBe(PAGE_TEXT_CAP + "\n[truncated]".length);
  });
});
