import type { Session } from "./fetch-page.ts";

// Where a URL ends up after its redirects. A row url that lands on a meeting
// service is itself the join link; a host url that answers 404 is dead.
export type LinkCheck = { url: string; status: number | null; finalUrl: string | null; error: string | null };

// The API writes some urls relative to dhamma.org.
export const absoluteUrl = (u: string) => (u.startsWith("/") ? `https://www.dhamma.org${u}` : u);

export async function checkLink(session: Session, url: string): Promise<LinkCheck> {
  try {
    const res = await session.request(url);
    await res.text();
    return { url, status: res.status, finalUrl: res.url || url, error: null };
  } catch (error) {
    return { url, status: null, finalUrl: null, error: (error as Error).message };
  }
}

const site = (url: string) => new URL(url).host.replace(/^www\./, "");

// One line the extraction reads after a url: where it leads. A landing url on
// the same site is given in full, so a page link can be written as it lands.
// A landing url on another site is named by its host only, so a meeting
// service is recognised while its launcher url, with its per-request ids, is
// never copied into a join.
export function describeLink(link: LinkCheck): string {
  if (link.status === null) return `leads to: unreachable (${link.error})`;
  if (!link.finalUrl || link.finalUrl === link.url) return `leads to: status ${link.status}`;
  const landed = site(link.finalUrl) === site(link.url) ? link.finalUrl : new URL(link.finalUrl).host;
  return `leads to: status ${link.status}, lands on ${landed}`;
}
