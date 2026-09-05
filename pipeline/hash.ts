import { createHash } from "node:crypto";
import type { ApiListing } from "./api.ts";

export function hashText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// Covers only the fields the pipeline reads, in a fixed order. A change in any
// other field of the raw listing costs no LLM call.
export function apiHash(listing: ApiListing): string {
  const s = listing.sub_location;
  const fields = [
    listing.name,
    listing.short_description,
    listing.description,
    listing.url,
    listing.schedule,
    listing.event_instruction_languages,
    s.name,
    s.description,
    s.url,
    s.contact_email,
    s.city,
    s.country_iso_code,
    s.time_zone,
  ];
  return hashText(JSON.stringify(fields));
}
