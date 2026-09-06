---
status: accepted
---

# A day list of start times, not a to-scale week grid

The site shows about 736 sittings a week, over 100 a day, and 141 of 151 schedule rules last about one hour. Five VDGS listings alone run one sitting every hour of every day, so a to-scale grid has a block in every hour of every visitor's day and overlap is the rule, not the exception. We decided that each day is a list of slots in start order, one fixed-height row per slot, with small tags only for what varies (a language other than English, a length other than one hour). Length is no longer drawn as height.

## Considered options

- **To-scale week grid with lanes.** Built on `main` before this decision. With four or five lanes a block was 27 px wide on a laptop and 18 px on a phone, below the 24 px WCAG 2.5.8 floor, and a count-only block had no room for a language mark.
- **Hour-bucket cells with "+N more".** Prototype variant A (issue #10). Every cell held at least five sittings, so every cell read "+N more".
- **One row per host, time on the x axis.** Host is a detail, not a way the old student chooses, and 49 rows by 24 hours does not fit a phone.
- **One continuous band per always-on host.** Rejected by the owner as more confusing than 24 real rows.

Research: `docs/research/sitting-finder-ui.md`. Supersedes the grid parts of issues #10 and #13.
