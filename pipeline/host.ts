import { Host, type HostExtraction } from "../src/schema/host.ts";
import type { ApiRow } from "./api.ts";
import type { PageInput } from "./extract.ts";
import { inputHash } from "./hash.ts";

// Joins an extraction with the fields the pipeline copies from the API or
// computes itself, giving the stored host. The rows all belong to one host.
export function buildHost(input: { rows: ApiRow[]; extraction: HostExtraction; pages: PageInput[] }): Host {
  const { rows, extraction, pages } = input;
  const s = rows[0]!.sub_location;
  return Host.parse({
    ...extraction,
    id: s.id,
    country: s.country_iso_code,
    city: s.city?.trim() || null,
    email: s.contact_email?.trim() || null,
    inputHash: inputHash(rows, pages),
  });
}
