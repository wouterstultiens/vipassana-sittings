// Turns API and host page changes into structured data changes in data/listings/.
//
// One listing at a time: hash the API fields, fetch and hash the host page when
// one is listed, and send both texts to the LLM only when a hash moved. A failed
// listing keeps its previous file and fails the run at the end.
//
// Usage: pnpm refresh [--dry-run] [--all]
//   --dry-run  print the plan and the diff, write nothing. A listing whose
//              hashes moved is still extracted, because the diff needs it.
//   --all      re-extract every listing, whatever the hashes say

import { appendFileSync } from "node:fs";
import type { ApiListing } from "./api.ts";
import { diffFields } from "./diff.ts";
import { claudeAsk, extractListing } from "./extract.ts";
import { fetchPage } from "./fetch-page.ts";
import { apiHash, hashText } from "./hash.ts";
import { buildListing } from "./listing.ts";
import { excludedIds, hostPages } from "./lists.ts";
import { needsExtraction, removedIds, unknownListIds } from "./plan.ts";
import { deleteStored, readStored, storedIds, writeStored } from "./store.ts";
import { emptySummary, formatSummary } from "./summary.ts";

const API_URL = "https://www.dhamma.org/api/v1/events/virtual";

const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

// Nothing is written before the whole endpoint is known to be sound.
async function fetchApi(): Promise<ApiListing[]> {
  const res = await fetch(API_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`the virtual endpoint answered ${res.status}`);
  const body: unknown = await res.json();
  if (!Array.isArray(body)) throw new Error("the virtual endpoint did not answer with a list");
  if (body.length === 0) throw new Error("the virtual endpoint answered with zero listings");
  return body as ApiListing[];
}

const api = await fetchApi().catch((error: Error) => {
  console.error(`Nothing was written: ${error.message}`);
  process.exit(1);
});
const apiIds = new Set(api.map((listing) => listing.id));
const summary = emptySummary();

for (const id of unknownListIds({
  excludedIds: [...excludedIds],
  hostPageIds: [...hostPages.keys()],
  apiIds,
})) {
  summary.warnings.push(`id ${id} is on a hand-kept list but not in the API`);
}

const ask = claudeAsk();
const plan: string[] = [];
const filed = new Set(storedIds());

// The run summary names every listing the calendar cannot place, whether it
// was extracted again this run or kept as it was.
const noteWithoutRule = (listing: { id: number; scheduleRules: unknown[] } | null) => {
  if (listing !== null && listing.scheduleRules.length === 0) summary.withoutRule.push(listing.id);
};

for (const listing of api) {
  const { id } = listing;
  if (excludedIds.has(id)) continue;
  const stored = readStored(id);
  const page = hostPages.get(id);

  let pageText: string | null = null;
  if (page) {
    try {
      pageText = await fetchPage(page.url, page.basicAuth);
    } catch (error) {
      summary.failed.push({ id, reason: `host page: ${(error as Error).message}` });
      noteWithoutRule(stored);
      continue;
    }
  }
  const pageHash = pageText === null ? null : hashText(pageText);

  if (!needsExtraction({ stored, apiHash: apiHash(listing), pageHash, all })) {
    noteWithoutRule(stored);
    continue;
  }

  let extracted;
  try {
    extracted = buildListing({
      api: listing,
      extraction: await extractListing(ask, listing, pageText),
      hostPageUrl: page?.url ?? null,
      pageText,
      extractedAt: new Date().toISOString(),
    });
  } catch (error) {
    summary.failed.push({ id, reason: `extraction: ${(error as Error).message}` });
    noteWithoutRule(stored);
    continue;
  }

  if (stored === null && !filed.has(id)) {
    summary.added.push(id);
    plan.push(`${id}: added`);
  } else if (stored === null) {
    // The file is there but no longer fits the schema, so it counts as changed.
    summary.changed.push(id);
    summary.warnings.push(`id ${id} had a file that no longer fits the schema, extracted again`);
    plan.push(`${id}: changed, the stored file no longer fits the schema`);
  } else {
    summary.changed.push(id);
    plan.push(`${id}: changed`, ...diffFields(stored, extracted).map((line) => `  ${line}`));
  }
  noteWithoutRule(extracted);
  if (!dryRun) writeStored(extracted);
}

// An excluded id loses its file too: the data repo holds only what the site shows.
for (const id of removedIds({ storedIds: [...filed], apiIds, excludedIds })) {
  summary.removed.push(id);
  plan.push(`${id}: removed`);
  if (!dryRun) deleteStored(id);
}

const report = (dryRun ? "Dry run, nothing written.\n\n" : "") + formatSummary(summary);
if (plan.length > 0) console.log(plan.join("\n") + "\n");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (summary.failed.length > 0) process.exit(1);
