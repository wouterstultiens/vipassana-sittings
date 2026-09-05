// Hand-made listings for the unit tests. The golden dataset lives in the
// private data repo, so the tests never read from data/.
import type { Join, Listing, ScheduleRule } from "@/schema/listing";

export const aJoin = (over: Partial<Join> = {}): Join => ({
  url: "https://us02web.zoom.us/j/100",
  meetingId: "100",
  password: { kind: "old-student" },
  dialIn: null,
  ...over,
});

export const aRule = (over: Partial<ScheduleRule> = {}): ScheduleRule => ({
  weekdays: ["mon"],
  weeksOfMonth: null,
  start: "07:00",
  durationMinutes: 60,
  timeZone: "Europe/Amsterdam",
  label: null,
  join: null,
  ...over,
});

export const aListing = (over: Partial<Listing> = {}): Listing => ({
  id: 772,
  name: "Morning and evening group sitting",
  country: "NL",
  host: { name: "Dhamma Pajjota", city: "Dilsen", email: "info@example.org", url: "https://example.org" },
  description: "<p>Sit with us.</p>",
  hostPageUrl: null,
  apiHash: "a",
  pageHash: null,
  extractedAt: "2026-01-01T00:00:00Z",
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: true,
  platform: "zoom",
  join: aJoin(),
  scheduleRules: [aRule()],
  ...over,
});
