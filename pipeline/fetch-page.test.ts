import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPage, PageFetchError, Session } from "./fetch-page.ts";

const html = readFileSync(new URL("./fixtures/host-page.html", import.meta.url), "utf8");
const PAGE = "https://example.invalid/os/sittings/";
const LOGIN = "https://example.invalid/os/";

const typo3Form = `<html><body><form action="/os/?tx_felogin_login%5Baction%5D=login" method="post">
<input type="hidden" name="__RequestToken" value="tok123">
<input type="text" name="user"><input type="password" name="pass">
</form></body></html>`;

const drupalForm = `<html><body><form action="/user/login" method="post" id="user-login">
<input type="text" name="name"><input type="password" name="pass">
<input type="hidden" name="form_build_id" value="form-abc">
<input type="hidden" name="form_id" value="user_login">
</form></body></html>`;

const siteWidePasswordForm = `<html><body><form action="https://example.invalid/?password-protected=login" method="post">
<input type="password" name="password_protected_pwd"></form></body></html>`;

const themeLoginForm = `<html><body><p>You are required to login to view this page.</p>
<form action="https://example.invalid/user-login/" method="post">
<input type="text" name="log"><input type="password" name="pwd"></form></body></html>`;

const postPasswordForm = `<html><body><form action="https://example.invalid/wp-login.php?action=postpass" method="post">
<p>To view this protected post, enter the password below:</p>
<input name="post_password" type="password"></form></body></html>`;

// The WordPress login page as a theme renders it: the form inside the whole
// site, so the text around it is long. Dhamma Dhara answered like this.
const loginPageInFullSite = `<html><body><nav>${"Old Students Courses Schedule Contact ".repeat(150)}</nav>
<form name="loginform" action="https://example.invalid/wp-login.php" method="post">
<label>Username</label><input name="log" type="text">
<label>Password</label><input name="pwd" type="password">
<label>Remember Me</label><input type="submit" value="Log In"></form></body></html>`;

type Call = { url: string; init: RequestInit };
let calls: Call[];

// One canned answer per URL, in call order; the page HTML for anything else.
const serve = (answers: Record<string, () => Response>) => {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const res = answers[url]?.() ?? new Response(html, { status: 200 });
      Object.defineProperty(res, "url", { value: url });
      return res;
    }),
  );
};
const redirect = (to: string, cookie?: string) =>
  new Response(null, { status: 302, headers: cookie ? { location: to, "set-cookie": cookie } : { location: to } });

beforeEach(() => {
  vi.stubEnv("OLD_STUDENT_USER", "student");
  vi.stubEnv("OLD_STUDENT_PASS", "secret");
});
afterEach(() => vi.unstubAllGlobals());

describe("fetchPage without a wall", () => {
  it("gives the stripped page text", async () => {
    serve({});
    await expect(fetchPage({ url: PAGE, wall: "none" })).resolves.toContain("Monday and Thursday");
  });

  it("fails on a non-2xx status", async () => {
    serve({ [PAGE]: () => new Response("", { status: 401 }) });
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow("status 401");
  });

  it("fails on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket hang up")));
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow(PageFetchError);
  });

  it("follows a redirect on the same host", async () => {
    serve({ [PAGE]: () => redirect("https://example.invalid/os/sittings-2/") });
    await expect(fetchPage({ url: PAGE, wall: "none" })).resolves.toContain("Monday and Thursday");
  });

  it("fails when the page redirects to another host", async () => {
    serve({ [PAGE]: () => redirect("https://teams.invalid/meeting") });
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow("redirected to teams.invalid");
  });

  it("fails when the page redirects to a login form on the same host", async () => {
    serve({ [PAGE]: () => redirect("https://example.invalid/en/login/") });
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow("behind a login wall");
  });

  it("fails when the page answers 200 with only a password form", async () => {
    serve({ [PAGE]: () => new Response(postPasswordForm) });
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow("behind a login wall");
  });

  it("fails on a login form wrapped in a whole page, however long the text", async () => {
    serve({ [PAGE]: () => new Response(loginPageInFullSite) });
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow("behind a login wall");
  });

  it("fails when too little text is left", async () => {
    serve({ [PAGE]: () => new Response("<p>Coming soon</p>") });
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow(/only \d+ characters/);
  });

  it("gives up on a redirect loop", async () => {
    serve({ [PAGE]: () => redirect(PAGE) });
    await expect(fetchPage({ url: PAGE, wall: "none" })).rejects.toThrow("too many redirects");
  });
});

describe("fetchPage behind a wall", () => {
  it("fails when the credentials are not set", async () => {
    vi.stubEnv("OLD_STUDENT_USER", "");
    serve({});
    await expect(fetchPage({ url: PAGE, wall: "wordpress" })).rejects.toThrow("are not set");
  });

  it("posts the TYPO3 form with its hidden fields, then keeps the cookie", async () => {
    serve({
      [LOGIN]: () => new Response(typo3Form),
      "https://example.invalid/os/?tx_felogin_login%5Baction%5D=login": () =>
        redirect(LOGIN, "fe_typo_user=abc; Path=/; HttpOnly"),
    });
    await fetchPage({ url: PAGE, wall: "typo3", loginUrl: LOGIN });
    const post = calls.find((c) => c.init.method === "POST")!;
    expect(post.url).toBe("https://example.invalid/os/?tx_felogin_login%5Baction%5D=login");
    const body = new URLSearchParams(post.init.body as string);
    expect(body.get("__RequestToken")).toBe("tok123");
    expect(body.get("user")).toBe("student");
    expect(body.get("pass")).toBe("secret");
    expect(body.get("logintype")).toBe("login");
    const page = calls.find((c) => c.url === PAGE)!;
    expect((page.init.headers as Record<string, string>).Cookie).toBe("fe_typo_user=abc");
  });

  it("posts the WordPress login to wp-login.php", async () => {
    serve({
      "https://example.invalid/wp-login.php": () => redirect(PAGE, "wordpress_logged_in=xyz; Path=/"),
    });
    await fetchPage({ url: PAGE, wall: "wordpress" });
    const post = calls.find((c) => c.init.method === "POST")!;
    expect(post.url).toBe("https://example.invalid/wp-login.php");
    const body = new URLSearchParams(post.init.body as string);
    expect(body.get("log")).toBe("student");
    expect(body.get("pwd")).toBe("secret");
    expect(body.get("redirect_to")).toBe(PAGE);
  });

  it("unlocks a protected WordPress post with the password", async () => {
    serve({
      "https://example.invalid/wp-login.php?action=postpass": () =>
        redirect(PAGE, "wp-postpass_1=hash; Path=/"),
    });
    await fetchPage({ url: PAGE, wall: "post-password" });
    const post = calls.find((c) => c.init.method === "POST")!;
    expect(new URLSearchParams(post.init.body as string).get("post_password")).toBe("secret");
    expect((post.init.headers as Record<string, string>).Referer).toBe(PAGE);
  });

  it("posts the Drupal form with its build id, then keeps the cookie", async () => {
    serve({
      [LOGIN]: () => new Response(drupalForm),
      "https://example.invalid/user/login": () => redirect(PAGE, "SESSabc=xyz; Path=/"),
    });
    await fetchPage({ url: PAGE, wall: "drupal", loginUrl: LOGIN });
    const post = calls.find((c) => c.init.method === "POST")!;
    expect(post.url).toBe("https://example.invalid/user/login");
    const body = new URLSearchParams(post.init.body as string);
    expect(body.get("form_build_id")).toBe("form-abc");
    expect(body.get("name")).toBe("student");
    expect(body.get("pass")).toBe("secret");
    expect(body.get("op")).toBe("Log in");
    const page = calls.find((c) => c.url === PAGE)!;
    expect((page.init.headers as Record<string, string>).Cookie).toBe("SESSabc=xyz");
  });

  it("fails when a form wall has no loginUrl", async () => {
    serve({});
    await expect(fetchPage({ url: PAGE, wall: "drupal" })).rejects.toThrow("a drupal wall needs a loginUrl");
  });

  it("unlocks a site held by the Password Protected plugin", async () => {
    serve({
      "https://example.invalid/?password-protected=login": () =>
        redirect(PAGE, "bid_1=hash; Path=/"),
    });
    await fetchPage({ url: PAGE, wall: "password-protected" });
    const post = calls.find((c) => c.init.method === "POST")!;
    const body = new URLSearchParams(post.init.body as string);
    expect(body.get("password_protected_pwd")).toBe("secret");
    expect(body.get("redirect_to")).toBe(PAGE);
  });

  it("names the wall when a login form posts somewhere other than wp-login.php", async () => {
    serve({
      "https://example.invalid/wp-login.php": () => redirect(PAGE),
      [PAGE]: () => new Response(themeLoginForm),
    });
    await expect(fetchPage({ url: PAGE, wall: "wordpress" })).rejects.toThrow("wordpress login did not open it");
  });

  it("names the wall when the site password did not open the page", async () => {
    serve({
      "https://example.invalid/?password-protected=login": () => redirect(PAGE),
      [PAGE]: () => new Response(siteWidePasswordForm),
    });
    await expect(fetchPage({ url: PAGE, wall: "password-protected" })).rejects.toThrow(
      "password-protected login did not open it",
    );
  });

  it("names the wall when the login did not open the page", async () => {
    serve({
      "https://example.invalid/wp-login.php": () => redirect(PAGE),
      [PAGE]: () => new Response(postPasswordForm),
    });
    await expect(fetchPage({ url: PAGE, wall: "wordpress" })).rejects.toThrow("wordpress login did not open it");
  });

  it("names the wall when the login answers with the login page again", async () => {
    serve({
      "https://example.invalid/wp-login.php": () => redirect(PAGE),
      [PAGE]: () => new Response(loginPageInFullSite),
    });
    await expect(fetchPage({ url: PAGE, wall: "wordpress" })).rejects.toThrow("wordpress login did not open it");
  });

  it("logs in once per site in a session", async () => {
    serve({ "https://example.invalid/wp-login.php": () => redirect(PAGE) });
    const session = new Session();
    await session.fetchPage({ url: PAGE, wall: "wordpress" });
    await session.fetchPage({ url: "https://example.invalid/os/other/", wall: "wordpress" });
    expect(calls.filter((c) => c.init.method === "POST")).toHaveLength(1);
  });
});
