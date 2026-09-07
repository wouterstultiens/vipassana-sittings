// What the old student chose last time: the filters, the timezone, and the
// clock, where null means "follow the device", and whether they have ever
// opened the filters. One key, one JSON object, read on mount and written on
// every change.
import { z } from "zod";
import { Filters } from "@/lib/filters";

const KEY = "vipassana-sittings";

const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const Preferences = z.object({
  zone: z.string().refine(isTimeZone).nullable(),
  clock: z.enum(["24h", "12h"]).nullable(),
  filters: Filters,
  noticedFilters: z.boolean(),
});
export type Preferences = z.infer<typeof Preferences>;

export function readPreferences(storage: Storage): Preferences | null {
  try {
    const parsed = Preferences.safeParse(JSON.parse(storage.getItem(KEY) ?? ""));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writePreferences(storage: Storage, prefs: Preferences) {
  storage.setItem(KEY, JSON.stringify(prefs));
}
