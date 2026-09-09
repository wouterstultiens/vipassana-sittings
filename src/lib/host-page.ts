// Where an old student reads a host's own words. Most hosts keep a page of
// their own. The rest live only on the dhamma.org virtual events page, where
// the title says which entry is theirs.
import type { Host } from "@/schema/host";

export const VIRTUAL_EVENTS_URL = "https://www.dhamma.org/en-US/os/locations/virtual_events";

/** The page link of a host, and the title to look for when the link is the virtual events page. */
export function hostPage(host: Host): { url: string; title: string | null } {
  return host.pageUrl ? { url: host.pageUrl, title: null } : { url: VIRTUAL_EVENTS_URL, title: host.eventsTitle };
}
