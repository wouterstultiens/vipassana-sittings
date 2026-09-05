import { Listing, type ListingExtraction } from "../src/schema/listing.ts";
import type { ApiListing } from "./api.ts";
import { apiHash, hashText } from "./hash.ts";

const DHAMMA_ORIGIN = "https://www.dhamma.org";

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

// Trims whitespace and resolves relative paths against www.dhamma.org.
// Nothing else is repaired.
export function cleanUrl(url: string | null): string | null {
  if (url === null) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  if (trimmed.startsWith("/")) return DHAMMA_ORIGIN + trimmed;
  return trimmed;
}

// Joins an extraction with the fields the pipeline copies from the API or sets
// itself, giving the stored record.
export function buildListing(input: {
  api: ApiListing;
  extraction: ListingExtraction;
  hostPageUrl: string | null;
  pageText: string | null;
  extractedAt: string;
}): Listing {
  const { api, extraction, hostPageUrl, pageText, extractedAt } = input;
  const s = api.sub_location;
  return Listing.parse({
    id: api.id,
    name: clean(api.name),
    country: s.country_iso_code,
    host: {
      name: clean(s.name),
      city: s.city,
      email: s.contact_email?.trim() ?? null,
      url: cleanUrl(s.url),
    },
    ...extraction,
    hostPageUrl,
    apiHash: apiHash(api),
    pageHash: pageText === null ? null : hashText(pageText),
    extractedAt,
    description: api.description,
  });
}
