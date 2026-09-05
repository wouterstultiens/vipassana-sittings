import { describe, expect, it } from "vitest";
import { createSignIn, isSignInValid, SIGN_IN_LIFETIME_MS } from "./sign-in.ts";

const SECRET = "a-cookie-secret";
const NOW = Date.UTC(2026, 8, 5);

describe("the sign-in cookie", () => {
  it("accepts a cookie it signed itself", async () => {
    const cookie = await createSignIn(SECRET, NOW);
    expect(await isSignInValid(SECRET, cookie, NOW)).toBe(true);
  });

  it("lasts one year", async () => {
    const cookie = await createSignIn(SECRET, NOW);
    expect(await isSignInValid(SECRET, cookie, NOW + SIGN_IN_LIFETIME_MS - 1)).toBe(true);
    expect(await isSignInValid(SECRET, cookie, NOW + SIGN_IN_LIFETIME_MS)).toBe(false);
  });

  it("refuses a cookie signed with another secret", async () => {
    const cookie = await createSignIn("another-secret", NOW);
    expect(await isSignInValid(SECRET, cookie, NOW)).toBe(false);
  });

  it("refuses a cookie with a changed expiry", async () => {
    const cookie = await createSignIn(SECRET, NOW);
    const signature = cookie.slice(cookie.indexOf(".") + 1);
    expect(await isSignInValid(SECRET, `99999999999999.${signature}`, NOW)).toBe(false);
  });

  it("refuses malformed cookies", async () => {
    for (const value of ["", ".", "abc", "123", "123.", "123.zz", `${NOW}.${"a".repeat(63)}`]) {
      expect(await isSignInValid(SECRET, value, NOW)).toBe(false);
    }
  });
});
