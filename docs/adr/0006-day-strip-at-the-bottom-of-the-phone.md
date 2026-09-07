---
status: accepted
---

# The day strip at the bottom of the phone screen

ADR 0005 put one day per screen on a phone, with the day strip under the toolbar and a horizontal swipe to turn the day. The swipe did not work on a real phone, and nothing on screen said it existed. We prototyped three ways to turn the day (branch `prototype/phone-day-nav`): a day pager in the toolbar with a "next day" row at the end of the list, the day strip fixed at the bottom of the screen, and a carousel with arrows and swipe. The owner chose the bottom strip. We decided that the day strip is fixed at the bottom of the phone screen, in reach of the thumb, with the week arrows at its ends. A week arrow keeps the weekday. The toolbar holds only the filters and the theme toggle. The marked day in the strip widens to show its date with the month, so the strip is the only place the date is said. There is no swipe.

## Considered options

- **Day pager in the toolbar and a next-day row.** Clear, but the bottom strip does the same with one control and the thumb reaches it.
- **Carousel (shadcn Carousel on Embla).** Swipe worked, but a turn kept the pixel position rather than the hour, and the page took the height of the longest day.
- **Bottom strip with the date in the toolbar.** The prototype showed "Monday 14 Sept" and "14 Sept – 20 Sept" up top and "Mon 14" in the strip: the date three times. A month alone up top was still one place too many.
