import { afterEach, describe, expect, it, vi } from "vitest";
import { PageFetchError, fetchPage } from "./fetch-page.ts";
import { hostPageHtml } from "./fixtures/index.ts";

const URL_UNDER_TEST = "https://example.org/os/sittings";
const longPage = `<p>${"Every Monday at 07:00 Amsterdam time. ".repeat(20)}</p>`;

// A fetch that answers one response, and records the request it was given.
function stubFetch(answer: Partial<Response> | Error) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (answer instanceof Error) throw answer;
    return { ok: true, status: 200, url: URL_UNDER_TEST, text: async () => "", ...answer } as Response;
  });
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OLD_STUDENT_USER;
  delete process.env.OLD_STUDENT_PASS;
});

describe("fetchPage", () => {
  it("returns the stripped text of a page that answers", async () => {
    stubFetch({ text: async () => longPage });
    expect(await fetchPage(URL_UNDER_TEST, false)).toContain("Every Monday at 07:00");
  });

  it("fails on a non-2xx status", async () => {
    stubFetch({ ok: false, status: 401 });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow(/status 401/);
  });

  it("fails on a network error or a timeout", async () => {
    stubFetch(new Error("connect ETIMEDOUT"));
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow(/fetch failed: connect ETIMEDOUT/);
  });

  it("fails when the final URL is on another host", async () => {
    stubFetch({ url: "https://teams.microsoft.com/l/meetup-join/19", text: async () => longPage });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow(/redirected to teams.microsoft.com/);
  });

  it("fails when the final path is a login form on the same host", async () => {
    stubFetch({ url: "https://example.org/en/login", text: async () => longPage });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow(/redirected to login page/);
  });

  it("fails when the stripped text is under the floor", async () => {
    stubFetch({ text: async () => hostPageHtml });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow(/only \d+ characters of text/);
  });

  it("every failure is a PageFetchError, so the run marks the listing failed", async () => {
    stubFetch({ ok: false, status: 500 });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toBeInstanceOf(PageFetchError);
  });

  it("sends the old-student credentials when the page is marked basic auth", async () => {
    process.env.OLD_STUDENT_USER = "student";
    process.env.OLD_STUDENT_PASS = "secret";
    const calls = stubFetch({ text: async () => longPage });
    await fetchPage(URL_UNDER_TEST, true);
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Basic " + Buffer.from("student:secret").toString("base64"));
  });

  it("fails when a basic-auth page has no credentials set", async () => {
    stubFetch({ text: async () => longPage });
    await expect(fetchPage(URL_UNDER_TEST, true)).rejects.toThrow(/OLD_STUDENT_USER and OLD_STUDENT_PASS/);
  });
});
