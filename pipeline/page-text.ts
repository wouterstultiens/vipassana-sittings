import { convert } from "html-to-text";

export const PAGE_TEXT_CAP = 20_000;

// Two links change on every fetch, so they are dropped before hashing.
// Without this, such a page would go to the LLM on every run. Cloudflare
// injects a per-request "/cdn-cgi/..." link into some pages, absolute or
// relative. WordPress writes a logout link with a fresh nonce for a logged-in
// session.
const cloudflareLink = /\[?(https?:\/\/[^\s\]]*)?\/cdn-cgi\/[^\s\]]*\]?/g;
const logoutLink = /\[?https?:\/\/[^\s\]]*wp-login\.php\?action=logout[^\s\]]*\]?/g;

// html-to-text drops scripts and styles and renders links as "text [href]", so
// join links survive into the prompt. Tables are laid out cell by cell, so a
// schedule table keeps its columns apart. Whitespace is collapsed: runs of
// spaces become one space, runs of blank lines become one blank line.
export function htmlToText(html: string): string {
  return convert(html, { wordwrap: false, selectors: [{ selector: "table", format: "dataTable" }] })
    .replace(cloudflareLink, "")
    .replace(logoutLink, "")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Text read back from a file can carry CRLF, on Windows or after a git
// checkout. Every hash covers LF text.
export const normalizeText = (text: string): string => text.replace(/\r\n/g, "\n");

// The stripped host page text, cut at the cap. The hash covers the cut text.
export function pageText(html: string): string {
  const text = htmlToText(html);
  if (text.length <= PAGE_TEXT_CAP) return text;
  return text.slice(0, PAGE_TEXT_CAP) + "\n[truncated]";
}
