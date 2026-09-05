import { describe, expect, it } from "vitest";
import { formatSummary, type RunSummary } from "./summary.ts";

const empty: RunSummary = { changed: [], added: [], removed: [], failed: [], withoutRule: [], warnings: [] };

describe("formatSummary", () => {
  it("reports a run in which nothing happened", () => {
    const text = formatSummary(empty);
    expect(text).toContain("- Changed (0): none");
    expect(text).toContain("- Failed (0): none");
  });

  it("lists the changed, added, and removed ids", () => {
    const text = formatSummary({ ...empty, changed: [1, 2], added: [3], removed: [4] });
    expect(text).toContain("- Changed (2): 1, 2");
    expect(text).toContain("- Added (1): 3");
    expect(text).toContain("- Removed (1): 4");
  });

  it("gives every failed listing its reason on its own line", () => {
    const failed = [
      { id: 785, reason: "host page fetch failed: status 401" },
      { id: 809, reason: "extraction failed: languages: too small" },
    ];
    const text = formatSummary({ ...empty, failed });
    expect(text).toContain("- Failed (2):");
    expect(text).toContain("  - 785: host page fetch failed: status 401");
    expect(text).toContain("  - 809: extraction failed: languages: too small");
  });

  it("names every listing without a schedule rule, so the owner sees them", () => {
    expect(formatSummary({ ...empty, withoutRule: [788, 890] })).toContain(
      "- Without a schedule rule (2): 788, 890",
    );
  });

  it("adds a warning line for a hand-kept id the API dropped", () => {
    const text = formatSummary({ ...empty, warnings: ["id 829 is on a hand-kept list but not in the API"] });
    expect(text).toContain("- Warning: id 829 is on a hand-kept list but not in the API");
  });
});
