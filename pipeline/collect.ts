// Collects every source behind the calendar into data/sources/, so a change to
// the extraction can be judged against the complete material.
//
//   api.json          the raw dhamma.org virtual events API, every row
//   pages/<name>.txt  the stripped text of every page in the page list,
//                     fetched once even when several hosts share it
//   pages.json        per page: the hosts that use it, when it was fetched,
//                     and the failure when it could not be read
//   links.json        per row: where its own url and its host's url lead. A
//                     row url may redirect straight into a meeting, and a
//                     host url may be dead.
//
// Usage: pnpm collect

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type ApiRow, fetchApi, rowsByHost } from "./api.ts";
import { type Page, Session } from "./fetch-page.ts";
import { excludedIds, pageList } from "./lists.ts";
import { pageFileName } from "./page-file.ts";

const DIR = join("data", "sources");
const PAGES = join(DIR, "pages");

type PageRecord = {
  url: string;
  wall: string;
  hostIds: number[];
  file: string;
  fetchedAt: string;
  characters: number | null;
  error: string | null;
};

type LinkCheck = { url: string; status: number | null; finalUrl: string | null; error: string | null };

type LinkRecord = { id: number; hostId: number; rowUrl: LinkCheck | null; hostUrl: LinkCheck | null };

// Where a URL ends up after its redirects. A row url that lands on a meeting
// service is itself the join link.
async function checkLink(session: Session, url: string): Promise<LinkCheck> {
  try {
    const res = await session.request(url);
    await res.text();
    return { url, status: res.status, finalUrl: res.url || url, error: null };
  } catch (error) {
    return { url, status: null, finalUrl: null, error: (error as Error).message };
  }
}

const api: ApiRow[] = await fetchApi();
const hosts = new Map([...rowsByHost(api)].filter(([id]) => !excludedIds.has(id)));

rmSync(DIR, { recursive: true, force: true });
mkdirSync(PAGES, { recursive: true });
writeFileSync(join(DIR, "api.json"), JSON.stringify(api, null, 2) + "\n");

// Every page once, with the hosts that point at it.
const byUrl = new Map<string, { page: Page; hostIds: number[] }>();
for (const [id, pages] of pageList) {
  if (!hosts.has(id)) {
    console.warn(`warning: host ${id} is in sources.json but not in the API`);
    continue;
  }
  for (const page of pages) {
    const entry = byUrl.get(page.url) ?? { page, hostIds: [] };
    entry.hostIds.push(id);
    byUrl.set(page.url, entry);
  }
}

const session = new Session();
const pageRecords: PageRecord[] = [];
let failed = 0;
for (const { page, hostIds } of byUrl.values()) {
  const file = pageFileName(page.url);
  const record: PageRecord = {
    url: page.url,
    wall: page.wall,
    hostIds: hostIds.sort((a, b) => a - b),
    file,
    fetchedAt: new Date().toISOString(),
    characters: null,
    error: null,
  };
  try {
    const text = await session.fetchPage(page);
    writeFileSync(join(PAGES, file), text + "\n");
    record.characters = text.length;
    console.log(`ok    ${page.url} (${text.length} characters)`);
  } catch (error) {
    record.error = (error as Error).message;
    failed++;
    console.log(`fail  ${page.url}: ${record.error}`);
  }
  pageRecords.push(record);
}
writeFileSync(join(DIR, "pages.json"), JSON.stringify(pageRecords, null, 2) + "\n");

const absolute = (u: string) => (u.startsWith("/") ? `https://www.dhamma.org${u}` : u);
const links: LinkRecord[] = [];
for (const rows of hosts.values()) {
  for (const row of rows) {
    const rowUrl = row.url?.trim() || null;
    const hostUrl = row.sub_location.url?.trim() || null;
    links.push({
      id: row.id,
      hostId: row.sub_location.id,
      rowUrl: rowUrl ? await checkLink(session, absolute(rowUrl)) : null,
      hostUrl: hostUrl ? await checkLink(session, absolute(hostUrl)) : null,
    });
  }
}
writeFileSync(join(DIR, "links.json"), JSON.stringify(links, null, 2) + "\n");

const withoutPage = [...hosts.keys()].filter((id) => !pageList.has(id));
console.log(
  `\n${hosts.size} hosts, ${api.length} rows, ${byUrl.size} pages, ${failed} failed, ` +
    `${withoutPage.length} hosts without a page: ${withoutPage.join(", ")}`,
);
if (failed > 0) process.exit(1);
