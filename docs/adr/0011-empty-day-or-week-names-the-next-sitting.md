---
status: accepted
---

# An empty day or week names the next sitting ahead

A filter such as "Half day or more" leaves a sitting or two a month. The calendar shows one week on a laptop and one day on a phone, and neither can change its span, so the old student paged through empty weeks or swiped through empty days to find the next one, with nothing on screen to say how far it was. The guidance on empty states agrees: an empty result must say why it is empty and give the next step, and a calendar's empty state is not a list's. We decided that a day or week with no slot on it shows an empty state in place of the day list: the title says the span is empty, the line under it says the filters are the reason when they are active, and one filled button names the first sitting after that span that passes the filters, "Next match: Sat 3 Oct · 15:00", and turns the calendar to that day and hour on a tap. A ghost button clears the filters. The next sitting is searched to the end of the weeks the calendar can show; past that the empty state says so and offers only to clear the filters. The search runs only while an empty day is on screen, so the calendar's usual renders do no extra work. The empty state is shadcn's Empty component, so it reads like every other one.

## Considered options

- **Marks under the days of the day strip that hold a match.** Date pickers do this. Without filters nearly every day holds a sitting, so the marks would say nothing most of the time, and the laptop has no strip.
- **A list view that skips empty days.** What Google Calendar's Schedule view does. A second layout for one rare case is more than the case is worth, and ADR 0001 chose the day list on purpose.
- **A "next" arrow in the toolbar that skips empty spans.** Always on screen for a case that is rarely on screen, and out of sight when the empty span is what the old student is looking at.
