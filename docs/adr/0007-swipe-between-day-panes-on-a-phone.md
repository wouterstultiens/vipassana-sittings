---
status: accepted
---

# Swipe between day panes on a phone

ADR 0006 fixed the day strip at the bottom of the phone screen and dropped the swipe, after a carousel on Embla kept the pixel position across a turn and made the page as tall as the longest day. The owner still wanted a swipe that peeks: while the finger drags, the next day slides in beside the current one, and the strip's marker slides with it. We decided that the phone's seven day lists sit in one row that snaps one pane per screen, with CSS scroll snap and no library. Each pane is a vertical scroller of its own, so a pane has its own height and its own hour position. When a drag starts, every other pane jumps to the hour at the top of the pane on screen, so the peek shows the same hour on the next day, and a turn keeps the hour as ADR 0005 asked. The pane the drag settles on becomes the day: the toolbar names it and the strip marks it. The marker under the day is one element that moves with the drag as a fraction of a cell, and a tap on the strip slides the row to that day the same way. A week arrow keeps the weekday and the hour. The page itself no longer scrolls on a phone: toolbar, applied filters, panes, and strip fill the screen as one column.

## Considered options

- **Keep the tap-only strip.** Works, but the owner found that nothing invited a swipe, and a peek at the next day is what calendar apps do.
- **Carousel on Embla (shadcn).** Tried in ADR 0006. A library gesture moves the pane, but the panes shared the page's scroll, so a turn kept pixels and the page took the tallest day.
- **Own touch handling with transforms.** A drag on translateX with a snap on release. More code, and it must reimplement what the scroll snap and the momentum of the platform already give.
