---
status: accepted
---

# The day strip scrolls through the weeks

ADR 0007 put the seven day panes of one week in a snap row, with the day strip fixed to that week and a week arrow that swapped all seven panes. Three things were wrong on a real phone: a swipe past the last day of the week stopped dead, the arrow turned the week with no motion so nothing showed what had happened, and the arrow was the only way to another week. We decided that the day panes run on through every day the calendar can show, today and eight weeks ahead, so a swipe past Sunday lands on Monday. The day strip holds the same days, seven per screen, and scrolls a week per screen: it follows the day on screen into its week with a smooth slide, an arrow slides it one week, and a week the strip settles on, by an arrow or a swipe of the strip, turns to the same weekday of that week, on the same hour. Only the pane on screen and its two neighbours hold a day list; the other panes are empty placeholders of the same width, so the row keeps its geometry and the render stays the size of three days. The pane the drag would settle on is the day from the moment the drag passes half way, so the toolbar names the new day before the finger lifts.

## Considered options

- **Seven panes and a jump at the edge.** Keep the week row and turn the week when a swipe reaches the last pane. The edge of a snap row is a hard stop, so the swipe past it never happens; the turn needs its own gesture.
- **Render every day pane.** Nine weeks of hour grids are over a thousand rows; ADR 0003 keeps the click path free of work. Three panes are what a peek can show.
- **Strip that only shows weeks.** Scroll the strip without turning the day, and tap to pick. One tap more for the common move to the same weekday next week; Apple's calendar turns the day with the strip, and so does this one.
