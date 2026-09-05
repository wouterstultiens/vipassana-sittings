// Turns listing data into the short strings the calendar shows.
import type { Listing } from "@/schema/listing";

const lang = new Intl.DisplayNames(["en"], { type: "language" });
const region = new Intl.DisplayNames(["en"], { type: "region" });

export const languageName = (code: string) => lang.of(code) ?? code;
export const countryName = (code: string) => region.of(code) ?? code;

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

const format = (opts: Intl.DateTimeFormatOptions) => (d: Date, zone: string) =>
  new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: zone }).format(d);

export const fmtTime = format({ hour: "2-digit", minute: "2-digit" });
export const fmtWeekday = format({ weekday: "short" });
export const fmtDayOfMonth = format({ day: "numeric" });
export const fmtDayMonth = format({ day: "numeric", month: "short" });
export const fmtDayMonthYear = format({ day: "numeric", month: "short", year: "numeric" });

const FRACTION: Record<number, string> = { 15: "¼", 30: "½", 45: "¾" };

/** The tag a sitting longer than 90 minutes carries on the grid, such as "3½ h". */
export function durationTag(min: number): string | null {
  if (min <= 90) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} h`;
  return FRACTION[m] ? `${h}${FRACTION[m]} h` : `${h} h ${m} min`;
}

/** Host name minus the internal sublocation noise, for display. */
export function displayHost(l: Listing): string {
  const n = l.host.name
    .replace(/^Virtual-(AV|Audio-Only|Stream|Only)-Sublocation-/i, "")
    .replace(/_copy$/, "")
    .replace(/-[A-Za-z]+\/[A-Za-z_]+$/, "");
  return n.length > 40 ? countryName(l.country) : n;
}
