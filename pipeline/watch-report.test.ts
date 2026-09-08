import { describe, expect, it } from "vitest";
import { emptyReport, formatReport, type WatchReport, worthTelling } from "./watch-report.ts";

const report = (over: Partial<WatchReport> = {}): WatchReport => ({ ...emptyReport(), ...over });

describe("formatReport", () => {
  it("reports a run with no change", () => {
    const text = formatReport(report());
    expect(text).toContain("0 changed, 0 added, 0 removed, 0 failed");
    expect(text).not.toContain("Failed");
  });

  it("names every failed host with its reason", () => {
    expect(formatReport(report({ failed: [{ id: 42, reason: "status 404" }] }))).toContain("42: status 404");
  });

  it("names the changed, added and removed ids", () => {
    const text = formatReport(report({ changed: [1], added: [2], removed: [3] }));
    expect(text).toContain("1 changed, 1 added, 1 removed, 0 failed");
    expect(text).toMatch(/Changed.*1/s);
    expect(text).toMatch(/New in the API.*2/s);
    expect(text).toMatch(/Gone from the API.*3/s);
  });

  it("keeps the hosts marked in an earlier run apart", () => {
    const text = formatReport(report({ stillChanged: [7] }));
    expect(text).toContain("0 changed");
    expect(text).toMatch(/still not extracted.*7/s);
  });

  it("says what to do when a host needs an extraction", () => {
    expect(formatReport(report({ changed: [1] }))).toContain("pnpm settle");
  });

  it("carries the warnings for hand-kept ids", () => {
    expect(formatReport(report({ warnings: ["id 5 is on a hand-kept list"] }))).toContain("id 5 is on a hand-kept list");
  });
});

describe("worthTelling", () => {
  it("says nothing about a quiet run", () => {
    expect(worthTelling(report({ stillChanged: [7], removed: [3] }))).toBe(false);
  });

  it("tells about a changed, a new, or a failed host", () => {
    expect(worthTelling(report({ changed: [1] }))).toBe(true);
    expect(worthTelling(report({ added: [2] }))).toBe(true);
    expect(worthTelling(report({ failed: [{ id: 3, reason: "x" }] }))).toBe(true);
  });
});
