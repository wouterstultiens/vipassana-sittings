import type { Listing } from "../../schema/listing";
import type { Sitting } from "./expand";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type DurationBand = "hour" | "long" | "day";

export type Filters = {
  weekdays: number[]; // 0 = Sunday, in visitor zone
  timesOfDay: TimeOfDay[];
  durations: DurationBand[];
  languages: string[];
  medium: Listing["medium"][];
  teacherLed: boolean | null;
  questionsAndAnswers: boolean | null;
  platforms: Listing["platform"][];
};

export const EMPTY_FILTERS: Filters = {
  weekdays: [],
  timesOfDay: [],
  durations: [],
  languages: [],
  medium: [],
  teacherLed: null,
  questionsAndAnswers: null,
  platforms: [],
};

export function timeOfDay(minutes: number): TimeOfDay {
  if (minutes < 6 * 60) return "night";
  if (minutes < 12 * 60) return "morning";
  if (minutes < 18 * 60) return "afternoon";
  return "evening";
}

export function durationBand(minutes: number): DurationBand {
  if (minutes <= 90) return "hour";
  if (minutes <= 240) return "long";
  return "day";
}

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: "Morning 06-12",
  afternoon: "Afternoon 12-18",
  evening: "Evening 18-24",
  night: "Night 00-06",
};

export const DURATION_LABEL: Record<DurationBand, string> = {
  hour: "About an hour",
  long: "2 to 4 hours",
  day: "Half or full day",
};

export function listingMatches(l: Listing, f: Filters): boolean {
  if (f.languages.length && !l.languages.some((x) => f.languages.includes(x))) return false;
  if (f.medium.length && !f.medium.includes(l.medium)) return false;
  if (f.platforms.length && !f.platforms.includes(l.platform)) return false;
  if (f.teacherLed !== null && l.teacherLed !== f.teacherLed) return false;
  if (f.questionsAndAnswers !== null && l.questionsAndAnswers !== f.questionsAndAnswers) return false;
  return true;
}

export function sittingMatches(s: Sitting, f: Filters): boolean {
  if (!listingMatches(s.listing, f)) return false;
  if (f.weekdays.length && !f.weekdays.includes(s.local.getDay())) return false;
  if (f.timesOfDay.length && !f.timesOfDay.includes(timeOfDay(s.minutesFromMidnight))) return false;
  if (f.durations.length && !f.durations.includes(durationBand(s.rule.durationMinutes))) return false;
  return true;
}

export function activeCount(f: Filters): number {
  return (
    f.weekdays.length +
    f.timesOfDay.length +
    f.durations.length +
    f.languages.length +
    f.medium.length +
    f.platforms.length +
    (f.teacherLed === null ? 0 : 1) +
    (f.questionsAndAnswers === null ? 0 : 1)
  );
}

export function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
