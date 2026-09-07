import { pageText } from "./page-text.ts";

const TIMEOUT_MS = 20_000;
const MIN_TEXT_LENGTH = 200;
const MAX_REDIRECTS = 10;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

export class PageFetchError extends Error {}

// The login wall in front of a page. Every wall takes the one old-student
// login. `typo3` posts the login form found on `loginUrl`; `wordpress` posts to
// the site's wp-login.php; `post-password` unlocks one protected WordPress post.
export type Wall = "none" | "typo3" | "wordpress" | "post-password";

export type Page = { url: string; wall: Wall; loginUrl?: string };

type Credentials = { user: string; pass: string };

function credentials(): Credentials {
  const user = process.env.OLD_STUDENT_USER;
  const pass = process.env.OLD_STUDENT_PASS;
  if (!user || !pass) throw new PageFetchError("OLD_STUDENT_USER and OLD_STUDENT_PASS are not set");
  return { user, pass };
}

// One browsing session: a cookie jar per host, redirects followed by hand so the
// cookies a login sets on the way survive. One session per collect run, so a
// site is logged in once for all its pages.
export class Session {
  private readonly jars = new Map<string, Map<string, string>>();
  private loggedIn = new Set<string>();

  private jar(host: string): Map<string, string> {
    let jar = this.jars.get(host);
    if (!jar) this.jars.set(host, (jar = new Map()));
    return jar;
  }

  async request(url: string, init: RequestInit = {}, hops = 0): Promise<Response> {
    const host = new URL(url).host;
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      ...(init.headers as Record<string, string> | undefined),
    };
    const cookies = [...this.jar(host)].map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookies) headers.Cookie = cookies;
    let res: Response;
    try {
      res = await fetch(url, { ...init, headers, redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      throw new PageFetchError(`fetch failed: ${(e as Error).message}`);
    }
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(";");
      const eq = pair!.indexOf("=");
      if (eq > 0) this.jar(host).set(pair!.slice(0, eq).trim(), pair!.slice(eq + 1).trim());
    }
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      if (hops >= MAX_REDIRECTS) throw new PageFetchError("too many redirects");
      await res.text();
      // A redirect after a POST is followed as a GET, as a browser does.
      return this.request(new URL(location, url).toString(), { headers: init.headers }, hops + 1);
    }
    return res;
  }

  // Posts the login form on `loginUrl` with the old-student login. The form's
  // hidden fields go along, so TYPO3's request token and WordPress's redirect
  // survive. Done once per login page per session.
  private async login(page: Page): Promise<void> {
    if (page.wall === "none") return;
    const origin = new URL(page.url).origin;
    const key = page.wall === "post-password" ? `${page.wall}:${page.url}` : `${page.wall}:${origin}`;
    if (this.loggedIn.has(key)) return;
    const { user, pass } = credentials();
    if (page.wall === "post-password") {
      const res = await this.request(`${origin}/wp-login.php?action=postpass`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: page.url },
        body: new URLSearchParams({ post_password: pass, Submit: "Enter" }).toString(),
      });
      await res.text();
    } else if (page.wall === "wordpress") {
      // WordPress takes the login on wp-login.php whatever page shows the form.
      const res = await this.request(`${origin}/wp-login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: page.url },
        body: new URLSearchParams({
          log: user,
          pwd: pass,
          redirect_to: page.url,
          testcookie: "1",
          "wp-submit": "Log In",
        }).toString(),
      });
      await res.text();
    } else {
      if (!page.loginUrl) throw new PageFetchError("a typo3 wall needs a loginUrl");
      const form = await this.loginForm(page.loginUrl);
      const fields = new URLSearchParams(form.hidden);
      fields.set("user", user);
      fields.set("pass", pass);
      fields.set("logintype", "login");
      const res = await this.request(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: page.loginUrl },
        body: fields.toString(),
      });
      await res.text();
    }
    this.loggedIn.add(key);
  }

  // The TYPO3 login form on `loginUrl`: its action and hidden fields. The hidden
  // fields carry the request token the login needs.
  private async loginForm(loginUrl: string) {
    const res = await this.request(loginUrl);
    const html = await res.text();
    const forms = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) ?? [];
    const form = forms.find((f) => /type="password"/i.test(f));
    if (!form) throw new PageFetchError(`no login form on ${loginUrl}`);
    const actionRaw = form.match(/action="([^"]*)"/)?.[1]?.replace(/&amp;/g, "&");
    const action = actionRaw ? new URL(actionRaw, loginUrl).toString() : loginUrl;
    const hidden: [string, string][] = [];
    for (const input of form.matchAll(/<input[^>]*>/gi)) {
      const tag = input[0];
      if (!/type="hidden"/i.test(tag)) continue;
      const name = tag.match(/name="([^"]*)"/)?.[1];
      if (name) hidden.push([name, tag.match(/value="([^"]*)"/)?.[1] ?? ""]);
    }
    return { action, hidden };
  }

  // The stripped text of one page, logged in when the page has a wall.
  // Throws PageFetchError on a non-2xx status, a network error or timeout, a
  // final URL on another host, a page that still shows a login form, or text
  // shorter than the floor.
  async fetchPage(page: Page): Promise<string> {
    await this.login(page);
    const res = await this.request(page.url);
    const final = new URL(res.url || page.url);
    if (!res.ok) throw new PageFetchError(`status ${res.status}`);
    if (final.host !== new URL(page.url).host) throw new PageFetchError(`redirected to ${final.host}`);
    const html = await res.text();
    if (/login/i.test(final.pathname) || isLoginWall(html)) {
      throw new PageFetchError(page.wall === "none" ? "behind a login wall" : `the ${page.wall} login did not open it`);
    }
    const text = pageText(html);
    if (text.length < MIN_TEXT_LENGTH) throw new PageFetchError(`only ${text.length} characters of text`);
    return text;
  }
}

// A page that answers 200 but shows only a login or post-password form.
function isLoginWall(html: string): boolean {
  const forms = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) ?? [];
  const passwordForms = forms.filter((f) => /type="password"/i.test(f));
  if (passwordForms.length === 0) return false;
  // A WordPress protected post shows the form in place of the body.
  if (passwordForms.some((f) => /post_password|logintype|wp-login/i.test(f))) {
    const body = pageText(html);
    return body.length < 2_000;
  }
  return false;
}

export async function fetchPage(page: Page): Promise<string> {
  return new Session().fetchPage(page);
}
