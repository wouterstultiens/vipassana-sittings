// Turns listing data into the short strings the calendar shows.
import { TZDate } from "@date-fns/tz";
import type { Listing, ScheduleRule } from "@/schema/listing";
import { WEEKDAYS, type Sitting } from "@/lib/expand";

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

/** What a language tag says on hover: the name in the language itself, then in English, "Español (Spanish)". */
export function languageTitle(code: string): string {
  let native = code;
  try {
    native = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  } catch {
    // An unknown code keeps the code itself as its name.
  }
  return `${native.charAt(0).toUpperCase()}${native.slice(1)} (${languageName(code)})`;
}

/**
 * The flag that stands for a language on a row. Hand-kept: a flag names a
 * country, so this is the country an old student reads the language from, not
 * where the host is. English has no entry because English gets no tag.
 */
export const LANGUAGE_FLAG = {
  ar: "SA",
  bg: "BG",
  da: "DK",
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

/** The language menu order: the browser language first when the data has it, then by English name. */
export function sortLanguages(codes: string[], first: string): string[] {
  const rest = codes.filter((c) => c !== first).sort((a, b) => languageName(a).localeCompare(languageName(b)));
  return codes.includes(first) ? [first, ...rest] : rest;
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

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const format = (opts: Intl.DateTimeFormatOptions) => (d: Date, zone: string) =>
  new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: zone }).format(d);

export const fmtTime = format({ hour: "2-digit", minute: "2-digit" });
export const fmtWeekday = format({ weekday: "short" });
export const fmtDayOfMonth = format({ day: "numeric" });
export const fmtDayMonth = format({ day: "numeric", month: "short" });
export const fmtDayMonthYear = format({ day: "numeric", month: "short", year: "numeric" });

export function fmtDate(d: Date, zone: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }): string {
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: zone }).format(d);
}

const WEEKDAY_NAME: Record<ScheduleRule["weekdays"][number], string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};
const WEEK_NAME: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", [-1]: "last" };

const joinNames = (names: string[]) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

/**
 * How a schedule rule repeats, as the old student sees it: "every Tue and Thu
 * at 20:00". The weekdays shift with the clicked sitting when its day in the
 * old student's zone differs from its day in the host's zone.
 */
export function fmtRepeat(sitting: Sitting, zone: string): string {
  const { rule } = sitting;
  const shift = sitting.local.getDay() - new TZDate(sitting.start, rule.timeZone).getDay();
  const days = rule.weekdays.map((wd) => WEEKDAY_NAME[WEEKDAYS[(WEEKDAYS.indexOf(wd) + shift + 7) % 7]]);
  const weeks = rule.weeksOfMonth ? `${joinNames(rule.weeksOfMonth.map((w) => WEEK_NAME[w]))} ` : "";
  const when = days.length === 7 && !rule.weeksOfMonth ? "day" : `${weeks}${joinNames(days)}`;
  return `every ${when} at ${fmtTime(sitting.start, zone)}`;
}

export function zoneAbbr(d: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(d);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
}

/** Host name minus the internal sublocation noise, for display. */
export function displayHost(l: Listing): string {
  const n = l.host.name
    .replace(/^Virtual-(AV|Audio-Only|Stream|Only)-Sublocation-/i, "")
    // Every listing here is virtual, so the word carries no information.
    .replace(/^Virtual\s+/i, "")
    .replace(/_copy$/, "")
    .replace(/-[A-Za-z]+\/[A-Za-z_]+$/, "");
  return n.length > 40 ? countryName(l.country) : n;
}
