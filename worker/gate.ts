import { createSignIn, isSignInValid, SIGN_IN_COOKIE, SIGN_IN_LIFETIME_MS } from "./sign-in.ts";

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

  return (await hasSignIn(request, secrets.COOKIE_SECRET, now)) ? null : seeOther("/login");
}

async function logIn(request: Request, secrets: GateSecrets, now: number): Promise<Response> {
  const form = await readForm(request);

  // Both comparisons always run, so a wrong name takes as long as a wrong password.
  const nameMatches = await secretEquals(field(form, "user"), secrets.LOGIN_USER);
  const passwordMatches = await secretEquals(field(form, "password"), secrets.LOGIN_PASS);
  if (!nameMatches || !passwordMatches) return seeOther("/login?failed=1");

  const signIn = await createSignIn(secrets.COOKIE_SECRET, now);
  const response = seeOther("/");
  response.headers.set(
    "Set-Cookie",
    `${SIGN_IN_COOKIE}=${signIn}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SIGN_IN_LIFETIME_MS / 1000}`,
  );
  return response;
}

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

/** A body that is not a form is an empty form, and thus a failed sign-in. */
async function readForm(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    return new FormData();
  }
}

async function hasSignIn(request: Request, secret: string, now: number): Promise<boolean> {
  const value = readCookie(request.headers.get("Cookie"), SIGN_IN_COOKIE);
  return value !== null && (await isSignInValid(secret, value, now));
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
async function secretEquals(given: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [digestGiven, digestExpected] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(given)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(digestGiven, digestExpected);
}

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}
