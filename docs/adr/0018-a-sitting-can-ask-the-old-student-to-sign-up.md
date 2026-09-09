# 18. A sitting can ask the old student to sign up

Date: 2026-09-09

## Status

Accepted

## Context

Three rules across two hosts are not sittings an old student can walk into.
South Korea holds a one-day course on the first, third and fifth Saturday and a
half-day on the second and fourth, and its link is a Google Form, not a room.
Dhamma Pamoda holds a half-day with a teacher on the first Saturday, and asks
for a name in advance.

Each host wrote the fact into the rule's label: "One-day course, apply by
Friday", "Half-day sitting with a teacher, registration needed". The label is
free text, shown in one grey line inside the detail panel, and never on the day
list. So the calendar showed the sitting like any other. An old student could
plan their Saturday morning around it and meet a closed door.

## Decision

A rule says whether the host asks the old student to sign up first:
`applyFirst`, a boolean the extraction reads from the sources.

The day list carries it as a tag, "apply", in the same amber the site already
uses for a warning. It takes its room before the language flags, because a
flag the old student cannot use is worth less than the reason why.

The detail panel says it in full above the join button: they cannot walk in,
and the host page tells them how to sign up.

## Consequences

The old student learns the sitting is not open before they plan it, not after
they open the panel and read a label.

`applyFirst` is a fact about the sitting, not about the way in, so it sits on
the rule beside the label and not inside the join details.

A narrow row now shows fewer flags when a slot asks for a sign-up. That is the
right trade: the tag names something no other tag can say, and the panel still
holds every language.

The labels keep their own words, because they carry the deadline ("by Friday")
that a boolean cannot.
