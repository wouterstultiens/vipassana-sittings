import { readFileSync } from "node:fs";
import type { Page } from "./fetch-page.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

// Host ids that never reach the data or the site.
export const excludedIds: Set<number> = new Set(read("./excluded-ids.json") as number[]);

// The page list: every page on a host's site with detail about its sittings,
// keyed by host id, with the wall in front of each page. One page can serve
// several hosts. The URLs are public; the page texts are not, so they live in
// the private data repo.
export const pageList: Map<number, Page[]> = new Map(
  Object.entries(read("./sources.json") as Record<string, Page[]>).map(([id, pages]) => [
    Number(id),
    pages,
  ]),
);
