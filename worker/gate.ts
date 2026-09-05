import { createSession, isSessionValid, SESSION_COOKIE, SESSION_LIFETIME_MS } from "./session.ts";

export interface GateSecrets {
  LOGIN_USER: string;
  LOGIN_PASS: string;
  COOKIE_SECRET: string;
}

/**
 * The gate in front of the site. It answers a request itself, or returns `null`
 * when the request may have the static asset it asks for.
 */
export async function gate(request: Request, secrets: GateSecrets, now: number): Promise<Response | null> {
  // The static assets are served at `/login/` as well as at `/login`, because
  // Cloudflare adds the trailing slash of the directory index itself.
  const path = new URL(request.url).pathname.replace(/\/$/, "");

  if (path === "/login") {
    return request.method === "POST" ? logIn(request, secrets, now) : null;
  }

  return (await hasSession(request, secrets.COOKIE_SECRET, now)) ? null : seeOther("/login");
}

async function logIn(request: Request, secrets: GateSecrets, now: number): Promise<Response> {
  const form = await request.formData();
  const user = form.get("user");
  const password = form.get("password");

  // Both comparisons always run, so a wrong user takes as long as a wrong password.
  const userMatches = await secretEquals(typeof user === "string" ? user : "", secrets.LOGIN_USER);
  const passwordMatches = await secretEquals(typeof password === "string" ? password : "", secrets.LOGIN_PASS);
  if (!userMatches || !passwordMatches) return seeOther("/login?failed=1");

  const session = await createSession(secrets.COOKIE_SECRET, now);
  const response = seeOther("/");
  response.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_LIFETIME_MS / 1000}`,
  );
  return response;
}

async function hasSession(request: Request, secret: string, now: number): Promise<boolean> {
  const value = readCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  return value !== null && (await isSessionValid(secret, value, now));
}

function readCookie(header: string | null, name: string): string | null {
  if (header === null) return null;

  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) return pair.slice(separator + 1).trim();
  }
  return null;
}

/** Compares two secrets in constant time. The digests make the lengths equal. */
async function secretEquals(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(digestA, digestB);
}

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}
