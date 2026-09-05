import { describe, expect, it } from "vitest";
import { gate, type GateSecrets } from "./gate.ts";
import { createSession, SESSION_LIFETIME_MS } from "./session.ts";

const secrets: GateSecrets = {
  LOGIN_USER: "old-student",
  LOGIN_PASS: "a-long-pass-phrase",
  COOKIE_SECRET: "a-cookie-secret",
};

const NOW = Date.UTC(2026, 8, 5);

function get(path: string, cookie?: string): Request {
  return new Request(`https://sittings.example${path}`, {
    headers: cookie === undefined ? undefined : { Cookie: cookie },
  });
}

function login(user: string, password: string): Request {
  const body = new URLSearchParams({ user, password });
  return new Request("https://sittings.example/login", { method: "POST", body });
}

describe("the gate", () => {
  it("serves the login page without a cookie", async () => {
    expect(await gate(get("/login"), secrets, NOW)).toBe(null);
  });

  it("serves the login page at the trailing-slash path Cloudflare redirects to", async () => {
    expect(await gate(get("/login/?failed=1"), secrets, NOW)).toBe(null);
  });

  it("sends a request without a cookie to the login page", async () => {
    const response = await gate(get("/"), secrets, NOW);
    expect(response?.status).toBe(303);
    expect(response?.headers.get("Location")).toBe("/login");
  });

  it("sends a request with a forged cookie to the login page", async () => {
    const forged = await createSession("another-cookie-secret", NOW);
    const response = await gate(get("/", `session=${forged}`), secrets, NOW);
    expect(response?.status).toBe(303);
  });

  it("sends a request with an expired cookie to the login page", async () => {
    const cookie = await createSession(secrets.COOKIE_SECRET, NOW);
    const response = await gate(get("/", `session=${cookie}`), secrets, NOW + SESSION_LIFETIME_MS + 1);
    expect(response?.status).toBe(303);
  });

  it("serves the asset for a request with a valid cookie", async () => {
    const cookie = await createSession(secrets.COOKIE_SECRET, NOW);
    expect(await gate(get("/", `other=1; session=${cookie}`), secrets, NOW)).toBe(null);
  });

  it("sets a session cookie on a correct login", async () => {
    const response = await gate(login("old-student", "a-long-pass-phrase"), secrets, NOW);
    expect(response?.status).toBe(303);
    expect(response?.headers.get("Location")).toBe("/");

    const setCookie = response?.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("Max-Age=31536000");

    const cookie = setCookie.slice(0, setCookie.indexOf(";"));
    expect(await gate(get("/", cookie), secrets, NOW)).toBe(null);
  });

  it("sends a wrong password back to the login page", async () => {
    const response = await gate(login("old-student", "wrong"), secrets, NOW);
    expect(response?.status).toBe(303);
    expect(response?.headers.get("Location")).toBe("/login?failed=1");
    expect(response?.headers.get("Set-Cookie")).toBe(null);
  });

  it("sends a wrong user back to the login page", async () => {
    const response = await gate(login("someone-else", "a-long-pass-phrase"), secrets, NOW);
    expect(response?.headers.get("Location")).toBe("/login?failed=1");
  });

  it("sends a login without form fields back to the login page", async () => {
    const request = new Request("https://sittings.example/login", { method: "POST", body: new URLSearchParams() });
    const response = await gate(request, secrets, NOW);
    expect(response?.headers.get("Location")).toBe("/login?failed=1");
  });
});
