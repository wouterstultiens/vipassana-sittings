// Hand-written single-event .ics, downloaded as a Blob.
import type { Sitting } from "./expand";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function downloadIcs(s: Sitting) {
  const l = s.listing;
  const desc = [
    l.join.url ? `Join: ${l.join.url}` : "",
    l.join.meetingId ? `Meeting id: ${l.join.meetingId}` : "",
    "Password: see the sittings site",
  ]
    .filter(Boolean)
    .join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//vipassana-sittings//prototype//EN",
    "BEGIN:VEVENT",
    `UID:${s.key}@vipassana-sittings`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(s.start)}`,
    `DTEND:${stamp(s.end)}`,
    `SUMMARY:${esc(`Group sitting: ${l.name}`)}`,
    `DESCRIPTION:${esc(desc)}`,
    l.join.url ? `URL:${l.join.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sitting-${l.id}-${s.start.toISOString().slice(0, 10)}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}
