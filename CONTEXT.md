# Vipassana Sittings

A calendar for old students to find a virtual group sitting in the Vipassana tradition of S.N. Goenka that fits their week, in their own timezone.

## Language

**Old Student**:
A person who has completed at least one 10-day Vipassana course in this tradition. The only audience of the site.
_Avoid_: user, member, meditator

**Listing**:
One entry on the dhamma.org virtual events API, such as "Nordic Online Group Sittings". A listing holds the host, the join details, and a schedule written as free text.
_Avoid_: event, record, entry

**Sitting**:
One concrete occurrence of a listing at a specific date, start time, and duration. This is what the calendar shows. A sitting can last one hour or a whole day.
_Avoid_: session, meeting, occurrence, course

**Schedule rule**:
A recurrence extracted from a listing: which weekdays, which weeks of the month if not every week, what start time, how long, and in which timezone. One listing can carry several schedule rules. A listing with no schedule rule still exists and is shown without a place on the calendar.
_Avoid_: schedule, recurrence, RRULE

**Join details**:
What an old student needs to enter a sitting: the join link, the meeting id, the password, and the dial-in numbers. A listing has one set of join details. A schedule rule carries its own set when its sittings use a different room or link. Always extracted from the listing, never written by hand.
_Avoid_: credentials, access info, connection details

**Platform**:
The service that carries a sitting, such as Zoom or Teams. One listing has one platform.
_Avoid_: tool, app, provider

**Medium**:
Whether a sitting is video, audio only, or a one-way live stream.
_Avoid_: format, mode, type

**Host**:
The centre, region, or group of old students that runs a listing. The API calls this the sub-location.
_Avoid_: sub-location, organiser, centre

**Golden dataset**:
The structured data for every listing, produced once by hand and reviewed, together with the raw listings and host page texts it was made from. It is the first version of the data and the reference the automated pipeline is evaluated against.
_Avoid_: seed data, fixture, initial dump

**Run summary**:
The report of one refresh: which listings changed, were added, or vanished, and which failed with what reason. Written by the workflow so the owner can read it without opening logs.
_Avoid_: log, report, status

**Host page**:
The one page on a host's own website that holds the schedule detail for a listing. When the host page and the listing disagree, the host page wins.
_Avoid_: host site, website source, external page
