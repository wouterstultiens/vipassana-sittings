import { z } from "zod";

// Constraints are written as .refine() so the JSON Schema sent to the Claude API
// stays plain: it rejects pattern, minItems, minimum, and maxLength.

// Intl.supportedValuesOf lists only ICU's canonical names (Asia/Calcutta, not
// Asia/Kolkata), so a zone is valid when the runtime accepts it.
const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
const nonempty = <T>(a: T[]) => a.length > 0;
const nonemptyString = (s: string) => s.length > 0;
const isUrl = (s: string) => URL.canParse(s) && /^https?:$/.test(new URL(s).protocol);
const isIsoDateTime = (s: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(s);

export const Weekday = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
export const WeekOfMonth = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(-1),
]);

export const ScheduleRule = z.object({
  weekdays: z.array(Weekday).refine(nonempty),
  weeksOfMonth: z.array(WeekOfMonth).refine(nonempty).nullable(),
  start: z.string().refine((s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s)),
  durationMinutes: z.number().int().refine((n) => n > 0),
  timeZone: z.string().refine(isTimeZone),
  label: z.string().refine((s) => s.length > 0 && s.length <= 60).nullable(),
});

export const Medium = z.enum(["video", "audio", "stream"]);

export const Platform = z.enum([
  "zoom",
  "teams",
  "freeconferencecall",
  "whatsapp",
  "google-meet",
  "youtube",
  "clubhouse",
  "webex",
  "website",
  "unknown",
]);

export const Password = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("old-student") }),
  z.object({ kind: z.literal("given"), value: z.string().refine(nonemptyString) }),
]);

export const DialIn = z.object({
  numbers: z.array(z.string().refine(nonemptyString)).refine(nonempty),
  accessCode: z.string().nullable(),
});

export const Join = z.object({
  url: z.string().refine(isUrl).nullable(),
  meetingId: z.string().nullable(),
  password: Password,
  dialIn: DialIn.nullable(),
});

// What the LLM returns. Sent to the Claude API via zodOutputFormat.
export const ListingExtraction = z.object({
  languages: z.array(z.string().refine((s) => /^[a-z]{2}$/.test(s))).refine(nonempty),
  medium: Medium,
  teacherLed: z.boolean(),
  questionsAndAnswers: z.boolean(),
  platform: Platform,
  join: Join,
  scheduleRules: z.array(ScheduleRule),
});

export const Host = z.object({
  name: z.string().refine(nonemptyString), // sub_location.name, whitespace cleaned
  city: z.string().nullable(), // sub_location.city
  email: z.string().nullable(), // sub_location.contact_email
  url: z.string().refine(isUrl).nullable(), // sub_location.url, trimmed, relative paths resolved
});

// The stored record: one file per listing in the private data repo.
export const Listing = ListingExtraction.extend({
  id: z.number().int(), // API id
  name: z.string().refine(nonemptyString), // API name, whitespace trimmed and collapsed
  country: z.string().refine((s) => /^[A-Z]{2}$/.test(s)), // sub_location.country_iso_code
  host: Host,
  description: z.string(), // verbatim API HTML, never edited
  hostPageUrl: z.string().refine(isUrl).nullable(), // from the hand-kept host page list
  apiHash: z.string(), // hash of the raw API listing
  pageHash: z.string().nullable(), // hash of the stripped host page text
  extractedAt: z.string().refine(isIsoDateTime),
});

export type ScheduleRule = z.infer<typeof ScheduleRule>;
export type ListingExtraction = z.infer<typeof ListingExtraction>;
export type Listing = z.infer<typeof Listing>;
