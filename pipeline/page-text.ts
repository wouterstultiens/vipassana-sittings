import { convert } from "html-to-text";

export const PAGE_TEXT_CAP = 20_000;

// Cloudflare injects a per-request "/cdn-cgi/..." link into some host pages,
// absolute on one host and relative on another. It changes on every fetch, so
// it is dropped before hashing.
const cloudflareLink = /\[?(?:https?:\/\/[^\s\]]*)?\/cdn-cgi\/[^\s\]]*\]?/g;

// html-to-text drops scripts and styles and renders links as "text [href]", so
// join links survive into the prompt. Whitespace is collapsed: runs of spaces
// become one space, runs of blank lines become one blank line.
export function htmlToText(html: string): string {
  return convert(html, { wordwrap: false })
    .replace(cloudflareLink, "")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// The stripped host page text, cut at the cap. The hash covers the cut text.
export function pageText(html: string): string {
  const text = htmlToText(html);
  if (text.length <= PAGE_TEXT_CAP) return text;
  return text.slice(0, PAGE_TEXT_CAP) + "\n[truncated]";
}
