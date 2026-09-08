import { describe, expect, it } from "vitest";
import type { HostExtraction } from "../src/schema/host.ts";
import { differences } from "./compare.ts";

const join = { platform: "zoom" as const, url: null, meetingId: null, password: { kind: "none" as const }, dialIn: null };
const rule = (weekdays: HostExtraction["rules"][number]["weekdays"], start: string, more = {}) => ({
  weekdays,
  weeksOfMonth: null,
  start,
  durationMinutes: 60,
  label: null,
  join,
  ...more,
});
const host = (rules: HostExtraction["rules"]): HostExtraction => ({
  name: "X",
  timeZone: "Europe/Amsterdam",
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: false,
  pageUrl: null,
  rules,
});

describe("differences", () => {
  it("is empty when the same sittings are grouped differently", () => {
    const a = host([rule(["mon", "tue", "wed"], "07:00")]);
    const b = host([rule(["mon"], "07:00"), rule(["tue", "wed"], "07:00")]);
    expect(differences(a, b)).toEqual([]);
  });

  it("names a top-level field that moved", () => {
    expect(differences(host([]), { ...host([]), name: "Y" })).toEqual(['name: "X" -> "Y"']);
  });

  it("shows one line per differing field of a rule, merged across weekdays", () => {
    const a = host([rule(["mon", "tue"], "07:00")]);
    const b = host([rule(["mon", "tue"], "07:00", { durationMinutes: 90 })]);
    expect(differences(a, b)).toEqual(["rule 07:00 durationMinutes: 60 -> 90 [mon,tue]"]);
  });

  it("lists rules that are only on one side", () => {
    expect(differences(host([rule(["sat"], "09:00")]), host([rule(["sun"], "18:00")]))).toEqual([
      "rule missing: 09:00 60min [sat]",
      "rule extra: 18:00 60min [sun]",
    ]);
  });
});
