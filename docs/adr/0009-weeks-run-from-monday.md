---
status: accepted
---

# Weeks run from Monday, and the days gone by stay on the calendar

ADR 0008 made the day panes and the day strip run through every day the calendar can show, today and eight weeks ahead, seven per screen. On a Monday that is a week; on any other day the seven days on a strip screen, and the seven columns of the laptop grid, run from today to the same weekday next week, "Tuesday to Monday", which is a week nobody keeps. We decided that the calendar runs from the Monday of this week: the strip's first screen and the laptop's first week are Monday to Sunday, and the days of this week that are gone stay on the calendar, dimmed on the strip and with their rows already dimmed as ended. The calendar opens on today, in the day pane and in the laptop grid alike, and the strip marks today as before.

## Considered options

- **Keep the strip's marker still and scroll the days under it.** The owner's other idea: the day on screen sits at one fixed cell, and a swipe slides the days past it. That drops the week as a unit, and with it "the same weekday next week" that a week arrow gives; and Apple's calendar, which the strip follows, keeps calendar weeks.
- **Let the old student pick the first day of the week.** A setting for something a Monday start already answers for the audience, and one more control in the filters. Not now.
- **Hide the days gone by.** Empty or missing cells before today would leave the first week short, and a swipe back to yesterday's list is harmless: its rows are dimmed as ended, and a sitting's repeats can still go to the calendar from there.
