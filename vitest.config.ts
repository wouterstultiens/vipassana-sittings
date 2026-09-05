import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Two runtimes, one command. The site's logic and the pipeline are plain Node;
// the gate runs on workerd, where `crypto.subtle.timingSafeEqual` exists.
export default defineConfig({
  test: {
    projects: [
      {
        test: { name: "site", include: ["src/**/*.test.ts"] },
        resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
      },
      {
        test: { name: "pipeline", include: ["pipeline/**/*.test.ts"] },
      },
      {
        plugins: [cloudflareTest({ miniflare: { compatibilityDate: "2026-08-22" } })],
        test: { name: "gate", include: ["worker/**/*.test.ts"] },
      },
    ],
  },
});
