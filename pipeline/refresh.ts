// Turns API and host page changes into structured data changes in data/listings/.
//
// Usage: pnpm refresh [--dry-run] [--all]
//   --dry-run  extract as usual, print the plan and the diff, write nothing
//   --all      re-extract every listing, after a prompt or schema change
//
// Needs ANTHROPIC_API_KEY, and OLD_STUDENT_USER and OLD_STUDENT_PASS for the
// host pages behind basic auth. Read from .env by the tsx --env-file flag.

import { appendFileSync } from "node:fs";
import type { Listing } from "../src/schema/listing.ts";
import type { ApiListing } from "./api.ts";
import { diffExtraction } from "./diff.ts";
import { extract } from "./extract.ts";
import { fetchPage } from "./fetch-page.ts";
import { buildListing } from "./listing.ts";
import { excludedIds, hostPages } from "./lists.ts";
import { extractReason, removedIds, unknownIds } from "./plan.ts";
import { LISTINGS_DIR, deleteStored, readStored, storedIds, writeStored } from "./store.ts";
import { formatSummary, type Failure } from "./summary.ts";

const API_URL = "https://www.dhamma.org/api/v1/events/virtual";

const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

// Aborts before any change when the endpoint is unreachable, answers something
// that is not JSON, or returns no listings at all.
async function fetchApi(): Promise<ApiListing[]> {
  const res = await fetch(API_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`the virtual endpoint answered ${res.status}`);
  let listings: unknown;
  try {
    listings = await res.json();
  } catch (e) {
    throw new Error(`the virtual endpoint answered invalid JSON: ${(e as Error).message}`);
  }
  if (!Array.isArray(listings) || listings.length === 0) {
    throw new Error("the virtual endpoint returned zero listings");
  }
  return listings as ApiListing[];
}

const api = await fetchApi();
const apiIds = new Set(api.map((l) => l.id));
console.log(`${api.length} listings from the API${dryRun ? " (dry run, nothing is written)" : ""}`);

const warnings = unknownIds([...excludedIds, ...hostPages.keys()], apiIds).map(
  (id) => `id ${id} is on a hand-kept list but not in the API`,
);

const changed: number[] = [];
const added: number[] = [];
const failed: Failure[] = [];
const final = new Map<number, Listing>();

// Extracts one listing again when a source changed, or returns null to keep
// what is already stored. Records why in the counters and the failure list.
async function refreshOne(
  api: ApiListing,
  previous: Listing | null,
  stored: Listing | "unreadable" | null,
): Promise<Listing | null> {
  const id = api.id;
  const page = hostPages.get(id);

  let pageText: string | null = null;
  if (page) {
    try {
      pageText = await fetchPage(page.url, page.basicAuth);
    } catch (e) {
      failed.push({ id, reason: `host page fetch failed: ${(e as Error).message}` });
      return null;
    }
  }

  const reason = extractReason({ stored, api, pageText, all });
  if (reason === null) return null;
  console.log(`${id}: ${reason}, extracting`);

  let listing: Listing;
  try {
    listing = buildListing({
      api,
      extraction: await extract(api, pageText),
      hostPageUrl: page?.url ?? null,
      pageText,
      extractedAt: new Date().toISOString(),
    });
  } catch (e) {
    failed.push({ id, reason: `extraction failed: ${(e as Error).message}` });
    return null;
  }

  // An unreadable file was already there, so repairing it is a change.
  if (stored === null) added.push(id);
  else changed.push(id);

  if (dryRun) {
    const lines = previous === null ? ["new listing"] : diffExtraction(previous, listing);
    for (const line of lines.length === 0 ? ["only the hashes changed"] : lines) {
      console.log(`  ${line}`);
    }
  } else {
    writeStored(LISTINGS_DIR, listing);
  }
  return listing;
}

for (const api_listing of api) {
  if (excludedIds.has(api_listing.id)) continue;
  const stored = readStored(LISTINGS_DIR, api_listing.id);
  if (stored === "unreadable") {
    warnings.push(`the stored file for id ${api_listing.id} did not fit the schema and was rewritten`);
  }
  const previous = stored === "unreadable" ? null : stored;
  const fresh = await refreshOne(api_listing, previous, stored);
  const keep = fresh ?? previous;
  if (keep) final.set(api_listing.id, keep);
}

const removed = removedIds(storedIds(LISTINGS_DIR), apiIds);
for (const id of removed) {
  console.log(`${id}: no longer in the API, removing`);
  if (!dryRun) deleteStored(LISTINGS_DIR, id);
}

const withoutRule = [...final.values()]
  .filter((l) => l.scheduleRules.length === 0)
  .map((l) => l.id)
  .sort((a, b) => a - b);

const summary = formatSummary({ changed, added, removed, failed, withoutRule, warnings });
console.log(`\n${summary}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (failed.length > 0) process.exit(1);
