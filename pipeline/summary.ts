// The run summary: what the owner reads instead of the logs.
export type Failure = { id: number; reason: string };

export type RunSummary = {
  changed: number[];
  added: number[];
  removed: number[];
  failed: Failure[];
  withoutRule: number[];
  warnings: string[];
};

const ids = (list: number[]) => (list.length === 0 ? "none" : list.join(", "));

export function formatSummary(s: RunSummary): string {
  const lines = [
    "## Refresh run",
    "",
    `- Changed (${s.changed.length}): ${ids(s.changed)}`,
    `- Added (${s.added.length}): ${ids(s.added)}`,
    `- Removed (${s.removed.length}): ${ids(s.removed)}`,
    `- Failed (${s.failed.length}): ${s.failed.length === 0 ? "none" : ""}`,
  ];
  for (const f of s.failed) lines.push(`  - ${f.id}: ${f.reason}`);
  lines.push(`- Without a schedule rule (${s.withoutRule.length}): ${ids(s.withoutRule)}`);
  for (const w of s.warnings) lines.push(`- Warning: ${w}`);
  return lines.join("\n");
}
