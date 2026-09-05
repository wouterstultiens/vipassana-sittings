import { pageText } from "./page-text.ts";

const TIMEOUT_MS = 20_000;
const MIN_TEXT_LENGTH = 200;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

export class PageFetchError extends Error {}

// Fetches one host page and returns its stripped text. Throws PageFetchError on
// a non-2xx status, a network error or timeout, a final URL on another host, a
// final URL whose path contains "login", or text shorter than the floor.
export async function fetchPage(url: string, basicAuth: boolean): Promise<string> {
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  if (basicAuth) {
    const user = process.env.OLD_STUDENT_USER;
    const pass = process.env.OLD_STUDENT_PASS;
    if (!user || !pass) throw new PageFetchError("OLD_STUDENT_USER and OLD_STUDENT_PASS are not set");
    headers.Authorization = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  }
  let res: Response;
  try {
    res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new PageFetchError(`fetch failed: ${(e as Error).message}`);
  }
  if (!res.ok) throw new PageFetchError(`status ${res.status}`);
  const final = new URL(res.url);
  if (final.host !== new URL(url).host) throw new PageFetchError(`redirected to ${final.host}`);
  if (/login/i.test(final.pathname)) throw new PageFetchError(`redirected to login page ${final.pathname}`);
  const text = pageText(await res.text());
  if (text.length < MIN_TEXT_LENGTH) throw new PageFetchError(`only ${text.length} characters of text`);
  return text;
}
