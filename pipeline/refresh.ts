// Turns API and page changes into host changes in data/hosts/.
//
// One host at a time: hash its rows and its pages together, and send them to
// the LLM only when the hash moved. A failed host keeps its previous file and
// fails the run at the end.
//
// Usage: pnpm refresh [--dry-run] [--all]
//   --dry-run  print the plan and the diff, write nothing. A host whose hash
//              moved is still extracted, because the diff needs it.
//   --all      re-extract every host, whatever the hashes say

import { appendFileSync } from "node:fs";
import { type ApiRow, fetchApi, rowsByHost } from "./api.ts";
import { diffFields } from "./diff.ts";
import { extractHost, geminiAsk, type Links, type PageInput } from "./extract.ts";
import { type Page, Session } from "./fetch-page.ts";
import { inputHash } from "./hash.ts";
import { buildHost } from "./host.ts";
import { absoluteUrl, checkLink, type LinkCheck } from "./links.ts";
import { excludedIds, pageList } from "./lists.ts";
import { needsExtraction, removedIds, unknownListIds } from "./plan.ts";
import { deleteStored, readStored, storedIds, writeStored } from "./store.ts";
import { emptySummary, formatSummary } from "./summary.ts";

const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

// Nothing is written before the whole endpoint is known to be sound.
const api = await fetchApi().catch((error: Error) => {
  console.error(`Nothing was written: ${error.message}`);
  process.exit(1);
});
const hosts = rowsByHost(api);
const apiIds = new Set(hosts.keys());
const summary = emptySummary();

for (const id of unknownListIds({
  excludedIds: [...excludedIds],
  pageListIds: [...pageList.keys()],
  apiIds,
})) {
  summary.warnings.push(`id ${id} is on a hand-kept list but not in the API`);
}

const ask = geminiAsk();
const session = new Session();
const plan: string[] = [];
const filed = new Set(storedIds());

// A page shared by several hosts is fetched once per run.
const fetched = new Map<string, Promise<string>>();
const textOf = (page: Page) => {
  let text = fetched.get(page.url);
  if (!text) fetched.set(page.url, (text = session.fetchPage(page)));
  return text;
};

// Where every row url and host url of a host leads, each url checked once per
// run. The checks are not in the input hash: a redirect target can carry a
// per-request id, and a dead link is worth a look only when a text moved too.
const checked = new Map<string, Promise<LinkCheck>>();
const linksOf = async (rows: ApiRow[]): Promise<Links> => {
  const links: Links = new Map();
  for (const raw of rows.flatMap((row) => [row.url, row.sub_location.url])) {
    const url = raw?.trim();
    if (!url) continue;
    const absolute = absoluteUrl(url);
    let check = checked.get(absolute);
    if (!check) checked.set(absolute, (check = checkLink(session, absolute)));
    links.set(absolute, await check);
  }
  return links;
};

// The run summary names every host the calendar cannot place, whether it was
// extracted again this run or kept as it was.
const noteWithoutRule = (host: { id: number; rules: unknown[] } | null) => {
  if (host !== null && host.rules.length === 0) summary.withoutRule.push(host.id);
};

for (const [id, rows] of hosts) {
  if (excludedIds.has(id)) continue;
  const stored = readStored(id);

  const pages: PageInput[] = [];
  try {
    for (const page of pageList.get(id) ?? []) pages.push({ url: page.url, text: await textOf(page) });
  } catch (error) {
    summary.failed.push({ id, reason: `page: ${(error as Error).message}` });
    noteWithoutRule(stored);
    continue;
  }

  if (!needsExtraction({ stored, inputHash: inputHash(rows, pages), all })) {
    noteWithoutRule(stored);
    continue;
  }

  let extracted;
  try {
    extracted = buildHost({ rows, extraction: await extractHost(ask, rows, pages, await linksOf(rows)), pages });
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
