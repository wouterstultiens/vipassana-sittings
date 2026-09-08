import type { HostExtraction } from "../src/schema/host.ts";

type Rule = HostExtraction["rules"][number];

// One rule per weekday, so two rule sets that give the same sittings compare
// equal however the weekdays are grouped.
type DayRule = { weekday: string; key: string; rule: Rule };
const dayRules = (rules: Rule[]): DayRule[] =>
  rules.flatMap((rule) =>
    rule.weekdays.map((weekday) => {
      const one = { ...rule, weekdays: [weekday], weeksOfMonth: rule.weeksOfMonth && [...rule.weeksOfMonth].sort() };
      return { weekday, key: JSON.stringify(one), rule: one };
    }),
  );

// The leaf paths of a rule where two rules differ.
function ruleDiff(a: Rule, b: Rule, path = ""): string[] {
  const aObj = a as unknown as Record<string, unknown>;
  const bObj = b as unknown as Record<string, unknown>;
  return Object.keys(aObj).flatMap((key) => {
    const [x, y] = [aObj[key], bObj[key]];
    if (JSON.stringify(x) === JSON.stringify(y)) return [];
    const isObject = (v: unknown) => v !== null && typeof v === "object" && !Array.isArray(v);
    if (isObject(x) && isObject(y)) return ruleDiff(x as Rule, y as Rule, `${path}${key}.`);
    return [`${path}${key}: ${JSON.stringify(x)} -> ${JSON.stringify(y)}`];
  });
}

const summary = (r: Rule) => `${r.start} ${r.durationMinutes}min${r.weeksOfMonth ? ` weeks ${r.weeksOfMonth}` : ""}`;

// The fields that differ between a reference and an answer, one line each.
// Rules are compared as sets of weekday rules; a missing and an extra rule on
// the same weekday and start are shown as one line per differing field,
// merged across weekdays.
export function differences(reference: HostExtraction, answer: HostExtraction): string[] {
  const lines: string[] = [];
  for (const key of Object.keys(reference) as (keyof HostExtraction)[]) {
    if (key === "rules") continue;
    if (JSON.stringify(reference[key]) !== JSON.stringify(answer[key])) {
      lines.push(`${key}: ${JSON.stringify(reference[key])} -> ${JSON.stringify(answer[key])}`);
    }
  }
  const want = dayRules(reference.rules);
  const got = dayRules(answer.rules);
  const gotKeys = new Set(got.map((d) => d.key));
  const wantKeys = new Set(want.map((d) => d.key));
  const missing = want.filter((d) => !gotKeys.has(d.key));
  const extra = got.filter((d) => !wantKeys.has(d.key));
  const merged = new Map<string, string[]>();
  const note = (text: string, weekday: string) => merged.set(text, [...(merged.get(text) ?? []), weekday]);
  for (const m of missing) {
    const at = extra.findIndex((e) => e.weekday === m.weekday && e.rule.start === m.rule.start);
    if (at < 0) {
      note(`rule missing: ${summary(m.rule)}`, m.weekday);
      continue;
    }
    const [e] = extra.splice(at, 1);
    for (const line of ruleDiff(m.rule, e!.rule)) note(`rule ${m.rule.start} ${line}`, m.weekday);
  }
  for (const e of extra) note(`rule extra: ${summary(e.rule)}`, e.weekday);
  for (const [text, weekdays] of merged) lines.push(`${text} [${weekdays.join(",")}]`);
  return lines;
}
