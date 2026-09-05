import { describe, expect, it } from "vitest";
import { durationTag, ruleDays } from "@/lib/labels";

describe("durationTag", () => {
  it("says nothing for an entry of 90 minutes or less", () => {
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

describe("ruleDays", () => {
  const rule = (weekdays: string[], weeksOfMonth: number[] | null = null) =>
    ({ weekdays, weeksOfMonth }) as never;

  it("names the whole week, the working week and the weekend", () => {
    expect(ruleDays(rule(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))).toBe("Every day");
    expect(ruleDays(rule(["mon", "tue", "wed", "thu", "fri"]))).toBe("Weekdays");
    expect(ruleDays(rule(["sat", "sun"]))).toBe("Weekends");
  });

  it("prefixes the weeks of the month", () => {
    expect(ruleDays(rule(["mon"], [1, 3]))).toBe("1st and 3rd Mon");
    expect(ruleDays(rule(["sun"], [-1]))).toBe("last Sun");
  });
});
