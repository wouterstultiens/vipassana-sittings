# Formats in the 50 virtual listings

Resolves issue #2 (part of map #1).

Source: `.local/api_virtual.json` in the driving dev's clone, 50 objects, all with
`event_type_code = "VirtualGroupSitting"`. This file is gitignored. Listings are
referenced below by their API `id`. No join URL, meeting id, passcode, phone
number, email address, or personal name from the data is written here. The
branch is public.

Top-level fields per listing: `id`, `name`, `short_description`, `schedule`,
`description` (HTML), `url`, `ics_url`, `event_type`, `event_type_code`,
`event_instruction_languages`, `sub_location` (object with `name`,
`description`, `time_zone`, `gmt_offset`, `country_iso_code`, contact fields,
coordinates).

## 1. `schedule` field: 8 phrasing patterns (50/50)

| # | Pattern | Count | Anonymised example (verbatim) |
|---|---------|------:|-------------------------------|
| 1 | Daily, templated "1hr Sits @ times" | 10 | `Daily 1hr Sits + Q&A @ 8am & 6pm` (790); `Daily 1hr Sits - Sun-Sat: 08:00, 18:00` (785) |
| 2 | Daily, free text with times | 7 | `Every Day 5am to 6am and 8pm to 9pm` (957); `6:00-7:00, 21:00-22:00` (828, no day word at all) |
| 3 | Daily, time **ranges** ("between") | 5 | `Daily 1hr Sittings between 4-8 am & 6-10 pm` (965). Sittings start hourly inside the range on two parallel rooms |
| 4 | Daily, label only, no time | 2 | `Meditações on-line diárias` (1082). Times live in the description |
| 5 | Weekday sets | 10 | `Mon/Wed/Fri 7AM; Mon/Wed 8 PM; Sun 6 PM` (822); `Weekday 5am \| 8am \| 8pm` (895); `Weekend 3-hr Sits @ 9am-12noon` (831) |
| 6 | One weekday, weekly | 11 | `Every Sunday 9am - 11am` (908); `Weekly Wednesday ` (7348, no time); `Sunday 1hr Sittings PST: 7:00am \| 5:00pm \| 8:00pm Iran: 18:30 Sunday \| 04:30 Monday \| 07:30 Monday` (6226, two zones) |
| 7 | Monthly | 3 | `1st Saturday of the month from 8.00am to 11.30am` (1115); `1-Day (1st Saturday) and 1/2-Day (Every Sunday)` (952) |
| 8 | "Refer to details" | 2 | `Refer to details` (1540); `Daily & Weekly 1hr Sits @ different times \| Refer to details` (788) |

Cross-cutting facts about `schedule`:

- Non-English text: 7 (Chinese 944, Portuguese 1082/1083, Spanish 7085, English+Arabic 2530/2763, one Devanagari word in 829).
- Timezone written inside the field: 4 (`Malaysia time (GMT +8)` 809, `(+5.30 GMT)` 829, `PST`/`Iran` 6226, `PST` 5929).
- Time formats seen: `7am`, `7 AM`, `7:00 a.m.`, `8.00am`, `08:00`, `21:00`, `12noon`, `Noon`, `2.30PM`, Chinese `早上6:30`, Persian digits in the description of 6226.
- Duration inside the field: 20 contain `1hr`/`1-hr`/`1 hr`; ranges such as `9am - 11am` give it implicitly in 12 more.
- Non-breaking spaces or leading/trailing whitespace: 5 (809, 7348, 2530, 2763, 5929).
- `schedule` equals `short_description` in 4 (1082, 957, 1083, 907) and equals `name` in 4 (957, 2530, 1083, 890). The `name` is the schedule sentence in 957 and 890.
- `short_description` sometimes carries schedule data that the `schedule` field lacks: 822 (monthly half-day), 2530 (end time 9:05), 810/809 (half-day/1-day "on selected days", no dates).

### Schedule field vs description conflicts (13)

| Listing | Conflict |
|---------|----------|
| 909 | `schedule` says Daily; description says Monday to Saturday, no Sunday |
| 822 | `Sun 6 PM` in schedule is absent from description; monthly half-day only in `short_description` |
| 1085 / 1115 | Identical description covers both the 1-hour and the half-day programme; each listing's schedule picks one |
| 772 / 952 | 772's description also lists the 1-day and half-day programmes that 952 lists separately |
| 828 | Description adds half-day (1st and 3rd Saturday) and one-day (2nd and 4th Saturday) programmes that need a form; schedule shows daily sits only |
| 1082 / 1083 | Description holds 4 to 8 daily slots, chanting slots, and a Saturday "jornada"; schedule holds no time |
| 995 | Description holds a per-weekday HTML table: Wednesday is English/Thai with chanting before and no Q&A |
| 7085 | Schedule says Sunday "4 horas"; description says 16:00 to 19:00 (3 hours) |
| 6226 | Description names one calendar date ("Sunday 1 February"); schedule reads as weekly. One-off or recurring is unclear |
| 5995 | Description gives 19:30 for Portugal/Canary Islands and 20:30 for mainland Spain, and a first-session date; schedule gives 20:30 only |
| 890 | `name`/`schedule` say once a month; `sub_location.description` says "Weekly 1-day Sittings" |
| 990 | `name` says "Sunday : live from Ukraine"; schedule says every day |
| 2530 / 2763 | Description says `EEST` (summer time, +3); `time_zone` says EET (+2) |

## 2. Join details in `description`

### Platform (50/50)

| Platform | Count | Listings |
|----------|------:|----------|
| Zoom | 20 | 822, 790, 1082, 831, 770, 952, 772, 895, 896, 2893, 828, 2530, 1083, 995, 953, 990, 890, 1540, 2763, 907 |
| Microsoft Teams | 13 | 985, 1115, 1085, 6226, 908, 959, 958, 957, 7348, 1167, 898, 980, 5929 |
| FreeConferenceCall (app or dial-in) | 8 | 771, 810, 809, 969, 968, 965, 967, 966 |
| WhatsApp (primary) | 1 | 7085 (also a secondary group invite in 2530/2763) |
| Google Meet | 1 | 909 |
| YouTube live stream | 1 | 788 |
| Clubhouse (audio room) | 1 | 944 |
| Webex (registration page) | 1 | 829 |
| Web audio stream on an own site | 1 | 773 |
| Unknown | 3 | 785 (external page), 787 (link published shortly before start), 5995 (shortened redirect URL) |

### How the join point is given (50/50)

| Form | Count | Notes |
|------|------:|-------|
| Direct meeting join URL in the description | 28 | Zoom 18, Teams 7, FreeConferenceCall web link 1, Google Meet 1, shortened URL 1. 25 are `<a>` anchors, 3 are bare text (944, 2530, 829 style) |
| Channel or community URL, not a meeting | 4 | YouTube channel (788), Clubhouse club (944), Webex registration page (829), stream page (773) |
| Only a link to the host's own web page | 8 | 908, 959, 958, 957, 898, 953, 785, 787 |
| No URL at all: dial-in, app, or id only | 10 | 7 FreeConferenceCall dial-in listings, Zoom meeting id only (907), WhatsApp with no invite (7085), Teams with no link (7348) |

Three anchors (909, 995, 5995) wrap the real URL inside an Outlook "safelinks" redirect; the visible anchor text holds the real URL.
The 5 VDGS listings (969, 968, 965, 967, 966) and the 810/809 pair share the same dial-in numbers and access codes; only the local clock times differ.

### Meeting id, password, phone, email

| Item | Count | Detail |
|------|------:|--------|
| Meeting or conference id in plain text | 11 | 10 numeric (Zoom or Teams), 1 alphanumeric (FreeConferenceCall, 771) |
| Dial-in access code in plain text | 7 | All FreeConferenceCall VDGS listings |
| Password/passcode in plain text | 11 | 831, 770 (an online password and a separate phone-dial password), 895, 896, 2893, 2530, 2763, 990, 1540, 980, 907. The same passcode word recurs across unrelated hosts |
| Password only as a `pwd=` URL parameter | 2 | 772, 995 (11 listings carry `pwd=` in total) |
| Password referred to but not disclosed | 7 | "usual old student password" (790, 952, 890, 953), Portuguese equivalent (1082, 1083), "posted on the old students website" (828) |
| No password information | 23 | |
| Phone numbers in plain text | 17 | Dial-in numbers (790, 890, 5929, 810, 809, 969, 968, 965, 967, 966), support mobiles (908, 959, 958, 957, 909), contact phone (980), personal mobile (7085) |
| Email addresses in plain text | 7 | 1115, 1085, 909, 829, 990, 980, 7085 (909 and 7085 are personal addresses; 7085 also holds a full personal name) |
| Meeting id text differs from the id inside the join URL | 1 | 890: one digit differs (typo in the text) |
| Same Zoom room used by two hosts | 1 | 2893 (Hawaii) uses the room of 770/831 (California) |

## 3. Timezone

- `sub_location.time_zone` is always `"<ISO2>, <Name> (<ABBR>)"`, prefix equals `country_iso_code` in 50/50. 31 distinct strings for 25 countries; 14 distinct `gmt_offset` values (floats, standard time, no DST; Iran is `3.5`). No string maps to two offsets.
- The same zone gets different labels by country: `US, Eastern Time Zone (ET)` vs `CA, Eastern Time (ET)`; the same for PT and MT. `Central European Time (CET)` appears under 6 country prefixes.
- Abbreviation collisions: `IST` is India (+5.5) in 9 listings and Israel (+2) in 1; `CST` is China Standard Time (Taiwan, +8), while US Central is `CT`.
- 7 `sub_location.name` values embed an IANA zone (`Europe/Paris`, `Asia/Kolkata`, `America/Sao_Paulo`, ...); 15 embed an abbreviation (`-PT`, `-IST`, `-CST`, `-MST`). Some disagree with `time_zone` in wording only (Pakasa name `CST`, field `CT`; Karuna name `MST`, field `MT`).
- Conflicts between `time_zone` and text:
  - 1082, 1083 (Brazil): field says `Amazonia Time (AMT)`, offset -4; both descriptions say "Horário de Brasília" (-3). Both hosts are in Brasília-time states.
  - 2530, 2763: field EET (+2); description says `EEST`.
  - 6226 (Iran): field `IRST` +3.5; the sitting is scheduled in Pacific time first, Iran time second. The host is on the US west coast.
  - 5929: schedule says `PST`, field says `CA, Pacific Time (PT)`. Same zone, DST wording differs.
  - 5995: one listing, two local times for two Spanish zones.
  - 985 (Nordic): one `CET` field covers Finland (EET).
- 17 descriptions link to an external timezone converter with the sentence "If calling from a time zone other than ... convert the Group Sitting times to your local times". 809 and 829 write the offset into `schedule`; 952, 772, 2530, 2763 write `EST`/`EEST` into the description.

## 4. Duration cues

| Cue | Count | Examples |
|-----|------:|----------|
| "1hr" family in `schedule` | 20 | `1hr`, `1-hr`, `1 hr`, `1 hour` |
| Explicit start and end in `schedule` | 12 | `9am - 11am`, `8:00 pm - 9:05 pm`, `20:30 to 21:30` |
| 65-minute sits (recording plus metta) | 5 | 980 `20:00 – 21:05`, 2530 `8:00 - 9:05`, 1083 `19h às 20h05`, 909 `5:00 am – 6:05 am`, 1115 hourly blocks with 5 to 10 minute gaps |
| Two-hour block: login window + 1h sit + discourse + Q&A | 3 | 908, 959, 958 |
| Three or four hours | 2 | 831 `3-hr Sits @ 9am-12noon`; 7085 Sunday `4 horas` (text says 3) |
| Half day | 8 | 822 (2nd Sat 9 to noon), 1115/1085 (1st Sat 8 to 11:30), 952/772 (every Sunday 9 to 12), 828 (1st and 3rd Sat 14:00 to 17:30), 810/809 (no dates) |
| Full day | 6 | 952/772 (1st Sat 9 to 15:30), 890 (monthly 9:30 to 16:00, lunch break, private interviews), 828 (2nd and 4th Sat 9:00 to 16:20), 810/809 (no dates) |
| 75 minutes | 1 | 829 (Anapana for non-meditators) |
| Q&A after the sit | 17 | Phrasings: `+ Q&A`, "followed by Q&A", "about 15 minutes", "10-minute Q&A in case a teacher is present", "occasionally", "半小時的問與答" (30 min), "welcome to ask questions at the end" |
| Chanting before the sit | 3 | 995 (Wednesday only), 1082 (daily), 1083 |
| Login/setup window before start | 6 | 15 min (908, 959, 958), 10 min (980), 5 to 10 min (2530, 2763), 3 to 5 min (990) |

## 5. Format cues

Template first line of `description` (20/50): `Audio / Video over Internet | WIFI required` (9), `Audio over Internet | WIFI required` (9), `Live Stream over Internet | WIFI required` (2). 23 descriptions tell the reader to review the "Virtual Group Sitting Guidelines" through a Help button on the host app.

`sub_location.name` prefixes: `Virtual-Audio-Only-Sublocation-*` (17 listings), `Virtual-AV-Sublocation-*` (6), `Virtual-Stream-Sublocation-*` (2), `VDGS *` (8), other (17).

`sub_location.description` and `short_description` use `|`-separated tag phrases: `Audio only | Hosted by Old Students`, `Led by ATs | Live A/V from ...`, `Hosted by Old Students | Live Audio from ...`, `Live Audio / Video`, `AT, OS, or Self Hosted | Live A/V ...`.

Host cue vocabulary: `Led by ATs`, `AT-led`, `AT Lead`, `Teacher led`, `Led by Assistant Teachers`, `Led by Dhamma Servers`, `Hosted by Old Students`, `Led by Old Students`, `AT, OS, or Self Hosted`, Chinese `由助理老師帶領`, "Teachers will participate as much as possible".

Recording cues: 985 ("recordings are in English with translations alternating"), 1115/1085 ("with the support of recordings of group meditations by S.N. Goenka"), 980 (Hungarian text: playback of a Goenkaji-led recording), 990 ("not permitted to record"). Live broadcast streams: 773, 788, 787.

Contradictions inside one listing:

- 790: `name` says `Virtual-AV-...`, `sub_location.name` says `Virtual-Audio-Only-...`.
- 1115/1085: `sub_location.name` says Audio-Only, `sub_location.description` says "Live Audio + Video".
- 895/896: `sub_location.name` Audio-Only, description says "Audio / Video over Internet".
- 773: `short_description` "Led by Dhamma Servers", `sub_location.description` "Led by ATs".

## 6. Languages

- `event_instruction_languages` is empty in 16/50. English appears in 31; 18 other languages appear 1 to 3 times each.
- Of the 16 empty ones, 15 reveal a language elsewhere: `name` (7348 "English/ Dutch", 2530 "English and Arabic"), `short_description` (958 Telugu), or description text (944 Chinese, 6226 Farsi, 1082 Portuguese/Spanish, 1083 Portuguese with an English/Burmese weekend slot, 7085 Spanish, 898 Italian and English). 957 is English by default.
- Field and text disagree: 995 lists English only, Wednesday is English/Thai; 829 lists 5 languages, the text says "English and Hindi (or Indian language)"; 2530 is empty while its copy 2763 lists English and Arabic; 1115/1085 list French while the whole description is English.
- Description language: 41 English or English-first; 5 fully non-English (944 zh, 6226 fa, 1082 pt, 1083 pt, 7085 es); 4 bilingual with a full duplicate of the text (980 en+hu, 829 en+hi, 898 it+en, 2530/2763 en+ar headline only). 985 describes the session language ("recordings in English with translations alternating between four Nordic languages") rather than the text language.
- `short_description` in a different script from the description: 909 (Kannada short text, English description).

## 7. Duplicates and near-duplicates

| Group | Listings | Relation |
|-------|----------|----------|
| Same event, per country | 2530 (Palestine), 2763 (Lebanon, name ends `_copy`) | Same Zoom room, same WhatsApp group, same schedule; different country, `time_zone` string, `url`, and `event_instruction_languages` |
| Same programme, per country | 810 (Singapore), 809 (Malaysia) | Same dial-in and access codes, same `url`; different country and zone label, same offset |
| One programme, five zones | 969 (IST), 968 (PT), 965 (CT), 967 (MT), 966 (ET) | Same dial-in and access codes; `schedule` gives the local range per zone |
| Split by day type | 895 (weekdays), 896 (weekends) | Identical description, one Zoom room |
| Split by programme | 1115 (half-day), 1085 (1-hour) | Identical description |
| Split by programme | 952 (1-day/half-day), 772 (daily) | 772 already contains 952's content |
| Split by programme | 831 (weekend 3h), 770 (daily) | Identical description |
| Split by programme | 790 (daily), 890 (monthly 1-day) | Same Zoom room |
| Shared room across hosts | 2893 (Hawaii), 770/831 (California) | Same Zoom meeting id, different times |
| One sub_location, four listings | 908, 959, 958, 957 | Same template, same support phones; 958 is Telugu |
| Same template, different rooms | 1082, 1083 (Brazil) | Same Portuguese text structure, different hosts |
| Same boilerplate | 980, 990 | Identical "Notes on the Groupsittings" block and the name pattern ` VirtualGroupSitting Sunday : live from <country>` with a leading space |
| One sub_location, two programmes | 7085, 5995 (Spain) | `sub_location` "España" |

6 `sub_location.id` values are shared by 14 listings.

## 8. Field-level oddities

- `url`: null in 18; a root-relative path in 828 (host unknown from the record); leading or trailing whitespace in 980 and 995; 1540 and 2530 point at a dhamma.org non-center schedule page instead of a host site.
- `ics_url`: null in 50/50.
- `name`: leading, trailing, or double spaces in 7 (790, 810, 2530, 990, 980, 2763, 5929); 3 names are the schedule sentence; 2530/2763 names are bilingual and 150+ characters.
- `description`: 226 to 9088 characters, median 854. Tags used: `p`, `br`, `span`, `strong`, `a`, `li`, `ul`, `ol`, `div`, `em`, `b`, `h1` to `h4`, `hr`; `table` in 2 (7348, 995); `img` in 1 (985). Zero-width characters in 6226 and 2893. Emoji in 909 and 829. Date stamps: "Updated 2023-01-04" (985), "new link from 1 April 2024" (1115/1085), "first session on January 7" (5995), pandemic-era text (944, 2021).
- `sub_location`: `contact_email` set in 45, `contact_phone` in 5, `contact_name` in 11, `url` in 35; `city` in 31, `state` in 33; coordinates in 50.
- 829 (VRI Anapana) is not an old-student group sitting. It is a 75-minute Anapana session for people who have not done a course, with registration. It carries the same `event_type_code` as the other 49.

## 9. Decisions needed from a human

1. **829 (Anapana for non-meditators)**: include, exclude, or mark as a different event kind.
2. **Per-country copies (2530/2763, 810/809, the 5 VDGS zones)**: one event with many local views, or many events. The join point is identical.
3. **Split listings from one description (895/896, 1115/1085, 952/772, 831/770, 790/890)**: merge into one event with several sessions, or keep one row per listing.
4. **Brazil timezone**: trust the description ("Horário de Brasília", -3) or the field (`AMT`, -4).
5. **6226 (Farsi)**: model the sitting in Pacific time (host) or Iran time (field). Also confirm whether it is weekly or one-off.
6. **Passwords in plain text (11) and the recurring shared passcode**: store them, store a "password required" flag only, or link to the host page.
7. **Phone numbers, personal emails, and a personal name (7085, 909)**: strip from any public dataset or keep as contact.
8. **Stale content (944 pandemic notice, 985 "Updated 2023", 787 link published before each sit)**: keep as-is or flag "verify".
9. **`ics_url` is always null**: drop the field.
10. **DST**: `gmt_offset` is standard time only. Choose IANA zones (7 sub_location names already embed one) or keep the offset and accept a one-hour drift in summer.
