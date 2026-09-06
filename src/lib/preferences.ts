// What the old student chose last time: the filters and the timezone. One
// key, one JSON object, read on mount and written on every change.
import { z } from "zod";
import { Medium } from "@/schema/listing";
import type { Filters } from "@/lib/filters";

export type Preferences = { zone: string; filters: Filters };

const KEY = "vipassana-sittings";

const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const Stored = z.object({
  zone: z.string().refine(isTimeZone),
  filters: z.object({
    durations: z.array(z.enum(["hour", "long", "day"])),
    languages: z.array(z.string()),
    medium: z.array(Medium),
    teacherLed: z.boolean().nullable(),
    questionsAndAnswers: z.boolean().nullable(),
  }),
});

export function readPreferences(storage: Storage): Preferences | null {
  try {
    const parsed = Stored.safeParse(JSON.parse(storage.getItem(KEY) ?? ""));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writePreferences(storage: Storage, prefs: Preferences) {
  storage.setItem(KEY, JSON.stringify(prefs));
}
