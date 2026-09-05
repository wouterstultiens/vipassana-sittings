// Fills the mechanical fields of the golden entries and copies them to listings/.
//
// Reads data/golden/api.json, data/golden/pages/<id>.txt, and the hand-written
// extraction fields in data/golden/listings/<id>.json. Writes each complete,
// validated record back to the same file, then rewrites data/listings/ as a copy.
//
// Usage: pnpm golden [--fetch]
//   --fetch  fetch every page on the host page list into data/golden/pages/ first

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ListingExtraction } from "../src/schema/listing.ts";
import type { ApiListing } from "./api.ts";
import { fetchPage } from "./fetch-page.ts";
import { buildListing } from "./listing.ts";
import { normalizeText } from "./page-text.ts";
import { excludedIds, hostPages } from "./lists.ts";

const DATA = "data";
const GOLDEN = join(DATA, "golden");
const PAGES = join(GOLDEN, "pages");
const GOLDEN_LISTINGS = join(GOLDEN, "listings");
const LISTINGS = join(DATA, "listings");

const api = JSON.parse(readFileSync(join(GOLDEN, "api.json"), "utf8")) as ApiListing[];
const apiIds = new Set(api.map((l) => l.id));

for (const id of [...excludedIds, ...hostPages.keys()]) {
  if (!apiIds.has(id)) console.warn(`warning: id ${id} is on a hand-kept list but not in the API`);
}

if (process.argv.includes("--fetch")) {
  mkdirSync(PAGES, { recursive: true });
  for (const [id, page] of hostPages) {
    const text = await fetchPage(page.url, page.basicAuth);
    writeFileSync(join(PAGES, `${id}.txt`), text);
    console.log(`fetched ${id}: ${text.length} characters`);
  }
}

const problems: string[] = [];
const written: number[] = [];
for (const listing of api) {
  if (excludedIds.has(listing.id)) continue;
  const path = join(GOLDEN_LISTINGS, `${listing.id}.json`);
  if (!existsSync(path)) {
    problems.push(`${listing.id}: no golden entry at ${path}`);
    continue;
  }
  const hand = JSON.parse(readFileSync(path, "utf8"));
  const extraction = ListingExtraction.safeParse(hand);
  if (!extraction.success) {
    const issues = extraction.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    problems.push(`${listing.id}: ${issues.join("; ")}`);
    continue;
  }
  const page = hostPages.get(listing.id);
  const pageText = page
    ? normalizeText(readFileSync(join(PAGES, `${listing.id}.txt`), "utf8"))
    : null;
  const record = buildListing({
    api: listing,
    extraction: extraction.data,
    hostPageUrl: page?.url ?? null,
    pageText,
    extractedAt: typeof hand.extractedAt === "string" ? hand.extractedAt : new Date().toISOString(),
  });
  writeFileSync(path, JSON.stringify(record, null, 2) + "\n");
  written.push(listing.id);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

rmSync(LISTINGS, { recursive: true, force: true });
mkdirSync(LISTINGS, { recursive: true });
for (const file of readdirSync(GOLDEN_LISTINGS)) {
  writeFileSync(join(LISTINGS, file), readFileSync(join(GOLDEN_LISTINGS, file)));
}
console.log(`${written.length} golden entries written and copied to ${LISTINGS}`);
