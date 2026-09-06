---
status: accepted
---

# One hour axis under the day lists

ADR 0001 made each day a list of fixed-height slot rows. That was easy to read row by row, but scrolling down a week lost the sense of time: the seven columns had different lengths, and the only clock was the time printed on each row. We decided to put the day lists on one hour axis. A gutter on the left names the 24 hours, each day column has one cell per hour, and the slots that start in that hour stack in that cell as fixed-height rows. Rows of the same hour line up across the days, so scrolling down is moving through the day, as on a calendar, while a slot still costs one row and never overlaps. Empty hours collapse to a thin line. The page opens on the current hour, today's ended rows show dimmed in place, and the "Earlier today" fold is gone. On a phone the seven one-day grids stack, each with its own gutter, and a day strip under the toolbar jumps between them.

## Considered options

- **Day lists without an axis.** Built after ADR 0001. Clean, but the reader lost where in the day they were once the day headers were the only fixed point.
- **Part-of-day headings** (morning, afternoon, evening) inside each list. Cheaper, but four coarse steps do not give a clock, and the columns still drift apart.
- **To-scale grid.** Rejected in ADR 0001 for density; nothing has changed.
