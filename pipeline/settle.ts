// Says that a host file is written from the sources as they are now: stamps
// the host with the input hash of its live sources and takes the mark off, so
// the site stops sending the old student to the host page. Run it after you
// have written the host file by hand.
//
// Usage: pnpm settle <id> [id...]

import { fetchApi, rowsByHost } from "./api.ts";
import { LiveSources } from "./live.ts";
import { pageList } from "./lists.ts";
import { readStored, writeStored } from "./store.ts";

const ids = process.argv.slice(2).map(Number);
if (ids.length === 0 || ids.some((id) => !Number.isInteger(id))) {
  console.error("Usage: pnpm settle <id> [id...]");
  process.exit(1);
}

const hosts = rowsByHost(await fetchApi());
const live = new LiveSources();

for (const id of ids) {
  const rows = hosts.get(id);
  const stored = readStored(id);
  if (!rows || !stored) {
    console.error(`${id}: no rows in the API, or no file that fits the schema`);
    process.exit(1);
  }
  const inputHash = await live.hash(rows, pageList.get(id) ?? []);
  writeStored({ ...stored, inputHash, sourcesChanged: false });
  console.log(`${id} ${stored.name}: settled`);
}
