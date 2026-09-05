import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { htmlToText, normalizeText, PAGE_TEXT_CAP, pageText } from "./page-text.ts";

const html = readFileSync(new URL("./fixtures/host-page.html", import.meta.url), "utf8");

describe("htmlToText", () => {
  const text = htmlToText(html);

  it("keeps the schedule text", () => {
    expect(text).toContain("Monday and Thursday, 07:00 and 18:00, one hour each.");
  });

  it("keeps join links visible", () => {
    expect(text).toContain("https://example.invalid/j/1234");
  });

  it("drops scripts and styles", () => {
    expect(text).not.toContain("tracking");
    expect(text).not.toContain("color: red");
  });

  it("drops the per-request Cloudflare links, absolute and relative, so the hash stays still", () => {
    expect(html).toContain("https://example.invalid/cdn-cgi/");
    expect(html).toContain('href="/cdn-cgi/');
    expect(text).not.toContain("cdn-cgi");
  });

  it("collapses runs of blank lines", () => {
    expect(text).not.toMatch(/\n{3}/);
  });
});

describe("pageText", () => {
  it("leaves a page under the cap whole", () => {
    expect(pageText(html)).toBe(htmlToText(html));
  });

  it("cuts a longer page at the cap and marks it", () => {
    const long = `<p>${"word ".repeat(PAGE_TEXT_CAP)}</p>`;
    const cut = pageText(long);
    expect(cut).toHaveLength(PAGE_TEXT_CAP + "\n[truncated]".length);
    expect(cut.endsWith("\n[truncated]")).toBe(true);
  });
});

describe("normalizeText", () => {
  it("turns CRLF back into LF, so a file read on Windows hashes the same", () => {
    expect(normalizeText("a\r\nb\r\n")).toBe("a\nb\n");
  });
});
