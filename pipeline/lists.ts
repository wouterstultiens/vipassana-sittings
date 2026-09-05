import { readFileSync } from "node:fs";

export type HostPage = { url: string; basicAuth: boolean };

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

// Listing ids that never reach the data or the site.
export const excludedIds: Set<number> = new Set(read("./excluded-ids.json") as number[]);

// One host page per listing, keyed by listing id, only where the page carries
// schedule detail. Host page URLs are public.
export const hostPages: Map<number, HostPage> = new Map(
  Object.entries(read("./host-pages.json") as Record<string, HostPage>).map(([id, page]) => [
    Number(id),
    page,
  ]),
);
