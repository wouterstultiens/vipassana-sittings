// One row on https://www.dhamma.org/api/v1/events/virtual, limited to the
// fields the pipeline reads. A host owns one or more rows: its sub_location.
export type ApiRow = {
  id: number;
  name: string;
  short_description: string | null;
  description: string;
  url: string | null;
  schedule: string | null;
  event_instruction_languages: string[];
  sub_location: {
    id: number;
    name: string;
    description: string | null;
    url: string | null;
    contact_email: string | null;
    city: string | null;
    country_iso_code: string;
    time_zone: string;
  };
};

export const API_URL = "https://www.dhamma.org/api/v1/events/virtual";

// The whole endpoint, or a throw. Nothing downstream runs on a partial answer.
export async function fetchApi(): Promise<ApiRow[]> {
  const res = await fetch(API_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`the virtual endpoint answered ${res.status}`);
  const body: unknown = await res.json();
  if (!Array.isArray(body)) throw new Error("the virtual endpoint did not answer with a list");
  if (body.length === 0) throw new Error("the virtual endpoint answered with zero rows");
  return body as ApiRow[];
}

// The rows of every host, keyed by host id, in API order.
export function rowsByHost(rows: ApiRow[]): Map<number, ApiRow[]> {
  const hosts = new Map<number, ApiRow[]>();
  for (const row of rows) {
    const id = row.sub_location.id;
    hosts.set(id, [...(hosts.get(id) ?? []), row]);
  }
  return hosts;
}
