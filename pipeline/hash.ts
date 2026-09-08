import { createHash } from "node:crypto";
import type { ApiRow } from "./api.ts";
import type { PageInput } from "./fetch-page.ts";

export function hashText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// The fields of a row the extraction reads, in a fixed order. A change in any
// other field costs no LLM call.
const rowFields = (row: ApiRow) => {
  const s = row.sub_location;
  return [
    row.id,
    row.name,
    row.short_description,
    row.description,
    row.url,
    row.schedule,
    row.event_instruction_languages,
    s.id,
    s.name,
    s.description,
    s.url,
    s.contact_email,
    s.city,
    s.country_iso_code,
    s.time_zone,
  ];
};

// One hash over everything the extraction reads for a host: its rows in id
// order and its pages in list order. The host is extracted again when it moves.
export function inputHash(rows: ApiRow[], pages: PageInput[]): string {
  const sorted = [...rows].sort((a, b) => a.id - b.id).map(rowFields);
  return hashText(JSON.stringify([sorted, pages.map((p) => [p.url, p.text])]));
}
