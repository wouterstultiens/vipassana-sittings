# Extraction rules

Rules for the prompt that turns one host, its API rows and its pages, into a
`HostExtraction` (`src/schema/host.ts`). The pipeline sends every text of one
host in one prompt.

## General

- Do not invent text. Every value comes from a row or a page.
- A page overrides the rows when they disagree. The host's own page overrides
  a page that lists many hosts.
- Inside a row, the description wins over the `schedule` field and over the
  host fields.
- `name` is the name an old student sees: the centre's Dhamma name, else the
  place. Never the API's internal strings.
- `timeZone` is one IANA zone for the whole host, from the city and country.
  Never use `gmt_offset`.
- `languages` are ISO 639-1 codes, in the order the sources name them.
- `teacherLed` and `questionsAndAnswers` are true only when a source says so.
- `medium` is `video` unless the text says audio or stream, or every platform
  is audio-only (FreeConferenceCall, Clubhouse, WhatsApp, dial-in only).
- `pageUrl` is the one page an old student opens for this host's sittings:
  the page with the schedule, else a row url that leads to a real page, else
  the host url when alive. Never a login page, a 404, or a meeting link.

## Rules

- One rule per distinct combination of weekdays, weeks of month, start, and
  duration. A host with sittings at 07:00 and 18:00 has two rules. The rows
  of one host merge into one rule set.
- A range such as "between 4-8 am" is not a rule. Use the listed starts.
- `weeksOfMonth` is the nth occurrence of the weekday in the month, `-1` the
  last one. Null means every week.
- **Default duration**: when a sitting states a start but no end or length,
  use 60 minutes. Group sittings are one hour by convention.
- A one-day programme with no fixed weekday, a form-only programme, a
  chanting-only slot, or a monthly sitting with no day of month gets no rule.
- When no usable schedule exists, `rules` is an empty array. Do not guess.
- `label` is the host's own short name for a slot or room, such as
  "Virtual 1". Null when the host gives none.

## Join details

- Every rule carries its join details in full, repeated when two rules use
  the same room.
- A join URL wins over the text. When the meeting id or password in the text
  and in the URL disagree, take the URL's. The text only fills what the URL
  does not carry.
- Unwrap tracking wrappers such as Outlook safelinks and store the real URL.
  Do not change the URL in any other way.
- `password.kind` is `none` when no password is needed, `old-student` when the
  text refers to the usual old-student password, else `given` with the value.
- From the text, extract only the dial-in numbers and the access code.
