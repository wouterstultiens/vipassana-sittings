import { describe, expect, it } from "vitest";
import { emptySummary, formatSummary, type RunSummary } from "./summary.ts";

const summary = (over: Partial<RunSummary> = {}): RunSummary => ({ ...emptySummary(), ...over });

describe("formatSummary", () => {
  it("reports a run with no change", () => {
    const text = formatSummary(summary());
    expect(text).toContain("0 changed, 0 added, 0 removed, 0 failed");
    expect(text).not.toContain("Failed");
  });

  it("names every failed listing with its reason", () => {
    const text = formatSummary(summary({ failed: [{ id: 42, reason: "status 404" }] }));
    expect(text).toContain("42: status 404");
  });

  it("names the listings without a schedule rule", () => {
    expect(formatSummary(summary({ withoutRule: [788, 890] }))).toContain("788, 890");
  });

  it("names the changed, added and removed ids", () => {
    const text = formatSummary(summary({ changed: [1], added: [2], removed: [3] }));
    expect(text).toContain("1 changed, 1 added, 1 removed, 0 failed");
    expect(text).toMatch(/Changed.*1/s);
    expect(text).toMatch(/Added.*2/s);
    expect(text).toMatch(/Removed.*3/s);
  });

  it("carries the warnings for hand-kept ids", () => {
    expect(formatSummary(summary({ warnings: ["id 5 is on a hand-kept list"] }))).toContain(
      "id 5 is on a hand-kept list",
    );
  });
});
