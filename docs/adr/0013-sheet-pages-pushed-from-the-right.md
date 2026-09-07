---
status: accepted
---

# The sitting sheet as pages pushed from the right

A row on the calendar opened a sheet: from the right on a laptop, and on a phone a full-height sheet that slid up from the bottom. A slot with several sittings showed a list, and a pick replaced the list in place, with a back row on every page. On a phone nothing about the sheet said how to get back other than that row, and a page that replaces another in place gives no sense of depth. The owner wanted the pages to come in from the right, as a phone's own apps push a page, so that a swipe back is what the old student expects and does. We decided that the sheet is a stack of pages from the right. The first page is the slot's list, or the one sitting's detail panel when the slot holds one. A pick pushes the detail panel over the list as a second page. Every page keeps its back row, and a drag to the right takes the page away: to the list from a picked sitting, else to the calendar. The pages are vaul drawers, which the filter tray already uses: a right drawer for the first page and a nested right drawer for the second, so the drag, the threshold, and the slide are the library's, and a drag on the picked sitting shows the list behind it. A page fills the screen on a phone and is a panel at the right on a laptop, so both layouts share one sheet. The scrolling parts of a page take vertical pans only, so a horizontal drag anywhere on the page is the page's, not the browser's.

## Considered options

- **Keep the bottom sheet and animate the pick in from the right.** A slide inside the sheet, with no gesture. The back row was already there; the missing part was the swipe.
- **Own touch handling on the sheet.** A drag on translateX with a snap on release. More code, and it must reimplement the drag, the threshold, and the spring that vaul already has and the filter tray already trusts.
- **Two separate drawers instead of a nested one.** Two roots that each lock the body and stack overlays. The nested drawer is what the library offers for a page over a page.
