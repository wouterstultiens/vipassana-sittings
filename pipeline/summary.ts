export type Failure = { id: number; reason: string };

// What one refresh did, in the shape the run summary prints.
export type RunSummary = {
  changed: number[];
  added: number[];
  removed: number[];
  failed: Failure[];
  withoutRule: number[];
  warnings: string[];
};

export const emptySummary = (): RunSummary => ({
  changed: [],
  added: [],
  removed: [],
  failed: [],
  withoutRule: [],
  warnings: [],
});

const section = (title: string, lines: string[]) =>
  lines.length === 0 ? [] : [`### ${title}`, ...lines, ""];

// Ids read best in order, whatever order the run collected them in.
const ids = (title: string, list: number[]) =>
  section(title, list.length === 0 ? [] : [[...list].sort((a, b) => a - b).join(", ")]);

// Markdown, so the same text reads well on stdout and in GITHUB_STEP_SUMMARY.
export function formatSummary(summary: RunSummary): string {
  const { changed, added, removed, failed, withoutRule, warnings } = summary;
  const lines = [
    "## Refresh run",
    "",
    `${changed.length} changed, ${added.length} added, ${removed.length} removed, ${failed.length} failed`,
    "",
    ...ids("Changed", changed),
    ...ids("Added", added),
    ...ids("Removed", removed),
    ...section(
      "Failed",
      failed.map((f) => `- ${f.id}: ${f.reason}`),
    ),
    ...ids("Without a schedule rule", withoutRule),
    ...section(
      "Warnings",
      warnings.map((w) => `- ${w}`),
    ),
  ];
  return lines.join("\n").trimEnd() + "\n";
}
