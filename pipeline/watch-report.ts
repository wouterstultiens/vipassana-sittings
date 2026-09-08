export type Failure = { id: number; reason: string };

// What one source watch found. `changed` are the hosts whose sources moved
// this run, `stillChanged` the ones marked in an earlier run and not yet
// extracted again. Both need the same hand work; only `changed` is news.
export type WatchReport = {
  changed: number[];
  stillChanged: number[];
  added: number[];
  removed: number[];
  failed: Failure[];
  warnings: string[];
};

export const emptyReport = (): WatchReport => ({
  changed: [],
  stillChanged: [],
  added: [],
  removed: [],
  failed: [],
  warnings: [],
});

// True when the owner must be told: a host needs an extraction by hand.
export const worthTelling = (report: WatchReport): boolean =>
  report.changed.length > 0 || report.added.length > 0 || report.failed.length > 0;

const section = (title: string, lines: string[]) => (lines.length === 0 ? [] : [`### ${title}`, ...lines, ""]);

// Ids read best in order, whatever order the run collected them in.
const ids = (title: string, list: number[]) =>
  section(title, list.length === 0 ? [] : [[...list].sort((a, b) => a - b).join(", ")]);

// Markdown, so the same text reads well on stdout, in GITHUB_STEP_SUMMARY,
// and in the issue the workflow opens.
export function formatReport(report: WatchReport): string {
  const { changed, stillChanged, added, removed, failed, warnings } = report;
  const lines = [
    "## Sources watch",
    "",
    `${changed.length} changed, ${added.length} added, ${removed.length} removed, ${failed.length} failed`,
    "",
    ...ids("Changed", changed),
    ...ids("Changed in an earlier run, still not extracted", stillChanged),
    ...ids("New in the API, no file yet", added),
    ...ids("Gone from the API, file deleted", removed),
    ...section(
      "Failed",
      failed.map((f) => `- ${f.id}: ${f.reason}`),
    ),
    ...section(
      "Warnings",
      warnings.map((w) => `- ${w}`),
    ),
  ];
  if (changed.length > 0 || added.length > 0) {
    lines.push(
      "The site sends the old student to the host page on every sitting of a changed host.",
      "To settle a host: `pnpm collect`, write its file from `data/sources/`, then `pnpm settle <id>`.",
      "",
    );
  }
  return lines.join("\n").trimEnd() + "\n";
}
