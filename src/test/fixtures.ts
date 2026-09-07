// Hand-made hosts for the unit tests. The data lives in the private data
// repo, so the tests never read from data/.
import type { Host, Join, Rule } from "@/schema/host";

export const aJoin = (over: Partial<Join> = {}): Join => ({
  platform: "zoom",
  url: "https://us02web.zoom.us/j/100",
  meetingId: "100",
  password: { kind: "old-student" },
  dialIn: null,
  ...over,
});

export const aRule = (over: Partial<Rule> = {}): Rule => ({
  weekdays: ["mon"],
  weeksOfMonth: null,
  start: "07:00",
  durationMinutes: 60,
  label: null,
  join: aJoin(),
  ...over,
});

export const aHost = (over: Partial<Host> = {}): Host => ({
  id: 772,
  name: "Dhamma Pajjota",
  timeZone: "Europe/Amsterdam",
  country: "NL",
  city: "Dilsen",
  email: "info@example.org",
  pageUrl: "https://example.org",
  inputHash: "a",
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: true,
  rules: [aRule()],
  ...over,
});
