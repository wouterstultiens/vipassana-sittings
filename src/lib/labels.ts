// Turns listing data into the short strings the calendar shows.
import { TZDate } from "@date-fns/tz";
import type { Listing, ScheduleRule } from "@/schema/listing";

const lang = new Intl.DisplayNames(["en"], { type: "language" });
const region = new Intl.DisplayNames(["en"], { type: "region" });

export const languageName = (code: string) => {
  try {
    return lang.of(code) ?? code;
  } catch {
    return code;
  }
};
export const countryName = (code: string) => {
  try {
    return region.of(code) ?? code;
  } catch {
    return code;
  }
};

const titles = new Map<string, string>();

/** What a language tag says on hover: the name in the language itself, then in English, "Español (Spanish)". */
export function languageTitle(code: string): string {
  let title = titles.get(code);
  if (title === undefined) titles.set(code, (title = languageTitleOf(code)));
  return title;
}

function languageTitleOf(code: string): string {
  let native = code;
  try {
    native = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  } catch {
    // An unknown code keeps the code itself as its name.
  }
  native = `${native.charAt(0).toUpperCase()}${native.slice(1)}`;
  const english = languageName(code);
  return native === english ? english : `${native} (${english})`;
}

/**
 * The flag that stands for a language on a row. Hand-kept: a flag names a
 * country, so this is the country an old student reads the language from, not
 * where the host is.
 */
export const LANGUAGE_FLAG = {
  ar: "SA",
  bg: "BG",
  da: "DK",
  en: "GB",
  es: "ES",
  fa: "IR",
  fi: "FI",
  fr: "FR",
  he: "IL",
  hi: "IN",
  hu: "HU",
  it: "IT",
  ja: "JP",
  kn: "IN",
  ko: "KR",
  my: "MM",
  nl: "NL",
  no: "NO",
  pt: "BR",
  ru: "RU",
  sv: "SE",
  te: "IN",
  th: "TH",
  zh: "CN",
} as const satisfies Record<string, string>;

export type LanguageFlag = (typeof LANGUAGE_FLAG)[keyof typeof LANGUAGE_FLAG];

export const languageFlag = (code: string): LanguageFlag | null =>
  (LANGUAGE_FLAG as Record<string, LanguageFlag | undefined>)[code] ?? null;

/** The language menu order: by English name. */
export function sortLanguages(codes: string[]): string[] {
  return [...codes].sort((a, b) => languageName(a).localeCompare(languageName(b)));
}

export const PLATFORM_LABEL: Record<Listing["platform"], string> = {
  zoom: "Zoom",
  teams: "Teams",
  freeconferencecall: "FreeConferenceCall",
  whatsapp: "WhatsApp",
  "google-meet": "Google Meet",
  youtube: "YouTube",
  clubhouse: "Clubhouse",
  webex: "Webex",
  website: "Host website",
  unknown: "Unknown platform",
};

export const MEDIUM_LABEL: Record<Listing["medium"], string> = {
  video: "Video",
  audio: "Audio only",
  stream: "Live stream",
};

const WEEKDAY_NAME: Record<ScheduleRule["weekdays"][number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const ordinal = (week: number) => (week === -1 ? "last" : ["1st", "2nd", "3rd", "4th", "5th"][week - 1]);

/** How a rule repeats on one weekday: "Every Monday", "Every 1st and 3rd Monday", "Every last Monday". */
export function fmtRepeat(rule: ScheduleRule, weekday: ScheduleRule["weekdays"][number]): string {
  const day = WEEKDAY_NAME[weekday];
  if (!rule.weeksOfMonth) return `Every ${day}`;
  const weeks = rule.weeksOfMonth.map(ordinal);
  const list = weeks.length > 1 ? `${weeks.slice(0, -1).join(", ")} and ${weeks.at(-1)}` : weeks[0];
  return `Every ${list} ${day}`;
}

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Building an Intl.DateTimeFormat costs far more than formatting with it, and
// the calendar formats hundreds of dates per render, so each formatter is
// built once per zone.
const format = (opts: Intl.DateTimeFormatOptions) => {
  const byZone = new Map<string, Intl.DateTimeFormat>();
  return (d: Date, zone: string) => {
    let f = byZone.get(zone);
    if (!f) byZone.set(zone, (f = new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: zone })));
    return f.format(d);
  };
};

export const fmtTime = format({ hour: "2-digit", minute: "2-digit" });
/** The hour of the day, 0 to 23, in the old student's zone. */
export const hourIn = (d: Date, zone: string) => new TZDate(d, zone).getHours();
export const fmtWeekday = format({ weekday: "short" });
export const fmtDayOfMonth = format({ day: "numeric" });
export const fmtDayMonth = format({ day: "numeric", month: "short" });
export const fmtDayMonthYear = format({ day: "numeric", month: "short", year: "numeric" });

export function fmtDate(d: Date, zone: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }): string {
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: zone }).format(d);
}

export function zoneAbbr(d: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(d);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
}

/** A slot length as a short tag: "30 min", "1½ h", "3 h". Lengths are already rounded to the half hour. */
export function fmtLength(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return min % 60 ? `${h}½ h` : `${h} h`;
}
