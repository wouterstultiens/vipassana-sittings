// What the old student chose last time: the filters and the timezone. One
// key, one JSON object, read on mount and written on every change.
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

const Preferences = z.object({ zone: z.string().refine(isTimeZone), filters: Filters });
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
