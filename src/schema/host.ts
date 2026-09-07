import { z } from "zod";

// Constraints are written as .refine() so the JSON Schema sent to the model
// stays plain: structured output rejects pattern, minItems, minimum, and
// maxLength.

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

export const Medium = z.enum(["video", "audio", "stream"]);

export const Password = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("old-student") }),
  z.object({ kind: z.literal("given"), value: z.string().refine(nonemptyString) }),
]);

export const DialIn = z.object({
  numbers: z.array(z.string().refine(nonemptyString)).refine(nonempty),
  accessCode: z.string().nullable(),
});

// What an old student needs to enter one sitting. Every rule carries its own,
// repeated in full when two rules or two hosts use the same room.
export const Join = z.object({
  platform: Platform,
  url: z.string().refine(isUrl).nullable(),
  meetingId: z.string().nullable(),
  password: Password,
  dialIn: DialIn.nullable(),
});

export const Weekday = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
export const WeekOfMonth = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(-1),
]);

export const Rule = z.object({
  weekdays: z.array(Weekday).refine(nonempty),
  weeksOfMonth: z.array(WeekOfMonth).refine(nonempty).nullable(),
  start: z.string().refine((s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s)),
  durationMinutes: z.number().int().refine((n) => n > 0),
  label: z.string().refine((s) => s.length > 0 && s.length <= 60).nullable(),
  join: Join,
});

// What the extraction returns for one host, from all its API rows and pages.
export const HostExtraction = z.object({
  name: z.string().refine((s) => s.length > 0 && s.length <= 80), // the name the old student sees
  timeZone: z.string().refine(isTimeZone), // the host's clock, one IANA zone for every rule
  languages: z.array(z.string().refine((s) => /^[a-z]{2}$/.test(s))).refine(nonempty),
  medium: Medium,
  teacherLed: z.boolean(),
  questionsAndAnswers: z.boolean(),
  pageUrl: z.string().refine(isUrl).nullable(), // the page an old student reads for this host's sittings
  rules: z.array(Rule),
});

// The stored host: one file per API sub_location in the private data repo.
// The id comes first so a file reads well on its own.
export const Host = z.object({
  id: z.number().int(), // sub_location.id
  ...HostExtraction.shape,
  country: z.string().refine((s) => /^[A-Z]{2}$/.test(s)), // sub_location.country_iso_code
  city: z.string().nullable(), // sub_location.city
  email: z.string().nullable(), // sub_location.contact_email
  inputHash: z.string(), // hash of every source text the extraction read
});

export type Join = z.infer<typeof Join>;
export type Rule = z.infer<typeof Rule>;
export type HostExtraction = z.infer<typeof HostExtraction>;
export type Host = z.infer<typeof Host>;
