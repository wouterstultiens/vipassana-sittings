---
status: accepted
---

_Superseded in part by ADR 0015: the weekly run only watches the sources, and the owner writes every host file with a coding agent. The prompt and the master run below are history._

# The host is the unit, extracted from every source in one call, judged against a master run

The pipeline stored one record per API row and read one text for almost every row: the free text the row carries. The audit of 7 September 2026 (`docs/research/data-sources-audit.md`) found that where a host's own page could be compared with the row, one in three disagreed on a sitting or a room, and the page was the current one every time. Six hosts split one programme over several rows, and the old-student pages sit behind four kinds of login wall. We decided that the unit of the data is the host, one file per API sub-location, extracted from all its rows and all its pages in one call; that one collect logs in through every wall and writes the whole material, raw API and page texts, into the private data repo before the extraction reads it; that a host is recomputed only when the hash of its input texts moves; and that the reference the prompt is tuned against is a master run written by a coding agent from the full sources, replaced by the prompt's own output once the prompt scores equal.

## How the things relate

- A **host** owns one or more rows. Nagajjuna has four, Phala, Santosa, Dhara, Mahi, Sarana, and Spain two each. A row is one more source text.
- A host has one clock. Its **rules** are computed into **sittings** in the browser, never stored.
- Every rule carries its own **join details** in full. Rooms cross hosts: Santosa's Zoom room is on the Hawaii page too, and Suttama's Sunday evening uses Dhara's room. Repeating the join per rule keeps a host file readable on its own.
- The **page list** names every page per host with its wall. One page serves several hosts: Sarana's page serves two, Japan's world table serves Vietnam and lists sixteen other hosts.
- The **sources** are rewritten whole on every collect. A stale or dead page is visible in one place.
- The extraction fills the name the old student sees, the page link, and everything else; the pipeline adds only what the API states outright and the input hash.

## Considered options

- **Keep the row as the unit and join rows at build time.** Cheaper to write, but the LLM would read the same page twice for two rows of one host and split one programme in two by accident. Merging belongs where all the texts are read at once.
- **Crawl one level down from the row url.** Seven hosts keep the schedule one click below the url the API names, but the click differs per site and a crawl pulls in pages about in-person groups. A hand-kept list is smaller and says exactly what is read.
- **A browser for the logins.** Every wall is a plain form post with a cookie. A browser would add a dependency for nothing.
- **Store the collected material in the public repo.** The pages are for old students only, as the join links are. They stay in the private data repo with the host files.
- **Keep a hand-written golden dataset next to the live data.** Two datasets drift. The master run is a reference for one ticket, then the prompt's output is the one dataset.
- **Recompute every host on every prompt change.** A prompt change is recomputed only on purpose with `--all`, so the weekly run costs one call per moved host.
