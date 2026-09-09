import { z } from "zod";

// Constraints are written as .refine(), so the shape of a host file reads as
// one flat schema and the checks sit next to the field they guard.

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

// What a caller enters after dialling: the access code, and the password some
// rooms ask for after it. Zoom asks for both, so one field cannot hold them.
export const DialIn = z.object({
  numbers: z.array(z.string().refine(nonemptyString)).refine(nonempty),
  accessCode: z.string().nullable(),
  password: z.string().nullable(),
});

// What an old student needs to enter one sitting. Every rule carries its own,
// repeated in full when two rules or two hosts use the same room.
// A page text writes a link as "text [url]", and the extraction sometimes
// copies the closing bracket along.
const unbracket = (s: string) => s.replace(/\]$/, "");

export const Join = z
  .object({
    platform: Platform,
    url: z.string().overwrite(unbracket).refine(isUrl).nullable(),
    meetingId: z.string().nullable(),
    password: Password,
    dialIn: DialIn.nullable(),
  })
  // A sitting an old student cannot enter has no place on the calendar, so a
  // join must give a way in: a link, or a number to call.
  .refine((j) => j.url !== null || j.dialIn !== null, "no way in: give a url or a dial-in");

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
  weeksOfMonth: z
    .array(WeekOfMonth)
    .refine(nonempty)
    .nullable()
    .describe("Which occurrences of the weekday in the month, -1 the last. Null when every week."),
  start: z
    .string()
    .refine((s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s))
    .describe("HH:MM on the 24-hour clock, in the host's time zone"),
  durationMinutes: z.number().int().refine((n) => n > 0),
  label: z
    .string()
    .refine((s) => s.length > 0 && s.length <= 60)
    .nullable()
    .describe("The host's own short name for this sitting, at most 60 characters"),
  applyFirst: z
    .boolean()
    .describe("True when the host asks the old student to sign up before the sitting, so nobody can walk in"),
  join: Join,
});

// What a host file says about the host itself, read from all its rows and
// pages. The fields below it are the ones the API states outright.
export const HostExtraction = z.object({
  name: z.string().refine((s) => s.length > 0 && s.length <= 80), // the name the old student sees
  // The name the extraction read, not the runtime's: ICU still answers
  // Asia/Calcutta for Asia/Kolkata, so canonicalising here would write an
  // outdated name back into a host file on every settle.
  timeZone: z.string().refine(isTimeZone).describe("IANA time zone, the host's clock for every rule"),
  languages: z
    .array(z.string().refine((s) => /^[a-z]{2}$/.test(s), "not a two-letter ISO 639-1 code such as zh"))
    .refine(nonempty)
    .describe("ISO 639-1 codes"),
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
  // The heading this host sits under on the dhamma.org virtual events page:
  // sub_location.time_zone, such as "US, Eastern Time Zone (ET)". It names the
  // entry for a host that has no page of its own, and several hosts share one.
  eventsTitle: z.string().refine(nonemptyString),
  inputHash: z.string(), // hash of every source text the extraction read
  // True when the source texts moved after this file was written: the site
  // sends the old student to the host page, and the owner writes the host again.
  sourcesChanged: z.boolean(),
});

export type Join = z.infer<typeof Join>;
export type Rule = z.infer<typeof Rule>;
export type HostExtraction = z.infer<typeof HostExtraction>;
export type Host = z.infer<typeof Host>;
