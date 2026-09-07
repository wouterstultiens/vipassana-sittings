---
status: accepted
---

# Instant feedback on hover and select

Hovering a row and opening the sitting sheet felt slow. Measured on the production build, a click cost 93 to 136 ms of JavaScript before the sheet painted, and closing cost 76 to 89 ms; on the dev server it was about 300 ms. Two causes: every row built new `Intl.DateTimeFormat` and `Intl.DisplayNames` objects on each render, and every click re-rendered all 233 rows of the week because the calendar recomputed its day lists. On top of that, hover used a 150 ms colour fade, and the sheet's slide classes did nothing because `tw-animate-css` was not installed.

We decided on these rules, which follow what makes an interface feel snappy: the response to an input must be on screen within 100 ms, hover feedback must be instant, and motion that follows a click must be short and ease out.

- **No work on the click path.** Formatters are built once per zone and language titles once per code. The week's day lists are memoised and each row is a memoised component, so opening a sheet re-renders the sheet, not the calendar.
- **Hover has no transition.** Rows, list items, day strip, and buttons change colour at once. Rows also mark a press with `active:`.
- **Short motion, only for what moves.** The sheet slides in over 200 ms and out over 150 ms, both easing out, with `tw-animate-css` imported so the classes exist. Nothing else animates.
- **No tap delay.** Buttons, links, and labels set `touch-action: manipulation`.

After the change a click costs 43 to 70 ms on the production build and closing under 10 ms.

## Considered options

- **Keep the 150 ms hover fade but speed it up.** A fade of any length reads as lag on a dense grid; instant is what calendars and code editors do.
- **No sheet animation at all.** Fastest, but a 512 px panel that pops in loses the reader; a 200 ms slide keeps orientation without feeling slow.
- **Virtualise the grid.** Not needed: with stable props the rows cost nothing on a click. Revisit if the week grows far beyond a few hundred rows.
