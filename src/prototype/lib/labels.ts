import type { Listing } from "../../schema/listing";

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
export const flag = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

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

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const RULE_DAY: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

export function ruleDays(rule: Listing["scheduleRules"][number]): string {
  const d = rule.weekdays;
  let days: string;
  if (d.length === 7) days = "Every day";
  else if (d.length === 5 && !d.includes("sat") && !d.includes("sun")) days = "Weekdays";
  else if (d.length === 2 && d.includes("sat") && d.includes("sun")) days = "Weekends";
  else days = d.map((x) => RULE_DAY[x]).join(", ");
  if (!rule.weeksOfMonth) return days;
  const nth = rule.weeksOfMonth.map((w) => (w === -1 ? "last" : ["1st", "2nd", "3rd", "4th", "5th"][w - 1])).join(" and ");
  return `${nth} ${days}`;
}

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function fmtTime(d: Date, zone: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: zone }).format(d);
}

export function fmtDate(d: Date, zone: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }): string {
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: zone }).format(d);
}

export function zoneAbbr(d: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(d);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
}

/** Host name minus the internal sublocation noise, for display. */
export function displayHost(l: Listing): string {
  const n = l.host.name
    .replace(/^Virtual-(AV|Audio-Only|Stream|Only)-Sublocation-/i, "")
    .replace(/_copy$/, "")
    .replace(/-[A-Za-z]+\/[A-Za-z_]+$/, "");
  return n.length > 40 ? countryName(l.country) : n;
}
