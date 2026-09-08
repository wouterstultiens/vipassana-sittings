// Scores the prompt against the stored hosts: extracts each host from
// data/sources/ and compares the answer with data/hosts/<id>.json.
//
// Usage: pnpm score [--model <name>] [--write] [ids...]
//   With no ids, every stored host. Prints one line per host, "equal" or the
//   fields that differ, then a total with the tokens spent.
//   --write  store every extraction as the host file, so the prompt's output
//            replaces the reference it was scored against.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Host, HostExtraction } from "../src/schema/host.ts";
import { type ApiRow, rowsByHost } from "./api.ts";
import { differences } from "./compare.ts";
import { extractHost, geminiAsk, type Links, MODEL, type PageInput, type Usage } from "./extract.ts";
import { buildHost } from "./host.ts";
import type { LinkCheck } from "./links.ts";
import { pageList } from "./lists.ts";
import { pageFileName } from "./page-file.ts";
import { readStored, storedIds, writeStored } from "./store.ts";

const SOURCES = join("data", "sources");

const args = process.argv.slice(2);
const write = args.includes("--write");
const modelAt = args.indexOf("--model");
const model = modelAt >= 0 ? args[modelAt + 1]! : MODEL;
const ids = args
  .filter((arg, i) => arg !== "--write" && (modelAt < 0 || (i !== modelAt && i !== modelAt + 1)))
  .map(Number);

const api = JSON.parse(readFileSync(join(SOURCES, "api.json"), "utf8")) as ApiRow[];
const hosts = rowsByHost(api);

// The link checks of the collect, every row url and host url at once.
type LinkRecord = { rowUrl: LinkCheck | null; hostUrl: LinkCheck | null };
const linkRecords = JSON.parse(readFileSync(join(SOURCES, "links.json"), "utf8")) as LinkRecord[];
const links: Links = new Map();
for (const record of linkRecords) {
  for (const link of [record.rowUrl, record.hostUrl]) if (link) links.set(link.url, link);
}

const pagesOf = (id: number): PageInput[] =>
  (pageList.get(id) ?? []).map((page) => ({
    url: page.url,
    text: readFileSync(join(SOURCES, "pages", pageFileName(page.url)), "utf8").trimEnd(),
  }));

// The extraction fields of a stored host, so the reference and the answer
// have the same shape.
const extractionOf = (host: Host) => HostExtraction.parse(host);

const usage: Usage = { prompt: 0, answer: 0, calls: 0 };
const ask = geminiAsk({ model, usage });
let equal = 0;
const scored = ids.length > 0 ? ids : storedIds();
for (const id of scored) {
  const stored = readStored(id);
  const rows = hosts.get(id);
  if (!stored || !rows) {
    console.log(`${id}: no stored host or no rows`);
    continue;
  }
  let lines: string[];
  try {
    const pages = pagesOf(id);
    const extraction = await extractHost(ask, rows, pages, links);
    lines = differences(extractionOf(stored), extraction);
    if (write) writeStored(buildHost({ rows, extraction, pages }));
  } catch (error) {
    lines = [`failed: ${(error as Error).message}`];
  }
  if (lines.length === 0) {
    equal++;
    console.log(`${id} ${stored.name}: equal`);
  } else {
    console.log(`${id} ${stored.name}:\n${lines.map((l) => `  ${l}`).join("\n")}`);
  }
}
console.log(
  `\n${equal} of ${scored.length} equal on ${model}, ${usage.calls} calls, ` +
    `${usage.prompt} prompt tokens, ${usage.answer} answer tokens`,
);
