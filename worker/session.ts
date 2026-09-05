const encoder = new TextEncoder();

export const SESSION_COOKIE = "session";

/** One year, the lifetime of a session cookie. */
export const SESSION_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * The cookie value is `<expiry>.<hmac>`: the expiry timestamp in milliseconds,
 * signed with HMAC-SHA256 and the cookie secret.
 */
export async function createSession(secret: string, now: number): Promise<string> {
  const expiry = String(now + SESSION_LIFETIME_MS);
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(expiry));
  return `${expiry}.${toHex(signature)}`;
}

export async function isSessionValid(secret: string, value: string, now: number): Promise<boolean> {
  const separator = value.indexOf(".");
  if (separator < 0) return false;

  const expiry = value.slice(0, separator);
  if (!/^\d+$/.test(expiry)) return false;

  const signature = fromHex(value.slice(separator + 1));
  if (signature === null) return false;

  const signed = await crypto.subtle.verify("HMAC", await signingKey(secret), signature, encoder.encode(expiry));
  return signed && Number(expiry) > now;
}

function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) return null;

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
