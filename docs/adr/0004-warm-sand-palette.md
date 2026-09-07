---
status: accepted
---

# A warm sand palette with a paper page

Light mode was one glowing sheet. The page sat at lightness 0.985, every row was pure white, and the borders at 0.9 barely showed. A week holds a few hundred rows, so most of the screen was white on white with no relief. Dark mode had the reverse problem: the page, the rows, and the borders were so close in lightness that the grid lost its structure, and the scrollbar stayed light.

We follow the Radix Colors step model, which gives each lightness step one job: page and subtle backgrounds, then component fills for rest, hover, and press, then borders, then solid fills, then text. We keep one warm hue for the neutrals and mirror the lightness between the modes.

- **The page is paper, not white.** Light mode uses step 3 of a warm sand scale for the page, so it does not read as the brightest thing in the room. Rows, popovers, and outline buttons take step 1, near white, so they lift off the page. Borders move to step 6 so they show.
- **Dark mode keeps the same hue.** The page is step 2, rows step 3, popovers one step above, borders step 6. `color-scheme` is set per mode so scrollbars and form controls match.
- **One accent, used sparingly.** A burnt ochre marks today, the current hour, and the running sitting. Today's column takes an opaque six percent wash of it over the page, which keeps the sticky day header able to hide the rows that scroll under it.
- **The login page uses the same paper.** Its inline colours are the light theme's values, so the sign in and the calendar look like one site.

## Considered options

- **Keep white rows and only darken the page a little.** At step 2 the page is still near white and the rows still blend; the relief only appears from step 3.
- **Tint the rows and keep the page white.** Inverts the hierarchy: the rows are the content and should be the lightest surface, as on a paper calendar.
- **A cool grey neutral.** Reads as a generic admin tool; the warm sand fits a site about sitting quietly, and matches the flags and the ochre accent without clashing.
