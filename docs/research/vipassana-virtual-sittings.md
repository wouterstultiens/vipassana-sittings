# Vipassana Virtual Group Sittings Research

Date: 2026-09-04

## Question

Build a public website that lets Vipassana practitioners find virtual group
sittings. Check first where old-student login gates appear, because many
sittings are only for old students in the S. N. Goenka tradition.

## Short Answer

Yes, old-student access is a real product boundary.

The official `dhamma.org` virtual-events page is public and uses a public JSON
endpoint for virtual group sitting records. That endpoint currently returns 50
records across 25 countries. Some records include meeting-provider text or
passcode/password terms inside the event description.

Do not copy raw meeting descriptions, meeting links, passcodes, or shared
old-student credentials into a public GitHub repository or public web page.
The safer public product is a finder that shows safe metadata, old-student
eligibility, source links, time-zone conversion, and a link to the official
source where the student can authenticate or verify details.

## Verified Sources

### Official Global Virtual-Events Page

URL: https://www.dhamma.org/en/locations/mobile_virtual_events

Observed with Playwright:

- The page loads as a virtual events finder.
- Without browser location access, it stayed on a loading message asking the
  user to enable location services or select a location.
- The page source initializes a `VirtualEvents` React component.
- The page source includes virtual group sitting guidelines.

Important source facts from page HTML:

- Event type is `VirtualGroupSitting`.
- Text says to check the `dhamma.org` app for updates to group sitting timings
  and call-in details.
- Text says users should convert the listed group sitting time to their local
  time when outside the listed time zone.
- Text says virtual group sittings are open to old students who have completed a
  10-day Vipassana Meditation course with S. N. Goenka or assistant teachers.
- Text says participants should practice only the meditation technique taught by
  S. N. Goenka in the tradition of Sayagyi U Ba Khin.

### Official Global API Endpoints

Discovered in the global page JavaScript bundle:

- `/api/v1/events/virtual`
- `/api/v1/events/active`
- `/api/v1/locations/`

Observed with `curl`:

- `GET https://www.dhamma.org/api/v1/events/virtual` returned HTTP 200.
- The JSON record shape includes `id`, `event_type_code`, `event_type`, `name`,
  `short_description`, `description`, `url`, `schedule`,
  `event_instruction_languages`, `sub_location`, and `ics_url`.
- The endpoint returned 50 virtual group sitting records.
- Records span 25 countries.
- The language values in the sample include Arabic, Bulgarian, Danish, English,
  Finnish, French, Hebrew, Hindi, Hungarian, Japanese, Kannada, Korean,
  Mandarin, Marathi, Norwegian, Russian, Swedish, Tamil, and Telugu.
- 40 of the 50 records include common meeting-provider terms.
- 16 of the 50 descriptions include password or passcode terms.

Privacy note:

- Some public API descriptions include direct meeting links and passcode text.
- I did not copy those details into this file.

### Official Old-Student Gate: dhamma.org

URL: https://www.dhamma.org/en/os/

Observed with Playwright and `curl -I`:

- The page returns HTTP 401.
- The response has `www-authenticate: Basic realm="Restricted"`.
- The screenshot shows only `401 Authorization Required`.

This is the earliest gate in the global old-student path. It appears before any
old-student page content is visible.

### Regional Old-Student Gate: Dhamma Suttama

URL: https://suttama.dhamma.org/os-login/

Observed with Playwright:

- The page title is `Vipassana Meditation: Old Student Login`.
- The page says each person who completed one 10-day Vipassana Meditation
  course as taught by S. N. Goenka, in any country, becomes an old student and
  can access old-student websites around the world.
- The page says a login and password are required.
- The page shows username and password fields.

This is a normal page-level login gate before old-student pages.

### Regional Old-Student Gate: VRI

URL: https://os.vridhamma.org/

Observed with Playwright:

- The page title is `User account | Old Students Website`.
- The page shows an access denied message.
- It says the user must log in to view the page.
- It shows username and password fields.
- The sidebar describes old-student resources.

This is a login gate before old-student content.

### Regional Old-Student Gate: Dhamma Pubbananda

URL: https://pubbananda.dhamma.org/login/

Observed with Playwright:

- The page is a login page titled `Welcome, Old Student`.
- The page says the old-student website contains information about
  group-sittings, old-student courses, Dhamma service, dana, and center
  development.
- The page says people who have not attended a ten-day course should use the
  public home page or the international Vipassana page.
- The page shows username and password fields.

The `virtual-group-sittings` URL redirected to this login page.

### Regional Old-Student Gate: Dhamma Modana

URL: https://modana.dhamma.org/zoom-group-sittings/

Observed with Playwright:

- The page title is `Zoom Group Sittings`.
- The page shows a login form in the header.
- The main content area says that content requires additional permissions and
  shows a blurred placeholder.

This pattern exposes the page title but gates the meeting content.

## Conclusion About Access

Do not assume all virtual group sitting data is safe to republish just because a
public JSON endpoint returns it.

The ethical and practical rule for the project should be:

- Public: event name, source center, country, language, recurrence summary, time
  zone, and official source URL.
- Public with care: whether it is old-student-only.
- Not public: meeting URLs, meeting IDs, passwords, passcodes, shared
  old-student credentials, or copied HTML descriptions that include those
  details.

## Product Inspiration

### FullCalendar

URL: https://fullcalendar.io/docs/recurring-events

Useful ideas:

- The event model separates recurring event definitions from expanded event
  instances.
- Simple recurrence handles daily and weekly patterns with fields like
  `daysOfWeek`, `startTime`, `endTime`, `startRecur`, and `endRecur`.
- This fits a browser view where users need "next sitting in my time zone".

URL: https://fullcalendar.io/docs/rrule-plugin

Useful ideas:

- Use RRULE for more complex schedules.
- Keep `exdate` or `exrule` for exceptions.
- Do not hand-roll recurrence expansion when a library can do it.

### Schema.org Schedule

URL: https://schema.org/Schedule

Useful ideas:

- A `Schedule` describes a repeating event.
- Key fields include `repeatFrequency`, `byDay`, `startTime`, `endTime`,
  `startDate`, `endDate`, and `scheduleTimezone`.
- This is good for SEO and public structured data, as long as sensitive join
  details stay out.

### Google Calendar Recurring Events

URL: https://developers.google.com/calendar/api/guides/recurringevents

Useful ideas:

- Google Calendar uses RRULE strings in a `recurrence` field.
- It has a distinction between the recurring event and its expanded instances.
- This supports an architecture with one canonical recurring rule plus generated
  upcoming sessions.

## Suggested Data Model

Start with a conservative internal model:

```text
SittingSource
- id
- name
- official_url
- source_type: dhamma_api | center_page | manual
- access_level: public | old_student_gate | unknown
- last_checked_at

SittingSeries
- id
- source_id
- title
- tradition: goenka
- eligibility: old_student_only | public_intro | unknown
- languages
- country
- region
- timezone
- recurrence_text_original
- recurrence_rule
- duration_minutes
- meeting_mode: audio | video | mixed | unknown
- source_url
- redaction_status

SittingOccurrence
- id
- series_id
- starts_at_utc
- ends_at_utc
- local_start_label
```

Important rule:

- Store source text separately from publishable fields.
- Add a redaction step before anything goes into the public website, CLI, MCP, or
  search index.

## CLI And MCP Notes

A CLI can be valuable if it answers:

- `next`: show the next sittings in the user's local time zone.
- `search`: filter by language, country, weekday, time window, or host region.
- `source`: open the official page.
- `ics`: generate a local calendar feed without sensitive join details.

An MCP server can be valuable if a coding agent or personal assistant can ask:

- "Find English old-student virtual sittings after 19:00 Europe/Amsterdam."
- "Show weekly sittings in CET with official source links."
- "Summarize sources that need re-checking."

Do not let the MCP expose protected join data unless the user has a private,
local credential setup and the data stays local.

## Repository Name Candidates

Recommended:

- `vipassana-sittings`

Other good choices:

- `dhamma-sittings`
- `virtual-vipassana-sittings`
- `old-student-sittings`
- `sitting-finder`
- `dhamma-time`

Avoid:

- Names that imply official status, such as `official-dhamma-sittings`.
- Names that imply public access to protected content.

## Next Decision

Pick the repository name first. Then create the repo with only the research note
and a README that states the project will not publish private meeting details.
