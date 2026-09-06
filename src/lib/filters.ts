// The filter state of the toolbar and the two questions it answers: does this
// listing pass, and does this sitting pass. The calendar itself answers "which
// weekday" and "which hour", so no filter repeats that.
import { z } from "zod";
import { Medium, type Listing } from "@/schema/listing";
import type { Sitting } from "@/lib/expand";
import { languageName, MEDIUM_LABEL } from "@/lib/labels";

export const DurationBand = z.enum(["hour", "long", "day"]);
export type DurationBand = z.infer<typeof DurationBand>;

// A schema, not only a type, because the filters come back from local storage.
export const Filters = z.object({
  durations: z.array(DurationBand),
  languages: z.array(z.string()),
  medium: z.array(Medium),
  teacherLed: z.boolean().nullable(),
  questionsAndAnswers: z.boolean().nullable(),
});
export type Filters = z.infer<typeof Filters>;

/** How the toolbar and the sheets change the filters. */
export type SetFilters = (update: (f: Filters) => Filters) => void;

export const EMPTY_FILTERS: Filters = {
  durations: [],
  languages: [],
  medium: [],
  teacherLed: null,
  questionsAndAnswers: null,
};

export function durationBand(minutes: number): DurationBand {
  if (minutes <= 90) return "hour";
  if (minutes <= 240) return "long";
  return "day";
}

export const DURATION_LABEL: Record<DurationBand, string> = {
  hour: "About an hour",
  long: "2 to 4 hours",
  day: "Half or full day",
};

/** The filters a listing can answer on its own. */
export function listingMatches(listing: Listing, f: Filters): boolean {
  if (f.languages.length && !listing.languages.some((c) => f.languages.includes(c))) return false;
  if (f.medium.length && !f.medium.includes(listing.medium)) return false;
  if (f.teacherLed !== null && listing.teacherLed !== f.teacherLed) return false;
  if (f.questionsAndAnswers !== null && listing.questionsAndAnswers !== f.questionsAndAnswers) return false;
  return true;
}

export function sittingMatches(s: Sitting, f: Filters): boolean {
  if (!listingMatches(s.listing, f)) return false;
  if (f.durations.length && !f.durations.includes(durationBand(s.rule.durationMinutes))) return false;
  return true;
}

/** How many options are chosen, so the Clear button knows when to appear. */
export function activeCount(f: Filters): number {
  return (
    f.durations.length +
    f.languages.length +
    f.medium.length +
    (f.teacherLed === null ? 0 : 1) +
    (f.questionsAndAnswers === null ? 0 : 1)
  );
}

export function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** One chosen option, able to remove itself, in the order of the toolbar. */
export type AppliedFilter = { label: string; remove: (f: Filters) => Filters };

export function appliedFilters(f: Filters): AppliedFilter[] {
  return [
    ...f.durations.map((d) => ({ label: DURATION_LABEL[d], remove: (p: Filters) => ({ ...p, durations: toggle(p.durations, d) }) })),
    ...f.languages.map((c) => ({ label: languageName(c), remove: (p: Filters) => ({ ...p, languages: toggle(p.languages, c) }) })),
    ...f.medium.map((m) => ({ label: MEDIUM_LABEL[m], remove: (p: Filters) => ({ ...p, medium: toggle(p.medium, m) }) })),
    ...(f.teacherLed === null ? [] : [{ label: "Teacher led", remove: (p: Filters) => ({ ...p, teacherLed: null }) }]),
    ...(f.questionsAndAnswers === null ? [] : [{ label: "With Q&A", remove: (p: Filters) => ({ ...p, questionsAndAnswers: null }) }]),
  ];
}
