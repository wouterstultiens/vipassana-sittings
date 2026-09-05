import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// The gate runs on workerd, so its tests run there too: `crypto.subtle.timingSafeEqual`
// exists only in that runtime.
export default defineConfig({
  plugins: [cloudflareTest({ miniflare: { compatibilityDate: "2026-08-22" } })],
  test: { include: ["worker/**/*.test.ts"] },
});
