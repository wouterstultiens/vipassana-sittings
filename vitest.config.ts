import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        // The gate runs on workerd, so its tests run there too:
        // `crypto.subtle.timingSafeEqual` exists only in that runtime.
        plugins: [cloudflareTest({ miniflare: { compatibilityDate: "2026-08-22" } })],
        test: { name: "worker", include: ["worker/**/*.test.ts"] },
      },
      {
        // The pipeline runs on Node, and none of its tests call the LLM.
        test: { name: "pipeline", include: ["pipeline/**/*.test.ts"], environment: "node" },
      },
    ],
  },
});
