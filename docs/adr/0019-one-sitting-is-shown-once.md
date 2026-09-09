# 19. One sitting is shown once

Date: 2026-09-09

## Status

Accepted

## Context

Two pairs of hosts held the same sitting, and the calendar showed each one
twice.

Dhamma Malaya and Singapore carry the same four daily times, the same
FreeConferenceCall number and access code, the same page, and the same clock,
because Malaysia and Singapore are both UTC+8. Their shared page says why:
"The virtual group sitting program include Malaysia and Singapore hosting in
the local time zone at the following [times]". One program, two entries.

Lebanon and Palestine carry the same Zoom room, the same password, and the
same two weekly times. The API says which of the two is the copy: the name of
the Lebanon row ends in `_copy`.

Five VDGS hosts carry one program: US Central, Eastern, Mountain and Pacific,
and India. All five share two FreeConferenceCall rooms, their access codes, and
the address `support@vdgs-na.dhamma.org`. Their ten daily sittings land on the
same ten instants, each row written in its own zone: Central 05:00 is Eastern
06:00, Mountain 04:00, Pacific 03:00, and 15:30 in India. The site already puts
a sitting on the old student's own clock, so the four other rows added nothing
but forty repeats a day.

Neither pair differs in language, medium, or length. So a slot said "2
sittings" where an old student had one to go to, and the panel offered the same
room twice under two names.

## Decision

One host of each pair is excluded, and the host that stays carries a name that
holds both places:

- `2047` Dhamma Malaya (Malaysia and Singapore) stays; `2110` Singapore goes.
- `5142` Palestine and Lebanon stays; `1105` Lebanon, the copy, goes.
- `2336` VDGS (Virtual Daily Group Sittings) stays; `2335`, `2337`, `2338` and
  `2340` go.

`pipeline/excluded-ids.json` is the mechanism, as for the VRI Anapana row. The
page of host 2110 leaves the page list, because 2047 already reads it.

The VDGS host that stays is written on a US clock, because the program is North
American and its numbers are US. A US local time follows daylight saving, as
the phone line does. The India row could not: it is written in IST, which never
moves, so it agreed with the others only while the US was on summer time and
was an hour out for the rest of the year.

## Consequences

An old student sees each sitting once, and the count on a slot is the number of
rooms they can choose from.

The country badge names one country. The host name carries the other, which is
what an old student reads first.

We do not fold two sittings that share a join url. That would fire on any two
hosts who happen to book one room, and the panel would have to hold two clocks,
two emails and two page links for one sitting. The duplication is a fault in
the dhamma.org data, and it is named once, by id, where such faults already
live.
