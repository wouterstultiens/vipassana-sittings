# Sitting finder UI: what to show and how

Research date: 2026-09-06. Scope: the calendar page that lets an old student find a virtual group sitting. Data facts and owner decisions come from the grilling session; sources are listed at the end. Claims marked *(inference)* are my own reasoning, not a source.

## Recommendation

Build a **start-time list per day**, not a to-scale grid. Keep all six owner decisions. Confirm the owner's own doubt: the to-scale calendar is not needed.

### The UI

1. **Day list.** Each day is a vertical list of rows. One row per slot (same start instant, same rounded length). A row shows, left to right: start time in bold tabular figures, the number of sittings, then chips. Rows have one fixed height (about 36 px). No lanes, no scale.
2. **Chips on a row.** Only what the filters cannot show at a glance: non-English language codes (`es`, `fr`, `zh`), deduplicated across the sittings in the row, at most three, then `+N`; a length chip only when the slot is not about one hour (`2 h`, `half day`). English gets no chip. Teacher led, Q&A, medium, host, and country stay inside the row's expansion.
3. **Desktop layout.** Seven day columns, today first, each column a day list that scrolls with the page. On a 1400 px page each column is about 190 px wide, enough for `07:00 · 4` plus two chips.
4. **Phone layout.** One day at a time. A seven-day strip of day chips at the top; the day list below it, full width. Swipe or tap to change day.
5. **Row expansion.** Tap a row to open the list of its sittings (popover on desktop, inline accordion on phone). Each sitting shows host, native language names, medium, teacher led, Q&A, then the join details and "save to calendar".
6. **Now strip.** Above today's list: "Sitting now: N · Next: 14:00 (M)". Tapping scrolls to and opens that row. This covers the secondary intent ("one free hour now") at almost no cost. It only appears when today is in view.
7. **Today's past rows** collapse into one row, "Earlier today (N)". Other days show every row.
8. **Filters.** Same five as now, in a toolbar on desktop and a bottom tray on phone. Default: nothing applied. Language options sorted with the browser language first. Applied filters are visible as removable chips with a result count. Remembered in local storage.

### Owner decisions

| # | Decision | Verdict | Reason |
|---|---|---|---|
| 1 | Planning first, "now" second | Keep | The day list serves planning; the now strip adds the second intent in one line. |
| 2 | Time and length first, then language | Keep | 141 of 151 rules are about one hour, so length needs no visible mark on most rows. Language is the first visible chip because it is the first thing that varies. |
| 3 | Language code chip, no flag, English silent | Keep | W3C: flags represent countries, not languages. Native names go in the expansion where there is room. |
| 4 | VDGS as normal sittings, no bands | Keep | In a day list the five VDGS rooms are four sittings in every `:00` row and one in every `:30` row. They are real, countable, and take no extra space. |
| 5 | Phone and desktop | Keep | Only the day list, the now strip, and a filter tray survive 375 px (section E). |
| 6 | Local storage for preferences | Keep | W3C's own advice for language: start from the browser, let the person change it, store the result. |

What I overturn: the **to-scale grid with lanes** itself. Evidence: the VDGS rooms alone put a block in every hour of every visitor's day, so the grid is never empty and lanes never drop below two *(inference from the data: four US rooms start at `:00` local, India at `:30`)*; five lanes in a 136 px laptop column give 27 px wide targets, near the WCAG 2.5.8 floor of 24 px, and 18 px on a phone; a count-only block cannot carry a language chip; and Google Calendar, Mindbody, and Calendly all ship a list of start times per day as their answer to the same need.

## A. Which presentation for a dense recurring schedule

### To-scale week grid with lanes (Google Calendar week view)

- What it is for: a personal calendar where the person needs to see gaps and durations. Google Calendar draws overlapping events of one calendar side by side; separate columns per calendar exist only in Day view ("View people's calendars", help threads).
- What breaks here *(inference from the data)*: with 736 sittings a week and five always-on rooms, every hour of every day holds at least one `:00` slot and one `:30` slot. The grid becomes wallpaper; the visitor cannot see "where the sittings are", because they are everywhere. Lanes grow to the count of distinct start times in the hour (three to five at busy hours).
- Target size: WCAG 2.5.8 (AA) requires 24 by 24 CSS px, or spacing that gives the same clearance. At 30 px per hour a one-hour block is 29 px tall; five lanes in a 136 px column are 27 px wide, in a 94 px phone column 18 px. The AAA criterion 2.5.5 wants 44 px.
- Information: a block shows only a count. The chip decision (C) has nowhere to go.
- EPG research on proportional grids: a Springer chapter and an AVI 2000 paper report that "the Programming Grid was considered by most subjects the most difficult part of the EPG". I could not open either paper (403 at three hosts); the quote comes from a search snippet and is unverified.

### Per-day start-time list (Google Calendar Schedule, Mindbody, Calendly)

- Google Calendar's own alternative: "To find a list of all your events or tasks by day, choose Schedule." On iPhone and Android the help names Schedule and Month as the views.
- Mindbody schedule widget: "Calendar or list view options", "Filter by day and/or time of day", "Pick which day the schedule starts", "Option to create a 'Today's Schedule' widget", "Automatically switches to mobile view when viewed from iPhone or Android phone", "Add grouping by date, staff, location, class description or program".
- Calendly: "Start time increments control how often available time slots appear on your booking page. For example, a 30-minute increment displays times like 9:00, 9:30, 10:00, and so on." Times are shown in the invitee's detected zone.
- What breaks *(inference)*: a day has 24 to 40 rows, so a desktop week is seven scrolling columns. Duration is no longer visible as height; a chip on the 10 long rules covers it. Rows must stay one line high or the list gets long.
- Why it fits: NN/g's cognitive-load advice is to "build on existing mental models"; a class timetable is the model every old student already knows from studio and gym schedules.

### TV-guide rows (one row per host, time on the x axis)

- This is the EPG grid. It suits a small, stable set of channels the viewer thinks of first. Here host is "detail only" (decision 2), and there are 49 hosts, so 49 rows by 24 hours by 7 days.
- The five VDGS rows would be solid bars, the band the owner rejected in decision 4.
- Fails on phone: two-dimensional scrolling (section E). No product source found that uses it for a class directory.

### Hour-bucket cells with "+N more"

- Google Calendar's Month view shows a few events per cell and a "more" link; community threads ask how to see more without the link. No official help page describes the link (no source found), so this is my product observation.
- Progressive disclosure warns against depth: NN/g says designs "should avoid exceeding two disclosure levels". Cell, then "+N" list, then sitting detail is three.
- With VDGS every cell has at least five sittings, so every cell reads "+N more" and the cell tells nothing *(inference)*.
- A one-dimensional version of this pattern is the day list above: the "bucket" is the start-time row, and the count is shown in full.

### "Sitting now" or "next up" strip

- YouTube TV's live guide has an "ON NOW" section above the channel grid and shows two hours at a time (third-party description; the official help page was not found, and the BBC guide is blocked from this machine).
- Mindbody offers a "Today's Schedule" widget as a separate, smaller view.
- Fits the secondary intent only. It must sit on top of the planning view, not replace it.

## B. How schedule products handle overlap density

| Product | Mechanism | Source |
|---|---|---|
| Google Calendar | Lanes in week view; one column per calendar in Day view; "more" link in Month; Schedule list view | Google help, help threads |
| Outlook | Overlay or side-by-side per calendar; new Outlook overlays by default | Microsoft support |
| Apple Calendar (Mac) | Zoom: "shows from 6 to 24 hours of events per day"; 5 or 7 days | Apple support |
| Mindbody widget | List or calendar view; group by date, staff, location; filter by day and time of day; "Today's Schedule"; auto mobile view | Widget readme, MB Spirit overview |
| Calendly | Pick a day, then a flat list of start times at a fixed increment | Calendly help |
| YouTube TV | "ON NOW" strip; two-hour window; hide and reorder channels | Third-party description |

Guidance:

- NN/g progressive disclosure: show "only a few of the most important options" first, no more than two levels.
- WCAG 2.5.8: 24 by 24 CSS px targets, or equivalent spacing. The "Essential" exception is for maps and data visualisations, and the note asks for an equivalent control elsewhere.
- NN/g on big tables on small screens: "Locking headers and allowing users to select a subset of data according to their needs make large data tables usable on mobile devices."

Mapping to this product *(inference)*: overlap here is structural, not incidental, because the five VDGS rooms overlap everything. Lanes and "+N" both treat overlap as an exception. Grouping by start time (the slot) treats it as the rule, and the day list makes each group one row. Grouping by host is out by decision 2. "Next N hours" is the now strip.

## C. Language marking without flags

- W3C, "Flags vs. language indicators": "Flags represent countries, not languages." "Numerous countries use the same language as another country, and numerous countries have more than one official language." Flags "have nationalistic connotations that may be unwelcome". The page's own example uses a code in brackets, `[sv]`, or the name, `[Swedish]`.
- W3C, "Language tags": "The golden rule when creating language tags is to keep the tag as short as possible." Use `ja`, not `ja-JP`. Codes are ISO 639 primary subtags: `en`, `es`, `zh`.
- W3C, language navigation: options should be in the target language, "français" not "French"; a name in a script the reader may not know can carry a clarifier, "čeština (Czech)".
- GOV.UK Language navigation: "Use the native name of each language, such as Cymraeg for Welsh. This helps speakers of that language recognise the link."
- GOV.UK Tag: use a tag when "something [can] have more than one status and it's useful for the user to know about that status"; "Do not make a tag interactive"; use adjectives; keep colours consistent.
- Shopify Polaris Badge: "Use concise labels"; "Badge text never wraps"; it truncates.
- Material 3 chips are controls (assist, filter, input, suggestion); "Filter chips ... can be a good alternative to toggle buttons or checkboxes." Material has no static label chip, so the row marker should be a badge or tag, not a Material chip.
- Apple HIG: no source found on flags versus codes.

Recommended form *(inference from the above)*: a small non-interactive tag with the lowercase two-letter code, `es`, placed at the right end of the row after the count, with `title` and `aria-label` set to the native name and English name, "Español (Spanish)". Native names go in the expansion where space exists. English gets no tag; a bilingual listing shows only its other language. Cap at three tags, then `+N`. Codes are not self-explaining to every reader, so the expansion must carry the full name.

## D. Filter design

**Default "about an hour"?** No. 141 of 151 rules are about one hour; a default filter would hide ten rules and gain nothing. Nielsen: users "tend to accept the initial option presented", so a hiding default stays hidden. Show a length tag on the rare long rows instead.

**Language default to the browser language?** Not as a filter. W3C: "It is not a good idea to use the HTTP Accept-Language header alone to determine the locale of the user", many people "never change the defaults", and machines are borrowed; use it as "a good starting point", "allow them to change the language", and "store the results in a database or a cookie for later visits". `navigator.language` gives the same BCP 47 value on the client. With 41 of 49 listings in English, a Spanish-browser visitor filtered to `es` would lose most of the sittings *(inference)*. So: no filter applied; put the browser language first in the language list; remember whatever the person picks (decision 6).

**Hide today's past sittings?** Collapse, do not delete. Calendly hides start times that fail the minimum notice; a class timetable still shows the day's earlier classes. The primary intent is planning a recurring slot, and a slot that passed today returns next week *(inference)*. One "Earlier today (N)" row keeps both.

**Start "from now"?** Yes. Google Calendar opens Schedule at today; Mindbody lets the studio "Pick which day the schedule starts" and offers "Today's Schedule". The week already starts today; the now strip and the collapsed past rows make the first visible row the next sitting.

**Filter mechanics.** NN/g: interactive filtering suits exploratory use; batch with an Apply button suits people with "multiple criteria in mind" or slow pages. The data is local and instant, so interactive is right *(inference)*. Baymard: 28% of sites show no applied-filter overview; on mobile it works as "a horizontally scrolling list" above the results; people need "immediate confirmation", "quick removal", and "context". MoJ: "only provide users with filters they really need"; "Users don't always see they can filter". DfE: on mobile people miss the "Show filters" button when it "looks inactive". NN/g mobile tray: keep "continuous visibility of results" and a fixed header with the result count while the filter panel is open.

## E. Phone at 375 px

WCAG 1.4.10 Reflow: content must work at 320 CSS px wide without two-dimensional scrolling, "except for parts of the content which require two-dimensional layout for usage or meaning", such as data tables and maps. WCAG 2.5.8: 24 px targets.

| Pattern | At 375 px | Why |
|---|---|---|
| To-scale week grid | Fails | `min-w-[700px]` today; seven columns of 94 px; lanes of 18 to 45 px; two-dimensional scroll. |
| To-scale single day | Marginal | Fits the width, but the VDGS wallpaper and the lanes remain; a day is 720 px tall for 24 to 40 rows of content. |
| Start-time day list | Works | One column, one row per slot, full-width rows of 44 px or more. This is Google Calendar's Schedule view, the phone view it names first, and Mindbody's automatic mobile view. |
| TV-guide rows | Fails | 49 rows by a time axis; two-dimensional scroll by design. |
| Hour-bucket 7 by 24 | Fails | Same reason as the week grid, and cells read "+N more". |
| Now strip | Works | One line. |
| Filter toolbar | Replace | Use NN/g's tray: a bottom sheet over the list, result count fixed at the top, applied filters as a scrolling chip row (Baymard). |

Day switching on phone *(inference)*: a strip of seven day chips, today first, each at least 44 px tall. Week paging stays behind the same previous and next controls as on desktop.

## Sources

- W3C, Flags vs. language indicators for link destinations: https://www.w3.org/International/questions/qa-link-lang
- W3C, Providing a language choice on a site: https://www.w3.org/International/questions/qa-navigation-select
- W3C, Language tags in HTML and XML: https://www.w3.org/International/articles/language-tags/
- W3C, Accept-Language used for locale setting: https://www.w3.org/International/questions/qa-accept-lang-locales
- MDN, Navigator.language: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language
- WCAG 2.2 Understanding 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.1 Understanding 2.5.5 Target Size (Enhanced): https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- WCAG 2.1 Understanding 1.4.10 Reflow: https://www.w3.org/WAI/WCAG21/Understanding/reflow.html
- GOV.UK Design System, Language navigation: https://design-system.service.gov.uk/components/language-navigation/
- GOV.UK Design System, Tag: https://design-system.service.gov.uk/components/tag/
- MoJ Design System, Filter: https://design-patterns.service.justice.gov.uk/components/filter/
- DfE blog, Applying filters consistently: https://dfedigital.blog.gov.uk/2025/03/03/applying-filters-consistently-in-dfe
- Shopify Polaris, Badge: https://shopify.dev/docs/api/app-home/polaris-web-components/feedback-and-status-indicators/badge
- Material Web, Chip docs: https://github.com/material-components/material-web/blob/main/docs/components/chip.md (the m3.material.io chip guidelines page returned no body)
- NN/g, Progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g, The power of defaults: https://www.nngroup.com/articles/the-power-of-defaults/
- NN/g, Minimize cognitive load: https://www.nngroup.com/articles/minimize-cognitive-load/
- NN/g, User intent affects filter design: https://www.nngroup.com/articles/applying-filters/
- NN/g, Mobile faceted search with a tray: https://www.nngroup.com/articles/mobile-faceted-search/
- NN/g, How to fit big tables on small screens: https://www.nngroup.com/videos/big-tables-small-screens/
- Baymard, Display applied filters in an overview: https://baymard.com/blog/how-to-design-applied-filters
- Google Calendar Help, View your day, week, or month (desktop, iOS, Android): https://support.google.com/calendar/answer/6110849
- Google Calendar Community, side-by-side and month "more" threads: https://support.google.com/calendar/thread/53186573 and https://support.google.com/calendar/thread/302471017
- Microsoft Support, View multiple calendars at the same time in Outlook: https://support.microsoft.com/en-us/outlook/calendar/view-multiple-calendars-at-the-same-time-in-outlook
- Apple Support, Change the days and times displayed in Calendar on Mac: https://support.apple.com/guide/calendar/change-the-days-and-times-displayed-icl1002/mac
- Mindbody widget readme (Healcode WordPress plugin): https://leapyoga.net/wp-content/plugins/healcode-mindbody-widget/readme.txt
- MB Spirit, Mindbody schedule widget overview: https://mb-spirit.com/mindbody-spirit-widgets/schedule-widget-overview/ (Mindbody's own support page failed to load)
- Calendly Help, Fine-tune your availability settings: https://calendly.com/help/how-to-fine-tune-your-availability-settings
- YouTube TV live guide, third-party description: https://michaelsaves.com/streaming/youtube-tv-live-guide-tutorial/ (official help page not found; BBC iPlayer guide blocked)
- Eronen and Vuorimaa, User interfaces for digital television: a navigator case study, AVI 2000; and Springer, A usability study on personalized EPG: https://link.springer.com/chapter/10.1007/978-3-540-73110-8_98 (both unreachable from this machine; quote unverified)
- ClassPass Help, How do I search for classes: https://help.classpass.com/hc/en-us/articles/204312229 (403, not used)
