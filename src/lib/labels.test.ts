import { describe, expect, it } from "vitest";
import { durationTag } from "@/lib/labels";

describe("durationTag", () => {
  it("says nothing for a sitting of 90 minutes or less", () => {
    expect(durationTag(60)).toBeNull();
    expect(durationTag(90)).toBeNull();
  });

  it("writes a half hour as a fraction", () => {
    expect(durationTag(210)).toBe("3½ h");
    expect(durationTag(105)).toBe("1¾ h");
    expect(durationTag(240)).toBe("4 h");
  });

  it("falls back to hours and minutes for an odd length", () => {
    expect(durationTag(100)).toBe("1 h 40 min");
  });
});

