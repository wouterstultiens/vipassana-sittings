# 17. Every host has a page to read

Date: 2026-09-09

## Status

Accepted

## Context

Nine of the 41 hosts keep no page of their own. Seven carried `pageUrl: null`,
and the detail panel then showed no page row at all: Iran, Nagajjuna, VDGS
India, and the four VDGS US hosts. Two more, Goa and Palestine, pointed at a
`www.dhamma.org/en/schedules/noncenter/…` link, which is neither their own page
nor the page other old students are sent to.

An old student who wants to read the host's own words, or who meets a sitting
whose sources moved, then had nowhere to go. Yet every one of these hosts is on
the dhamma.org virtual events page: our API, `/api/v1/events/virtual`, is that
page's own feed, and every row of it is a `VirtualGroupSitting`. That page is
long, so a link alone does not help. It groups the hosts under headings such as
"US, Eastern Time Zone (ET)", which the API states as `sub_location.time_zone`.

## Decision

A host without a page of its own is sent to the virtual events page, named by
its events title. The title is a field of the host, read from the API like the
country and the city, and never written by hand.

`hostPage()` in `src/lib/host-page.ts` decides this once: the host's own page,
or the virtual events page and the title to look for. The detail panel, the
warning on a host whose sources moved, and the calendar file all read it, so
none of them carries a case for a host without a page.

The two `noncenter` links are dropped, so Goa and Palestine follow the same
road as the other seven.

## Consequences

Every sitting names a page an old student can read. The detail panel shows one
more row, "Find it under", when the link is the shared page.

The title is not unique: five Indian hosts share "IN, India Standard Time
(IST)". It narrows the page to a handful of entries, which is what a heading
can do, and the host name and city do the rest.

A host that later gets a page of its own only needs `pageUrl`, and the title
stops being shown.
