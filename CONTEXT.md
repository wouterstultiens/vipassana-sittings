# Vipassana Sittings

A calendar for old students to find a virtual group sitting in the Vipassana tradition of S.N. Goenka that fits their week, in their own timezone.

## Language

**Old Student**:
A person who has completed at least one 10-day Vipassana course in this tradition. The only audience of the site.
_Avoid_: user, member, meditator

**Host**:
The centre, region, or group of old students that runs virtual sittings, the unit of the data. One host owns one or more rows on the dhamma.org virtual events API, has one clock, and carries its rules. The API calls a host a sub-location.
_Avoid_: listing, sub-location, organiser, centre, event

**Row**:
One entry on the dhamma.org virtual events API, filled in by a volunteer of a host. A row is one more source text about its host, nothing else.
_Avoid_: listing, record, event

**Sitting**:
One concrete occurrence of a host's rule at a specific date, start time, and duration. This is what the calendar shows and it is never stored. A sitting can last one hour or a whole day.
_Avoid_: session, meeting, occurrence, course

**Slot**:
All sittings on one day that start at the same instant and last as long, with the length rounded to the half hour. One row on the day list; the old student picks a sitting from it.
_Avoid_: group, cluster, cell, block

**Day list**:
The slots of one day in start order, on the hour axis. The calendar shows seven day lists side by side on a laptop, and one at a time on a phone.
_Avoid_: column, agenda, timetable

**Hour axis**:
The gutter of 24 hours on the left of the day lists. Each day list has one cell per hour that holds the slots starting in that hour, so the rows of one hour line up across the days.
_Avoid_: timeline, time scale, grid

**Day strip**:
The row of days at the bottom of the screen on a phone, Monday to Sunday, seven per screen, with the week arrows at its ends. It scrolls through every week the calendar can show and follows the day on screen; the days of this week that are gone are dimmed. A tap turns to that day, a week the strip is brought to turns to the same weekday of that week, and the marker under the day on screen slides with a swipe of the day panes.
_Avoid_: tabs, day picker, date bar

**Day pane**:
One day list on a phone, as one screen wide and a scroller of its own. The panes of every day the calendar can show, from the Monday of this week, sit in one row that snaps a pane per screen, so a swipe peeks at the next day and settles on it, across the end of a week too. Only the pane on screen and its two neighbours hold a day list.
_Avoid_: page, slide, panel, carousel

**Clock**:
How a time of day is written: on the 24-hour clock, "20:00", or on the 12-hour clock, "8:00 PM". Follows the device until the old student picks one, as the timezone does.
_Avoid_: time format, hour format, AM/PM setting

**Tag**:
A short mark on a slot for what varies between slots: a flag per language on offer, or a length other than one hour.
_Avoid_: chip, badge, label


**Rule**:
A recurrence of a host: which weekdays, which weeks of the month if not every week, what start time on the host's clock, how long, and its own join details. One host can carry several rules. A host with no rule still exists and is shown without a place on the calendar.
_Avoid_: schedule, schedule rule, recurrence, RRULE

**Join details**:
What an old student needs to enter a sitting: the platform, the join link, the meeting id, the password, and the dial-in numbers. Every rule carries its own set in full, repeated when two rules or two hosts use the same room. Always extracted, never written by hand.
_Avoid_: credentials, access info, connection details, room

**Platform**:
The service that carries a sitting, such as Zoom or Teams. Part of the join details, so two rules of one host can differ.
_Avoid_: tool, app, provider

**Medium**:
Whether a sitting is video, audio only, or a one-way live stream.
_Avoid_: format, mode, type

**Sources**:
Everything the extraction reads, written to the private data repo by one collect: the raw API, the text of every page in the page list, and where every row url and host url leads. Rewritten whole on every collect, never interpreted.
_Avoid_: collection, corpus, snapshot, cache, dump, golden dataset

**Page list**:
The hand-kept list of every page on a host's site with detail about its sittings, per host, each with the login wall in front of it. One page can serve several hosts.
_Avoid_: source pages, host pages, host-pages.json

**Page**:
One entry of the page list: a URL on a host's site and its wall. The host's page link is the one page the extraction judges best for an old student to read.
_Avoid_: source page, host page, website source, external page

**Wall**:
The login in front of a page. Four kinds: none, a TYPO3 form, a WordPress login, and a WordPress post password. Every wall takes the one old-student login.
_Avoid_: auth, gate, paywall

**Prompt**:
The extraction rules the LLM reads, kept as one file next to the pipeline. The owner fixes a wrong host by changing the prompt or the page list and rerunning, never by editing a host file.
_Avoid_: system prompt, rules file, instructions

**Run summary**:
The report of one refresh: which hosts changed, were added, or vanished, and which failed with what reason. Written by the workflow so the owner can read it without opening logs.
_Avoid_: log, report, status
