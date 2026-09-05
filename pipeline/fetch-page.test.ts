import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPage, PageFetchError } from "./fetch-page.ts";

const html = readFileSync(new URL("./fixtures/host-page.html", import.meta.url), "utf8");
const URL_UNDER_TEST = "https://example.invalid/sittings";

const answer = (init: { body?: string; status?: number; url?: string } = {}) => {
  const res = new Response(init.body ?? html, { status: init.status ?? 200 });
  Object.defineProperty(res, "url", { value: init.url ?? URL_UNDER_TEST });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
};

afterEach(() => vi.unstubAllGlobals());

describe("fetchPage", () => {
  it("gives the stripped page text", async () => {
    answer();
    await expect(fetchPage(URL_UNDER_TEST, false)).resolves.toContain("Monday and Thursday");
  });

  it("fails on a non-2xx status", async () => {
    answer({ status: 401 });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow("status 401");
  });

  it("fails on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket hang up")));
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow(PageFetchError);
  });

  it("fails when the page redirects to another host", async () => {
    answer({ url: "https://teams.invalid/meeting" });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow("redirected to teams.invalid");
  });

  it("fails when the page redirects to a login form on the same host", async () => {
    answer({ url: "https://example.invalid/en/login/" });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow("login page");
  });

  it("fails when too little text is left", async () => {
    answer({ body: "<p>Coming soon</p>" });
    await expect(fetchPage(URL_UNDER_TEST, false)).rejects.toThrow(/only \d+ characters/);
  });

  it("fails when a basic-auth page has no credentials", async () => {
    answer();
    vi.stubEnv("OLD_STUDENT_USER", "");
    vi.stubEnv("OLD_STUDENT_PASS", "");
    await expect(fetchPage(URL_UNDER_TEST, true)).rejects.toThrow("are not set");
  });

  it("sends the old-student credentials for a basic-auth page", async () => {
    answer();
    vi.stubEnv("OLD_STUDENT_USER", "student");
    vi.stubEnv("OLD_STUDENT_PASS", "secret");
    await fetchPage(URL_UNDER_TEST, true);
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Basic " + btoa("student:secret"));
  });
});
