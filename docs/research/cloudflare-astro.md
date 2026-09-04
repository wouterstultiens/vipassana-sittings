# Cloudflare hosting, the cookie gate, private data at build time, and Astro with shadcn

Research for issue #3 (part of map #1). Verified on 2026-09-04 against official docs. Each claim links to its source.

## Summary

- Cloudflare now says: "Start new projects with Workers." Pages is not deprecated, but it is the legacy path. The Astro Cloudflare adapter dropped Pages support in v13 (March 2026).
- **Recommendation**: host on **Cloudflare Workers with static assets**, not Pages. Keep Astro fully static (no adapter). Add one small hand-written Worker with `run_worker_first: true` that does the login, sets the signed cookie, checks it on every request, and then serves the static files through `env.ASSETS.fetch()`. This gives the same "gate before any page or data" the map wants, on the free tier, with fewer moving parts than the Pages path.
- Deploy hooks now exist for Workers Builds (April 2026), so the map's data flow (GitHub Actions commits data, then calls a deploy hook) still works unchanged.
- The Workers Builds image has `git` preinstalled. The Pages build image docs do not list `git` at all. Fetching the private data repo in the build is best done with the GitHub REST API (tarball or contents endpoint) and a fine-grained token with `Contents: read`, so the build does not depend on `git` or `curl`.
- shadcn supports Astro with React islands and Tailwind v4. The friction is normal Astro friction: interactive components need `client:*` directives, and `.astro` files cannot be used inside React components.

## 1. Pages versus Workers: what Cloudflare recommends now

The Pages docs landing page carries this banner:

> "Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. Start new projects with Workers."
> https://developers.cloudflare.com/pages/

Cloudflare keeps a migration guide with a compatibility matrix (last updated 2026-08-14). Things Workers still lacks compared to Pages: file-based routing in a `functions/` directory (needs a framework adapter or `wrangler pages functions build`), Pages Plugins, custom domains outside a Cloudflare zone, and only partial parity for branch deploy controls. Workers has more: Workers Logs, Cron Triggers, Durable Objects, source maps.
https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/

Astro's own deploy guide lists "Cloudflare Workers (Recommended)" and "Cloudflare Pages (Legacy)" and says: "Cloudflare recommends using Cloudflare Workers for new projects."
https://docs.astro.build/en/guides/deploy/cloudflare/

The `@astrojs/cloudflare` adapter v13.0.0 "Drops official support for Cloudflare Pages in favor of Cloudflare Workers". v13 requires Astro 6 (released 2026-03-10). Current adapter is v14.x.
https://github.com/withastro/astro/releases/tag/%40astrojs%2Fcloudflare%4013.0.0
https://docs.astro.build/en/guides/integrations-guide/cloudflare/
https://astro.build/blog/astro-6/

**Conclusion**: this does change the map's hosting decision. "Cloudflare Pages, free tier" should become "Cloudflare Workers with static assets, free tier". Everything else in the map holds.

## 2. Gate: which layout can check a signed cookie on every request, including static files and data files

### Option A: Astro static output plus a Pages `functions/` directory (the map's current plan)

- A `functions/_middleware.js` at the root of the `functions/` directory runs on every route. The docs say: to apply middleware across your entire application, including static files, "create a `functions/_middleware.js` file." The middleware calls `context.next()` to pass through to "the next Function or to the asset server if no other Function is available".
  https://developers.cloudflare.com/pages/functions/middleware/
  https://developers.cloudflare.com/pages/functions/api-reference/
- Routing: once a project has Functions, all requests invoke them unless `_routes.json` excludes paths. "If no Function is matched, it will fall back to a static asset if there is one."
  https://developers.cloudflare.com/pages/functions/routing/
- The `functions/` directory must sit at the project root, next to (not inside) the build output such as `dist`.
  https://developers.cloudflare.com/pages/functions/get-started/

So this layout does work. But it is the legacy platform, and the Astro adapter no longer targets it.

### Option B: Astro with the Cloudflare adapter (server output)

- The adapter serves static assets first: "Routing for static assets is based on the file structure in the build directory (e.g. `./dist`). If no match is found, this will fall back to the Worker for on-demand rendering."
  https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Astro middleware runs "at build time for all prerendered pages" and only at request time "for pages rendered on demand". It never sees requests for files in `public/` or for prerendered HTML served as assets.
  https://docs.astro.build/en/guides/middleware/

So an Astro middleware alone cannot gate static files or data JSON. You would have to make every page on-demand, or set `run_worker_first` and route the check outside Astro. This is more machinery than the site needs.

### Option C (recommended): static Astro plus one hand-written Worker with `run_worker_first: true`

- By default Workers serve a matching static asset before the Worker runs. Set `run_worker_first: true` to "unconditionally invoke your Worker script" for every request, including assets. The Worker then serves files with `env.ASSETS.fetch(request)`. The docs name "perform some authentication checks" as a use case.
  https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
  https://developers.cloudflare.com/workers/static-assets/binding/
- Astro stays static. The deploy guide's static config is only `"assets": { "directory": "./dist" }`; add `"binding": "ASSETS"`, `"run_worker_first": true`, and `"main": "src/worker.ts"`.
  https://docs.astro.build/en/guides/deploy/cloudflare/
- Cost note: "Requests to static assets are free and unlimited." With `run_worker_first`, every request counts as a Worker request against the free 100,000 per day, and requests above the limit get a 429 instead of falling back to assets.
  https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/

Sketch of `wrangler.jsonc`:

```jsonc
{
  "name": "vipassana-sittings",
  "main": "src/worker.ts",
  "compatibility_date": "2026-09-01",
  "assets": { "directory": "./dist", "binding": "ASSETS", "run_worker_first": true }
}
```

## 3. Signed cookie with Web Crypto only

Both Pages Functions and Workers run the same runtime. `crypto.subtle` supports HMAC `importKey`, `sign`, and `verify`; Cloudflare adds the non-standard `crypto.subtle.timingSafeEqual(a, b)`.
https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey

Secrets (login, cookie key) go in Worker secrets, set with `wrangler secret put` or the dashboard, and read as `env.NAME`. Local dev uses a `.dev.vars` file. Secrets never go in `wrangler.jsonc`.
https://developers.cloudflare.com/workers/configuration/secrets/

Simplest scheme, one file, no dependencies:

```ts
// src/worker.ts
const COOKIE = "session";
const TTL = 60 * 60 * 24 * 30; // 30 days

async function key(env: Env) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(env.COOKIE_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sign(env: Env, payload: string) {
  const sig = await crypto.subtle.sign("HMAC", await key(env), new TextEncoder().encode(payload));
  return `${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

async function valid(env: Env, cookie: string | null) {
  if (!cookie) return false;
  const i = cookie.lastIndexOf(".");
  if (i < 0) return false;
  const payload = cookie.slice(0, i);            // payload = expiry timestamp
  const sig = Uint8Array.from(atob(cookie.slice(i + 1)), (c) => c.charCodeAt(0));
  if (Number(payload) < Date.now() / 1000) return false;
  return crypto.subtle.verify("HMAC", await key(env), sig, new TextEncoder().encode(payload));
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/login" && request.method === "POST") {
      const form = await request.formData();
      if (form.get("user") !== env.LOGIN_USER || form.get("pass") !== env.LOGIN_PASS) {
        return Response.redirect(`${url.origin}/login?failed=1`, 303);
      }
      const value = await sign(env, String(Math.floor(Date.now() / 1000) + TTL));
      return new Response(null, { status: 303, headers: {
        Location: "/",
        "Set-Cookie": `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL}`,
      }});
    }
    const cookie = request.headers.get("Cookie")?.match(new RegExp(`${COOKIE}=([^;]+)`))?.[1] ?? null;
    if (url.pathname !== "/login" && !(await valid(env, cookie))) {
      return Response.redirect(`${url.origin}/login`, 303);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

The login page itself is a static Astro page at `/login` with a plain `<form method="post">`. Nothing else on the site needs server rendering. Compare the password with `timingSafeEqual` on equal-length buffers if you want to remove the timing side channel; for a shared old-student password this is optional.

## 4. Pulling the private data repo during the build

### Which build service, and does it have `git`

- **Workers Builds** image: preinstalled apt packages include `git` and `git-lfs`. Default Node 24.18.0; Node 22.23.2 also installed; pin with `NODE_VERSION` or `.nvmrc`.
  https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- **Pages** build image v3: the docs list languages and tools (Node 22.16.0, npm 10.9.2, pnpm 10.11.1) but never mention `git`. Pages does clone your repo, so `git` exists in practice, but it is undocumented. Community threads show private submodule clones failing on Pages with "could not read Username".
  https://developers.cloudflare.com/pages/configuration/build-image/
  https://community.cloudflare.com/t/pages-build-error-failed-error-occurred-while-updating-repo-submodules/356890
- Both services only clone the connected repository. "Both private and public repositories are supported" for the connected repo. A second repo needs its own credential.
  https://developers.cloudflare.com/pages/get-started/git-integration/
  https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/

### Token and method

- Fine-grained personal access token scoped to the data repo only, permission **Contents: read**. This one permission covers both `GET /repos/{owner}/{repo}/contents/{path}` and `GET /repos/{owner}/{repo}/tarball/{ref}`.
  https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens
- Contents endpoint: files up to 1 MB work fully; 1 to 100 MB need the `application/vnd.github.raw+json` media type; over 100 MB is unsupported. The tarball endpoint returns a 302 to a temporary link that "expire[s] after five minutes" for private repos.
  https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
- Store the token as a **build** variable or secret in Workers Builds: "Add environment variables and secrets accessible only to your build. Build variables will not be accessible at runtime."
  https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

**Recommendation**: a small Node script in the build command (`node scripts/fetch-data.mjs && astro build`) that calls the contents endpoint with `fetch()` and writes the JSON into `src/data/`. This avoids `git` and `curl` entirely, works in any build image, and the fetched files stay out of git because `src/data/` is gitignored. The data set is 50 listings, far below 1 MB.

Simpler alternative worth a decision: skip Cloudflare builds. The daily GitHub Actions job already holds the fresh data. It can run `astro build` and `wrangler deploy` itself with `cloudflare/wrangler-action` and an API token with the **Edit Cloudflare Workers** template. That removes the deploy hook, the Cloudflare build, and the GitHub token stored in Cloudflare. The cost is a Cloudflare API token in GitHub secrets and one workflow that also runs on push to `main`.
https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
https://github.com/cloudflare/wrangler-action

## 5. Deploy hooks from GitHub Actions

- **Pages**: Settings > Builds > Add deploy hook; POST to the URL triggers a fresh build of the chosen branch. No authentication beyond the URL: "Deploy Hooks are uniquely linked to your project and do not require additional authentication."
  https://developers.cloudflare.com/pages/configuration/deploy-hooks/
- **Workers Builds**: deploy hooks shipped 2026-04-01. Settings > Builds > Deploy Hooks. `curl -X POST "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>"`. No `Authorization` header. Rate limit 10 builds per minute per Worker. Duplicate triggers before the first build starts are merged.
  https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/
  https://developers.cloudflare.com/changelog/post/2026-04-01-deploy-hooks/

GitHub Actions step:

```yaml
- name: Trigger Cloudflare rebuild
  run: curl -fsS -X POST "${{ secrets.CF_DEPLOY_HOOK_URL }}"
```

Keep the hook URL in a GitHub secret; it is a credential.

## 6. Free tier limits that matter

| Limit | Workers (free) | Pages (free) |
| --- | --- | --- |
| Worker / Function requests | 100,000 per day, reset at 00:00 UTC | 100,000 per day, shared with Workers |
| Static asset requests | free and unlimited (only when the Worker does not run first) | included |
| CPU per request | 10 ms | 10 ms (Workers limits apply) |
| Script size, compressed | 3 MB | 3 MB (Workers limits apply) |
| Static files | 20,000 per version, 25 MiB each | 20,000 per site, 25 MiB each |
| Builds | 3,000 build minutes per month, 1 concurrent, 20 min timeout | 500 builds per month, 1 concurrent, 20 min timeout |
| Deploy hook rate | 10 per minute per Worker | not stated |

Sources:
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
https://developers.cloudflare.com/pages/platform/limits/
https://developers.cloudflare.com/pages/functions/pricing/

One daily rebuild plus code pushes is far under both build limits. With `run_worker_first`, each page view costs a few Worker requests (HTML, CSS, JS, data JSON). 100,000 per day covers thousands of visits per day.

## 7. shadcn with Astro

Official install path (https://ui.shadcn.com/docs/installation/astro):

```bash
pnpm create astro@latest astro-app -- --template with-tailwindcss --install --add react --git
# add to tsconfig.json compilerOptions: "baseUrl": ".", "paths": { "@/*": ["./src/*"] }
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button
```

Facts:

- Tailwind: Astro 5.2+ and 6 use the `@tailwindcss/vite` plugin and Tailwind v4 (`@import "tailwindcss";` in a global CSS file). `@astrojs/tailwind` is the legacy Tailwind 3 path.
  https://docs.astro.build/en/guides/styling/
- shadcn CLI initialises with Tailwind v4 and React 19 by default; components dropped `forwardRef`.
  https://ui.shadcn.com/docs/tailwind-v4
- React island: `npx astro add react` (integration v6.x). Add `"jsx": "react-jsx"` and `"jsxImportSource": "react"` to tsconfig.
  https://docs.astro.build/en/guides/integrations-guide/react/
- Hydration rules: "By default, your framework components will only render on the server, as static HTML." Interactive shadcn parts (Dialog, DropdownMenu, Select, Sheet, the week grid with filters) need `client:load`, `client:idle`, or `client:visible`. Astro components cannot be imported into `.tsx` files, and only `.astro` files can mix frameworks.
  https://docs.astro.build/en/guides/framework-components/
- Children passed from `.astro` into a React component arrive as strings unless `experimentalReactChildren: true` is set on the React integration. Keep Radix compound components (Dialog + DialogTrigger + DialogContent) inside one `.tsx` island rather than composing them in `.astro`.
  https://docs.astro.build/en/guides/integrations-guide/react/
  https://www.answeroverflow.com/m/1151177392992309329
- Dark mode needs an `is:inline` script that sets the `dark` class before hydration, plus a `<ModeToggle client:load />` island.
  https://ui.shadcn.com/docs/dark-mode/astro

Practical shape for this site: one React island (`<SittingsCalendar client:load data={...} />`) that owns the week grid, filters, and detail panel, built from shadcn primitives. The login page and layout stay `.astro`.

## Contradictions with the map's standing decisions

1. **Hosting: "Cloudflare Pages, free tier."** Cloudflare says to start new projects on Workers; Astro's adapter dropped Pages. Change to Workers with static assets, free tier.
2. **Gate: "checked by a Cloudflare Pages Function."** Becomes: checked by the Worker's `fetch` handler with `run_worker_first: true`. Same behaviour, same Web Crypto code.
3. **Data flow: "calls a Cloudflare deploy hook."** Still valid; Workers Builds has deploy hooks since April 2026. Optional simplification: let the GitHub Actions job deploy with `wrangler-action` and drop the hook.

No other standing decision is affected.
