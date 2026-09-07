import { describe, expect, it } from "vitest";
import { WEEKS_AHEAD } from "@/lib/expand";
import { FIRST_PAGE, turnDay } from "@/lib/page";

describe("turnDay", () => {
  it("moves within the week", () => {
    expect(turnDay({ weeks: 1, day: 2 }, 1)).toEqual({ weeks: 1, day: 3 });
    expect(turnDay({ weeks: 1, day: 2 }, -1)).toEqual({ weeks: 1, day: 1 });
  });

  it("crosses into the next and previous week", () => {
    expect(turnDay({ weeks: 0, day: 6 }, 1)).toEqual({ weeks: 1, day: 0 });
    expect(turnDay({ weeks: 1, day: 0 }, -1)).toEqual({ weeks: 0, day: 6 });
  });

  it("stays put at the ends of the range", () => {
    expect(turnDay(FIRST_PAGE, -1)).toBe(FIRST_PAGE);
    const last = { weeks: WEEKS_AHEAD, day: 6 };
    expect(turnDay(last, 1)).toBe(last);
  });
});
