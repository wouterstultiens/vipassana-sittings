// A hand-written .ics for one sitting, downloaded as a Blob: the one sitting,
// or the sitting and its repeats on that weekday. Times are wall-clock in the
// host's zone with a TZID, so the event lands on the host's clock whatever
// zone the old student's calendar is in, and so do the repeats.
import { TZDate } from "@date-fns/tz";
import { addMinutes, format } from "date-fns";
import { type Sitting, WEEKDAYS } from "@/lib/expand";
import { passwordNote } from "@/lib/join";
import { fmtDuration } from "@/lib/labels";
import type { Rule } from "@/schema/host";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const wallClock = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

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

/** The weekday of a sitting on the host's clock, "mon". */
export const hostWeekday = (sitting: Sitting) => WEEKDAYS[new TZDate(sitting.start, sitting.host.timeZone).getDay()];

/** How a sitting repeats on its weekday, as an RFC 5545 recurrence: every week, or on the rule's weeks of the month. */
export function rrule(rule: Rule, weekday: (typeof WEEKDAYS)[number]): string {
  const day = weekday.slice(0, 2).toUpperCase();
  if (!rule.weeksOfMonth) return `FREQ=WEEKLY;BYDAY=${day}`;
  return `FREQ=MONTHLY;BYDAY=${rule.weeksOfMonth.map((w) => `${w}${day}`).join(",")}`;
}

/**
 * The event key. One sitting downloads to the same event every time; its
 * repeats are one other event, so both can sit in a calendar side by side.
 */
const uid = (sitting: Sitting, repeat: boolean) => {
  const ruleIndex = sitting.host.rules.indexOf(sitting.rule);
  return repeat ? `${sitting.host.id}-${ruleIndex}-${hostWeekday(sitting)}` : sitting.key;
};

export function icsEvent(sitting: Sitting, repeat = false): string {
  const { host, rule } = sitting;
  const { join } = rule;
  const start = new TZDate(sitting.start, host.timeZone);
  const description = [
    rule.label ? `${host.name}, ${rule.label}` : host.name,
    `Lasts ${fmtDuration(rule.durationMinutes)}`,
    join.url ? `Join: ${join.url}` : "",
    join.meetingId ? `Meeting id: ${join.meetingId}` : "",
    `Password: ${passwordNote(join.password)}`,
    join.dialIn ? `Dial in: ${join.dialIn.numbers.join(", ")}` : "",
    join.dialIn?.accessCode ? `Access code: ${join.dialIn.accessCode}` : "",
    host.pageUrl ? `Host page: ${host.pageUrl}` : "",
  ].filter(Boolean);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//vipassana-sittings//EN",
    "BEGIN:VEVENT",
    `UID:${uid(sitting, repeat)}@vipassana-sittings`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=${host.timeZone}:${wallClock(start)}`,
    `DTEND;TZID=${host.timeZone}:${wallClock(addMinutes(start, rule.durationMinutes))}`,
    repeat ? `RRULE:${rrule(rule, hostWeekday(sitting))}` : "",
    `SUMMARY:${esc(`Group sitting: ${host.name}`)}`,
    `DESCRIPTION:${esc(description.join("\n"))}`,
    join.url ? `URL:${join.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .map(fold)
    .join("\r\n");
}

export const icsFileName = (sitting: Sitting, repeat = false) => `sitting-${uid(sitting, repeat)}.ics`;

export function downloadIcs(sitting: Sitting, repeat = false) {
  const blob = new Blob([icsEvent(sitting, repeat)], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = icsFileName(sitting, repeat);
  link.click();
  URL.revokeObjectURL(link.href);
}
