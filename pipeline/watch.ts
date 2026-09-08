// Watches the sources behind every host and marks the hosts whose sources
// moved. Nothing here reads a host's meaning: it hashes the rows and the
// pages of a host and compares that hash with the one its file carries. A
// host whose hash moved is marked in its file, so the site sends the old
// student to the host page, and an issue tells the owner to write that host
// again from the fresh sources.
//
// Usage: pnpm watch [--dry-run]
//   --dry-run  print the report, write nothing

import { appendFileSync, writeFileSync } from "node:fs";
import { fetchApi, rowsByHost } from "./api.ts";
import { hostState, removedIds, unknownListIds } from "./changes.ts";
import { LiveSources } from "./live.ts";
import { excludedIds, pageList } from "./lists.ts";
import { deleteStored, readStored, storedIds, writeStored } from "./store.ts";
import { emptyReport, formatReport, worthTelling } from "./watch-report.ts";

const REPORT_FILE = "watch-report.md";

const dryRun = process.argv.includes("--dry-run");

// Nothing is written before the whole endpoint is known to be sound.
const api = await fetchApi().catch((error: Error) => {
  console.error(`Nothing was written: ${error.message}`);
  process.exit(1);
});
const hosts = rowsByHost(api);
const apiIds = new Set(hosts.keys());
const report = emptyReport();

for (const id of unknownListIds({
  excludedIds: [...excludedIds],
  pageListIds: [...pageList.keys()],
  apiIds,
})) {
  report.warnings.push(`id ${id} is on a hand-kept list but not in the API`);
}

const live = new LiveSources();
const filed = new Set(storedIds());

for (const [id, rows] of hosts) {
  if (excludedIds.has(id)) continue;

  let hash: string;
  try {
    hash = await live.hash(rows, pageList.get(id) ?? []);
  } catch (error) {
    report.failed.push({ id, reason: `page: ${(error as Error).message}` });
    continue;
  }

  const stored = readStored(id);
  if (stored === null) {
    report.added.push(id);
    // A file that no longer fits the schema is a file the site cannot read.
    if (filed.has(id)) report.warnings.push(`id ${id} has a file that no longer fits the schema`);
    continue;
  }

  const state = hostState({ stored, inputHash: hash });
  if (state === "unchanged") continue;
  if (state === "still-changed") {
    report.stillChanged.push(id);
    continue;
  }
  if (state === "changed") report.changed.push(id);
  if (!dryRun) writeStored({ ...stored, sourcesChanged: state === "changed" });
}

// An excluded id loses its file too: the data repo holds only what the site shows.
for (const id of removedIds({ storedIds: [...filed], apiIds, excludedIds })) {
  report.removed.push(id);
  if (!dryRun) deleteStored(id);
}

const text = (dryRun ? "Dry run, nothing written.\n\n" : "") + formatReport(report);
console.log(text);
writeFileSync(REPORT_FILE, text);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `tell=${worthTelling(report)}\n`);
if (report.failed.length > 0) process.exit(1);
