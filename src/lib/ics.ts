// A hand-written single-event .ics for one sitting, downloaded as a Blob.
// Times are written as UTC instants, so a calendar app shows them in whatever
// timezone the old student's device uses.
import type { Sitting } from "@/lib/expand";
import { joinFor, passwordNote } from "@/lib/join";
import { fmtDuration } from "@/lib/labels";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

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

export function icsEvent(sitting: Sitting): string {
  const listing = sitting.listing;
  const join = joinFor(listing, sitting.rule);
  const description = [
    `${listing.host.name}, ${listing.name}`,
    `Lasts ${fmtDuration(sitting.rule.durationMinutes)}`,
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
    `UID:${sitting.key}@vipassana-sittings`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(sitting.start)}`,
    `DTEND:${stamp(sitting.end)}`,
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

export function downloadIcs(sitting: Sitting) {
  const blob = new Blob([icsEvent(sitting)], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sitting-${sitting.listing.id}-${sitting.start.toISOString().slice(0, 10)}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}
