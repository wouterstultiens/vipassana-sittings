import { gate, type GateSecrets } from "./gate.ts";

interface Env extends GateSecrets {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await gate(request, env, Date.now());
    return response ?? env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
