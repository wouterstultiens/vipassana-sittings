---
status: accepted
---

# One day per screen on a phone

ADR 0002 stacked the seven one-day hour grids in one vertical scroll on a phone. With the always-on hosts every hour of every day holds slots, so a day is well over a hundred rows, and the only mark between two days was a thin header between 23:00 and 00:00. The end of a day was not clear. We decided that a phone shows one day at a time. Vertical scroll moves through the hours of that day only. A tap on the day strip or a horizontal swipe turns to another day, and a swipe past the last day of the week turns to the first day of the next. A turn keeps the hour at the top of the view, so the old student compares the same hour across days. This is how the day views of Google Calendar, Apple Calendar, and Outlook work: an hour axis never scrolls across a day boundary; a swipe does that. The laptop keeps its seven-column grid.

## Considered options

- **Sticky day headers and an end-of-day band in the stack.** Cheaper, and the pattern of agenda lists. But agenda lists have short days; here the next day is still a hundred rows away.
- **Horizontal scroll-snap over seven panes.** Each pane has its own height, so a swipe lands on a pixel offset, not an hour. One rendered day and a jump to the kept hour is simpler and exact.
