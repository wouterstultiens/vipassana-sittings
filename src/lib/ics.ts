// A hand-written repeating-event .ics for the schedule rule of one sitting,
// downloaded as a Blob. Times are wall-clock in the host's zone with a TZID,
// so the event follows the host through daylight saving, and the RRULE
// carries the rule's weekdays or weeks of the month.
import { TZDate } from "@date-fns/tz";
import { addMinutes, format } from "date-fns";
import type { ScheduleRule } from "@/schema/listing";
import type { Sitting } from "@/lib/expand";
import { joinFor, passwordNote } from "@/lib/join";
import { fmtDuration } from "@/lib/labels";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const wallClock = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

const BYDAY: Record<ScheduleRule["weekdays"][number], string> = {
  mon: "MO",
  tue: "TU",
  wed: "WE",
  thu: "TH",
  fri: "FR",
  sat: "SA",
  sun: "SU",
};

function rrule(rule: ScheduleRule): string {
  const days = rule.weekdays.map((wd) => BYDAY[wd]);
  if (!rule.weeksOfMonth) return `FREQ=WEEKLY;BYDAY=${days.join(",")}`;
  return `FREQ=MONTHLY;BYDAY=${rule.weeksOfMonth.flatMap((w) => days.map((d) => `${w}${d}`)).join(",")}`;
}

const esc = (s: string) =>
  s
    .replace(/\\/g, String.raw`\\`)
    .replace(/;/g, String.raw`\;`)
    .replace(/,/g, String.raw`\,`)
    .replace(/\n/g, String.raw`\n`);

// RFC 5545 keeps a content line to 75 octets and continues it on the next line
// after a single space. Counting is in UTF-8 octets, not characters.
const octets = (s: string) => new TextEncoder().encode(s).length;

function fold(contentLine: string): string {
  const parts: string[] = [];
  let current = "";
  let limit = 75;
  for (const char of contentLine) {
    if (octets(current) + octets(char) > limit) {
      parts.push(current);
      current = "";
      limit = 74; // the continuation's leading space takes one octet
    }
    current += char;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** The listing id and the rule index: the same rule downloads to the same event. */
const uid = (sitting: Sitting) => `${sitting.listing.id}-${sitting.listing.scheduleRules.indexOf(sitting.rule)}`;

export function icsEvent(sitting: Sitting): string {
  const { listing, rule } = sitting;
  const join = joinFor(listing, rule);
  const start = new TZDate(sitting.start, rule.timeZone);
  const description = [
    `${listing.host.name}, ${listing.name}`,
    `Lasts ${fmtDuration(rule.durationMinutes)}`,
    join.url ? `Join: ${join.url}` : "",
    join.meetingId ? `Meeting id: ${join.meetingId}` : "",
    `Password: ${passwordNote(join.password)}`,
    join.dialIn ? `Dial in: ${join.dialIn.numbers.join(", ")}` : "",
    join.dialIn?.accessCode ? `Access code: ${join.dialIn.accessCode}` : "",
  ].filter(Boolean);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//vipassana-sittings//EN",
    "BEGIN:VEVENT",
    `UID:${uid(sitting)}@vipassana-sittings`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=${rule.timeZone}:${wallClock(start)}`,
    `DTEND;TZID=${rule.timeZone}:${wallClock(addMinutes(start, rule.durationMinutes))}`,
    `RRULE:${rrule(rule)}`,
    `SUMMARY:${esc(`Group sitting: ${listing.name}`)}`,
    `DESCRIPTION:${esc(description.join("\n"))}`,
    join.url ? `URL:${join.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .map(fold)
    .join("\r\n");
}

export const icsFileName = (sitting: Sitting) => `sitting-${uid(sitting)}.ics`;

export function downloadIcs(sitting: Sitting) {
  const blob = new Blob([icsEvent(sitting)], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = icsFileName(sitting);
  link.click();
  URL.revokeObjectURL(link.href);
}
