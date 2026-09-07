// Reads the host files at build time. The data repo is cloned into the
// gitignored data/ folder; nothing here is served as a separate file.
import excludedIds from "../../pipeline/excluded-ids.json" with { type: "json" };
import { Host } from "@/schema/host";

const excluded = new Set<number>(excludedIds);

/** Validates every host file, drops the excluded hosts, and sorts by name. */
export function parseHosts(files: Record<string, unknown>): Host[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const parsed = Host.safeParse(raw);
      if (!parsed.success) throw new Error(`${path} is not a valid host: ${parsed.error.message}`);
      return parsed.data;
    })
    .filter((h) => !excluded.has(h.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadHosts(): Host[] {
  return parseHosts(import.meta.glob("../../data/hosts/*.json", { eager: true, import: "default" }));
}
