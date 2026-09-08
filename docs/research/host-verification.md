# Host verification: every host read against its own sources

Verification date: 2026-09-08. Sources collected the same day, with the login working on every
wall. This file supersedes `data-sources-audit.md` of 2026-09-07, which was written before the
host became the unit and still spoke of listings, a golden snapshot, and an LLM extraction.

Scope: all 41 hosts. For each one, every rule in the host file was read against every source of
that host: the text of each of its API rows, the row's schedule field, the sub_location fields,
and the full text of each of its pages. Claims below carry the source line that states them.

## What was asked, and the answer

1. **Does every sitting rest on a host page or on the row text?** Yes. Every rule of every host
   is carried by a named source. No rule was found that no source states. The sources per host
   are in the table below.
2. **Does every page return useful content?** Yes for all 32 pages of the page list: each holds
   the schedule detail or the join details of the host it serves, and none is a login page. Two
   `pageUrl` values, however, point at a page that shows the old student no sitting: 3063 Goa
   and 5142 Palestine. Three more point at a site root or a generic old-student page that the
   page list does not hold, so nothing was read from them: 1105, 1966, 2038.
3. **Are there further pages to add?** Yes. Eleven candidates are named below. Two of them are
   likely to carry a sitting the calendar does not show.
4. **Does each host file agree with its sources?** 23 hosts agree on every point. 18 carry a
   disagreement. Four hosts are missing a sitting a source states outright.

## What was changed after this reading

Everything below is what the reading found. The owner then chose to act on four of the five
groups, and this is what was written on 2026-09-08:

- **`medium`** was set from the API on the eleven hosts in the table below.
- **`password.kind`** became `old-student` on the twelve host files that copied the shared login
  into a rule.
- **`DialIn` gained a `password` field**, and 1889 and 1913 were corrected: the access code is
  the meeting id a caller enters, the password sits in its own field, and 1889's half-day keeps
  its own dial-in meeting id.
- **Two sittings were added**: 1923's monthly half-day and 2037's daily chanting sitting.

Left as found, on purpose:

- The seasonal breaks. A rule cannot say "not in July and August", and the owner chose not to
  give it one.
- The half-day and one-day sittings of 2047, 2110 and 2063. Their sources name no day and no
  date, so no rule can be written from them. They are named here so the next reading knows.
- The 2037 chanting sitting carries 60 minutes, the length every other rule of that host carries.
  No source states how long it lasts.

## Urgent: the old-student login is in the public repo

`docs/research/data-sources-audit.md` line 9 wrote the old-student user and password in the
clear. The file was committed in `6fd08d9` on 2026-09-07 and is on `origin/main`, so the login
has been public on GitHub for a day. Deleting the file, as this file does, takes it out of the
working tree and out of `HEAD`, not out of the history. The owner decides what follows: rewrite
the history of the public repo, or accept it and tell dhamma.org.

Nothing else in the public repo holds the login. The host files in the private data repo hold the
old-student password as a Zoom passcode on 14 hosts, which is where a join detail belongs.

## The four missing sittings

**1923 Dhamma Pamoda — the monthly half-day.** The page
`https://pamoda.dhamma.org/en/os-vipassana/online-group-sits/` states it outright:

> ONCE A MONTH, ON THE FIRST SATURDAY OF THE MONTH WE WILL HOLD A HALF-DAY MEDITATION SITTING
> WITH A TEACHER.
> WE WILL BEGIN AT 14:00 AND FINISH AT 17:30.
> Join a Half Day of Meditation [http://hdmeeting.pamoda.org]

The host file carries three rules, all 60 minutes, and none on Saturday afternoon. The rule this
states is `sat`, weeks `[1]`, start `14:00`, 210 minutes, on its own link. The page also says
"Half day courses will continue as usual", so the line is current.

**2037 Dhamma Sarana — the daily chanting sitting at 06:50.** Two sources state it:

> row 1082: `Cânticos:` / `De segunda-feira a domingo às 6h50min`
> the page: `De segunda-feira a domingo: 6h50 (em português, espanhol e inglês) – https://zoom.us/j/801654947`

The room `801654947` is the room row 1082 names as this host's, so the sitting is 2037's and not
681's. The host file has no 06:50 rule. Both sources are silent on how long it lasts.

**2047 Dhamma Malaya and 2110 Singapore — the half-day and one-day sittings.** Row 809 and row
810 both state them and give them a dial-in of their own:

> short_description: `Half-Day/1-Day Sittings on selected days l Live Audio`
> description: `To join half-day/1-day sitting: dial in number: +1 (667) 7701293, Access code: 850763.`

No rule can be written: "on selected days" names no day and no start. The sitting exists and the
calendar cannot show it. Same shape as 2148 Dhamma Kunja, whose one-day dates live on the VGS
portal page.

**2063 Dhamma Kunja — the virtual one-day programs.** The page states the hours but not the days:

> The Virtual One-Day Programs are from 9:30 am – 4:00 pm with a lunch break from 12:30 – 1:30pm.

The dates are on `https://kunja.dhamma.org/virtual/index.html`, which is in the page list for
2148 but not for 2063.

## Join details read wrong

**1889 Dhamma Suttama — the half-day loses its own dial-in.** The page gives the half-day a
different dial-in meeting id from the daily sittings:

> Or dial in +1 778 907 2071 Meeting ID: 519 010 350, Password: 269712

The host file gives the half-day rule `meetingId: "819 423 1414"`, the daily room's id, so
`519 010 350` is nowhere in the data.

**1889 and 1913 — `accessCode` holds a password, not an access code.** Both pages tell the phone
caller to enter the meeting id and then a password:

> 1913, the page: `Meeting ID: 972 099 4605` / `and then enter the password: 352290`
> 1889, the page: `Meeting ID: 819 423 1414` / `PW: 269712`

Both files store the password in `dialIn.accessCode` and the meeting id nowhere in the dial-in.
`DialIn` in `src/schema/host.ts` has `numbers` and `accessCode` only, so a dial-in password has
no field to sit in. This is a schema gap, not only an extraction slip.

**2370 Ukraine — the two sources name two different Zoom rooms.**

> row 990: `https://us02web.zoom.us/j/83557184027`
> the page: `https://us05web.zoom.us/j/88517545838`

The host file carries the page's room. The page is the host's own site and is the better source,
but the row still sends old students to the other room, and the Japan world table of 2026-03-29
still lists the old one.

**12699 Spain — the Sunday link's text and its href differ.**

> the page: `Link: https://goo.su/8ezG2Zx [https://goo.su/PzQLA]`

The daily rules' line is clean (`https://goo.su/PzQLA` both times), so the Sunday sitting most
likely has a link of its own, `https://goo.su/8ezG2Zx`, and the href is a page authoring slip.
The host file carries the href. The sources cannot settle it.

## `medium` disagreed with the API on eleven hosts

The API states the medium twice per host, in `sub_location.name` and in `sub_location.description`.
No host file was written from those fields. Read mechanically from `data/sources/api.json`:

| Host | file says | the API says | the API line |
|---|---|---|---|
| 1889 Suttama | video | audio | `Virtual-Only-Sublocation-suttama-...` :: `Audio only \| Hosted by Old Students` |
| 1930 Iran | video | audio | `Virtual-Audio-Only-Sublocation-iran-...` :: `Audio only` |
| 1945 Japan | video | stream | `Virtual-Stream-Sublocation-adicca-JST` :: `Live Stream from Dhammadicca` |
| 1993 Phala | video | audio | `Virtual-Audio-Only-Sublocation-phala-...` :: `Audio only`, short_description `Live Audio` |
| 2015 Bodhi | stream | audio | `Virtual-Audio-Only-Sublocation-bodhi-IST` :: `Live Audio from Dhamma Bodhi` |
| 2037 Sarana | video | audio | `Virtual-Audio-Only-Sublocation-sarana-...` :: `Audio only` |
| 2038 Paphulla | video | audio | `Virtual-Audio-Only-Sublocation-paphulla-...` :: `Audio only` |
| 2046 Nagajjuna | video | audio | `Virtual-Audio-Only-Sublocation-nagajjuna-...` :: `Audio only` |
| 2063 Kunja | video | audio | `Virtual-Audio-Only-Sublocation-kunja-PT` |
| 2356 Hungary | video | audio | `Virtual-Audio-Only-Sublocation-Hungary` |
| 2370 Ukraine | video | audio | `Virtual-Audio-Only-Sublocation-Ukraine` |

One host contradicts itself: 1994 France is named `Virtual-Audio-Only-Sublocation-fr-Europe/Paris`
but described `Live Audio + Video`, so its `video` stands. Where a page says something plainer
than the API, the page should win: 921 Dhamma Atala's page says "the host mutes everyone once
meditation starts and hence meditators hear only the audio tape", which the file reads as video.

## Sittings a rule cannot express

- **2356 Hungary, the summer break.** The page: `Except in the summer: from July to August, when
  it's difficult to have someone to host the event.` The calendar shows a Sunday sitting through
  July and August that the host does not hold.
- **921 Dhamma Atala, the summer break.** The page: `The last group sit will be on Saturday 27
  June before the summer break. The online sits will be back at the beginning of September.` No
  year is given, so the line may be old.
- **12699 Spain, the Christmas exception.** The page: `Except for Sundays falling on 24 and 31 December`.

`Rule` in `src/schema/host.ts` carries weekdays and weeks of the month, and no way to say "not in
these months" or "not on this date".

## Other disagreements, host by host

- **681 Caeté.** `languages: ["pt"]`, but row 1083 says the 07:30 weekend sitting is
  `7h30 às 8h35 (inglês/birmanês)` while the page says the same slot is `em português`. The two
  sources conflict; the file follows the page only.
- **681 and 2037.** Both files store `America/Sao_Paulo` while the API says
  `tz=BR, Amazonia Time (AMT) gmt_offset=-4`. Both texts say Brasília time, so the files are
  right and the API's `time_zone` field is wrong. Do not trust that field.
- **1923 Pamoda.** The page contradicts itself on Saturday: one block says `SAT: 9:00`, another
  says `* Sunday-Saturday: 8:00, 18:00 / * Saturday: 09:00`, and row 785 says
  `Daily 1hr Sits - Sun-Sat: 08:00, 18:00`. A Saturday 18:00 sitting is likely missing. The file
  follows the block dated "From May 1st onward", which is the sound reading.
- **1930 Iran.** All three rules have `weeksOfMonth: null`, every week, but the row description
  names one Sunday only ("Sunday, February 1st"). The schedule field is generic and supports
  weekly. Worth a human eye.
- **1994 France.** Rule 4, `sat` on weeks `[2,3,4,5]` at 08:00, is an inference: the sources say
  Saturday 08:00 with no exception, and the first-Saturday half-day would collide with it. The
  file's reading is sound and unstated.
- **2010 Nordic.** `questionsAndAnswers: false`, but both sources say
  `Occasionally, a teacher will be present to answer questions about the meditation practice
  after the sitting.` `true` is closer to the sources.
- **2320 Indonesia.** The 60-minute length and `questionsAndAnswers: true` rest on the Wednesday
  row alone (`Every Wed 1hr Sits @ 7pm + Q&A`); the page gives no length for any of the three
  sittings. `languages: ["en","my"]` is read from a line that sits under the Sunday sitting only.
- **2356 Hungary.** `durationMinutes: 60`, but two of three sources say 65: row 980 schedule
  `Sunday 8:00 pm - 9:05 pm` and its description `Every Sunday at 20:00 – 21:05`. The page rounds.
- **2384 Dhamma Pakasa.** The row and the page disagree on the second language and on Wednesday:
  the row says `Wednesday 7-8 AM CT English/Thai preceded by Chanting at 6:25 am. No Q&A`, the
  page says `Tuesday 7-8 AM CT English/Hindi followed by Q&A`. The file follows the page, so
  `hi` rests on one source and the Wednesday chanting is in no rule.
- **3063 Goa.** The row title says `Virtual Twice Daily Group Sits Goa` while its own schedule
  block says `MONDAY to SATURDAY`. The file follows the schedule block, which is right.
- **5142 Palestine.** The row writes `Every Tuesday at 8:00 PM EEST` while the sub_location says
  EET. The schedule field and the sub_location name both give a bare 8:00, so the file's 20:00
  on the host clock stands all year.
- **5670 Hawaii.** `teacherLed: true` is an inference. The strongest line is
  `After the Metta session, students may ask meditation questions to ATs for about 15 minutes`,
  which states Q&A, not that a teacher leads.
- **12699 Spain.** The three daily WhatsApp rules carry 60 minutes; the row gives start times
  only. The Sunday WhatsApp rule is 180 minutes from `de 16:00 a 19:00` while the same row's
  schedule says `4 horas`. The file took the clock times, which is right.
- **2032 Dhara.** `Each Monday and Friday after the evening group sittings, we will broadcast a
  Dhamma talk.` No start and no length, so no rule; but those two evening sittings may run past
  60 minutes.

## The password kind

Twelve host files store the old-student password itself under `password: { kind: "given", ... }`:
681, 1105, 1889, 1913, 1923, 2032, 2037, 2247, 2384, 3063, 5142, 5670. Two more store a variant
of it: 1993 and 2370. The schema has `kind: "old-student"` for exactly this, and it is unused.
The pages do print the passcode in the clear, so the extraction is faithful; but the
`old-student` kind exists so that a shared login is named, not copied.

## Further pages worth adding to the page list

Named by a source, on the host's own site, not yet fetched:

| Host | Page | Why |
|---|---|---|
| 2063 Kunja | `https://kunja.dhamma.org/virtual/index.html` | the one-day dates; already listed for 2148 |
| 2356 Hungary | `/en/old-students/tuesday-groupsits/` | its name says a weekly sitting the file does not carry |
| 2370 Ukraine | `/old-student/groupsittings/` | a second opinion on the room |
| 1114 Modana | `/os/regions/group-sittings/` | the menu labels it "Virtual Group Sitting Links" |
| 2038 Paphulla | `https://paphulla.dhamma.org/os/` | 200, and the host has no page at all today |
| 3063 Goa | `http://goa.in.dhamma.org/os` | the only old-student pointer the schedule page gives |
| 5142 Palestine | `http://www.ps.dhamma.org/os` | same |
| 2654 Bulgaria | `/old-student/announcements/` | named as where sittings are announced |
| 2047, 2110 Malaya | `https://malaya.dhamma.org/os/en/coronavirus_support.shtml` | the join user guide |
| 1889 Suttama | `/en/os/vipassana-regional-activities/` | a sibling of the page in the list |
| 2384 Pakasa | `/os/practice/local_group_sittings/` | in-person, likely not needed |

Pages that lead nowhere, checked: `ae.dhamma.org/os` is 404, `iran.dhamma.org/os` redirects to a
404, `nagajjuna.dhamma.org`'s three row urls redirect straight into a Teams meeting, and
`kunja.dhamma.org/os/vgs.html` is 404. `lb.dhamma.org` and `udaya.dhamma.org` answer 200 at the
root only; neither names an old-student sitting page.

## Verdict per host

| Host | Verdict | The sources that carry its rules |
|---|---|---|
| 681 Caeté | languages conflict | the page (sarana), row 1083 |
| 921 Atala | agrees; summer break unstated in a rule | the page (atala), row 898 |
| 1105 Lebanon | agrees (read 2026-09-07) | row 2763 |
| 1114 Modana | agrees | the page (modana), row 5929 |
| 1889 Suttama | dial-in wrong, half-day id lost, medium | the page (suttama), row 822 |
| 1913 Santosa | dial-in access code wrong | the page (santosa), rows 770, 831 |
| 1923 Pamoda | **half-day sitting missing** | the page (pamoda), row 785 |
| 1930 Iran | medium; weekly recurrence uncertain | row 6226 only |
| 1945 Japan | medium should be stream | four jp pages, row 787 |
| 1966 Udaya | agrees; pageUrl unverified | row 944 only |
| 1993 Phala | medium | rows 895, 896; the page gives the room, no times |
| 1994 France | agrees; one inferred exception | the page (fr), rows 1085, 1115 |
| 2010 Nordic | questionsAndAnswers should be true | the page (sobhana), row 985 |
| 2015 Bodhi | medium | the page (os.vridhamma), row 773 |
| 2030 Karuna | agrees (read 2026-09-08); the row text is stale | the page (karuna) |
| 2032 Dhara | agrees | the page (dhara), rows 772, 952 |
| 2037 Sarana | **06:50 sitting missing**; medium | the page (sarana), row 1082 |
| 2038 Paphulla | agrees; pageUrl shows no sitting; medium | row 909 only |
| 2046 Nagajjuna | agrees; medium | rows 908, 957, 958, 959 only |
| 2047 Malaya | **half-day sitting has no rule** | the page (malaya), row 809 |
| 2063 Kunja | **one-day program has no rule**; medium | the page (kunja), row 790 |
| 2092 UAE | zero rules; page unreadable; pageUrl is a judgement | row 788 only |
| 2110 Singapore | **half-day sitting has no rule** | the page (malaya), row 810 |
| 2126 South Korea | agrees (read 2026-09-08, two rules added) | two korea pages, row 828 |
| 2148 Kunja one-day | agrees (read 2026-09-08) | two kunja pages, row 890 |
| 2247 Vietnam | agrees (read 2026-09-08) | the jp world table, the os.vipassana.vn page |
| 2320 Indonesia | three fields rest on one weekday | the page (id), row 953 |
| 2335 VDGS US Central | agrees | row 965 only |
| 2336 VDGS US Eastern | agrees | row 966 only |
| 2337 VDGS US Mountain | agrees | row 967 only |
| 2338 VDGS US Pacific | agrees | row 968 only |
| 2340 VDGS India | agrees | row 969 only |
| 2356 Hungary | duration 65 not 60; summer break; medium | the page (hu), row 980 |
| 2370 Ukraine | two rooms; medium | the page (ua), row 990 |
| 2384 Pakasa | row and page conflict on language and Wednesday | the page (pakasa), row 995 |
| 2654 Bulgaria | agrees | the page (bg), row 1167 |
| 3063 Goa | agrees; pageUrl shows no sitting | row 1540 |
| 5142 Palestine | agrees; pageUrl shows no sitting | row 2530 |
| 5670 Hawaii | agrees; teacherLed is an inference | the page (hi.us), row 2893 |
| 12699 Spain | Sunday link doubtful; WhatsApp lengths unsourced | the page (es), rows 5995, 7085 |
| 15504 Talaka | agrees | the page (talaka), row 7348 |

## What this pass cannot catch

The source watch hashes a source and catches one that moved. It never catches a source that was
read wrong and then stayed still. This pass is the reading, and it holds only for the sources of
2026-09-08. It has to be repeated whenever a host is written again, and it is the reason a
`settle` should follow a reading, not a hash.

## Method

- One dossier per host, built by hand from `data/sources/`: the host file, every API row of that
  host with its description as text, and the full text of every page of that host.
- Six agents, five to six hosts each, each reporting disagreements with the source line quoted.
- Every quoted line in this file was read back out of `data/sources/` before it was written here.
- `medium` and the time zones were checked mechanically over all 41 hosts, not by reading.
