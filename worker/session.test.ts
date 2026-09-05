import { describe, expect, it } from "vitest";
import { createSession, isSessionValid, SESSION_LIFETIME_MS } from "./session.ts";

const SECRET = "a-cookie-secret";
const NOW = Date.UTC(2026, 8, 5);

describe("the session cookie", () => {
  it("accepts a cookie it signed itself", async () => {
    const cookie = await createSession(SECRET, NOW);
    expect(await isSessionValid(SECRET, cookie, NOW)).toBe(true);
  });

  it("lasts one year", async () => {
    const cookie = await createSession(SECRET, NOW);
    expect(await isSessionValid(SECRET, cookie, NOW + SESSION_LIFETIME_MS - 1)).toBe(true);
    expect(await isSessionValid(SECRET, cookie, NOW + SESSION_LIFETIME_MS)).toBe(false);
  });

  it("refuses a cookie signed with another secret", async () => {
    const cookie = await createSession("another-secret", NOW);
    expect(await isSessionValid(SECRET, cookie, NOW)).toBe(false);
  });

  it("refuses a cookie with a changed expiry", async () => {
    const cookie = await createSession(SECRET, NOW);
    const signature = cookie.slice(cookie.indexOf(".") + 1);
    expect(await isSessionValid(SECRET, `99999999999999.${signature}`, NOW)).toBe(false);
  });

  it("refuses malformed cookies", async () => {
    for (const value of ["", ".", "abc", "123", "123.", "123.zz", `${NOW}.${"a".repeat(63)}`]) {
      expect(await isSessionValid(SECRET, value, NOW)).toBe(false);
    }
  });
});
