---
status: accepted
---

# One button in the detail panel, every other fact a row

ADR 0010 set the sitting's detail panel in three groups and made the host page an outline button under its own heading. The panel then mixed two shapes: rows of label and value for the meeting id, password, dial-in, and contact, and full-width buttons for the join link and the host page. The owner found the mix untidy. We looked at how Google Calendar and Apple Calendar lay out an event: one filled button for the one action, "Join with Google Meet", and under it every other fact, links included, as a row with the same leading shape. We decided that the join link stays the only button in the groups, and the host page becomes a row like the contact: the label "Host page", and as its value the site's host name, "dhara.dhamma.org", as a link with an arrow out. Every row then reads the same way, and the panel has one thing to do. The host page is a check, not the way in, so it loses nothing as a row.

## Considered options

- **Rows with leading icons instead of labels, as Google Calendar.** The icons would have to say "meeting id" and "password" on their own, which no icon does well. The label column stays.
- **The join link as a row too.** Then nothing on the panel says what to do. One filled button is the point of ADR 0010.
