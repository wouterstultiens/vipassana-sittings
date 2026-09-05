// Hand-made pipeline inputs for the unit tests. The real listings hold join
// links and passwords, so no fixture is copied from the data repo.
import { readFileSync } from "node:fs";
import type { ApiListing } from "../api.ts";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

export const hostPageHtml: string = read("./host-page.html");

export const anApiListing = (over: Partial<ApiListing> = {}): ApiListing => ({
  ...(JSON.parse(read("./api-listing.json")) as ApiListing),
  ...over,
});
