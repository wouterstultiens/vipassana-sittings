# Extraction rules

Rules for the prompt that turns one API listing, plus its host page text when
one is listed, into a `ListingExtraction` (`src/schema/listing.ts`). The
pipeline sends both texts in one prompt per listing. These rules were settled
on the golden dataset and the pipeline is evaluated against it.

## General

- Do not invent text. Every value comes from the listing or the host page.
- The host page overrides the API listing when they disagree.
- Inside the API listing, the description wins over the `schedule` field and
  over the sub-location fields.
- `languages` are ISO 639-1 codes, in the order the listing names them.
- `teacherLed` and `questionsAndAnswers` come from the listing's own fields.
  Two listings with the same description can differ here.
- `medium` is `video` unless the text says audio or stream, or the platform is
  audio-only (FreeConferenceCall, Clubhouse, WhatsApp).

## Schedule rules

- One rule per distinct combination of weekdays, weeks of month, start, and
  duration. A listing with sittings at 07:00 and 18:00 has two rules.
- A range such as "between 4-8 am" is not a rule. Use the listed starts in the
  description, one rule each.
- `timeZone` is one IANA zone per rule. Take it from the description, else from
  the sub-location time zone with the country. Never use `gmt_offset`.
- `weeksOfMonth` is the nth occurrence of the weekday in the month, `-1` the
  last one. Null means every week.
- **Default duration**: when a sitting states a start but no end or length,
  use 60 minutes. Group sittings are one hour by convention.
- A one-day programme, a form-only programme, a chanting-only slot, or a
  monthly sitting with no day of month gets no rule. Its text stays in the
  description.
- When no usable schedule exists, `scheduleRules` is an empty array. Do not
  guess.
- `label` is the host's own short name for a slot or room, such as
  "Virtual 1". Null when the host gives none.

## Join details

- A join URL wins over the text. When the meeting id or password in the text
  and in the URL disagree, take the URL's. The text only fills what the URL
  does not carry.
- Unwrap tracking wrappers such as Outlook safelinks and store the real URL.
  Do not change the URL in any other way.
- `password.kind` is `none` when no password is needed, `old-student` when the
  text refers to the usual old-student password, else `given` with the value.
- From the text, extract only the dial-in numbers and the access code. The
  full description is stored next to the extraction, not repeated in it.
- **Per-rule join**: a rule's `join` is null when its sittings use the
  listing's join details. Set it only when the rule's sittings use a different
  link, meeting, or dial-in room. The listing's `join` holds the first or main
  set.
