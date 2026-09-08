---
status: accepted
---

# The weekly run only watches the sources, and no code calls a model

ADR 0014 made the host the unit and let a weekly workflow send every host whose input hash moved to the LLM, commit the answer, and deploy it. That puts an unread answer straight in front of the old student: a wrong room or a wrong start time reaches the site before anyone looks at it. Tuning a prompt to trust it unread turned out to cost more than the data is worth: 41 hosts, a handful of which move in a year. We decided that the weekly run only watches. It reads the sources again, compares the hash of each host with the hash its file carries, and marks the hosts that moved. A marked host keeps the details it has, and every one of its sittings sends the old student to the host page, which is the ground truth and is where the change almost always is. An issue tells the owner which hosts to write again. The writing is the owner with a coding agent, reading the sources in the data repo. The prompt, the Gemini client, the scorer, and the comparer are gone with it, and this repo has no model dependency left.

## How the things relate

- The **source watch** hashes the API rows and the page texts of a host. It reads no meaning from a text, so it costs nothing but the fetches.
- The mark, **source change**, lives in the host file next to the input hash. The host is the unit, so its state is in its own file, and the site build already reads that file.
- A mark is written once, when the hash first moves. The next watch finds the mark and stays quiet, so a host the owner has not settled does not mail them every Monday.
- `pnpm settle <id>` stamps the live hash and takes the mark off. It is the one step that says "this file is written from the sources as they are now".
- A host the API drops still loses its file in the watch. A host the API adds is only reported, because writing a new host file is work for a person.

## Considered options

- **Keep the weekly extraction and review the data repo commits.** A review after the deploy is a review the old student has already read past.
- **Keep the weekly extraction but hold it in a pull request.** Two repos, and the data repo is private and holds no code. A mark plus an issue says the same at a fraction of the machinery.
- **Keep the prompt and the scorer for the writing by hand.** A prompt that is only ever run by the owner is a coding agent's job, and the agent reads `data/sources/` as well as any script can. Keeping it means keeping a model dependency, an API key, and a scorer for one command a month.
- **Hide a changed host from the calendar until it is written again.** A page edit is far more often a new paragraph than a new room. A host hidden on a guess helps nobody; the old student can read the note and judge.
- **Keep the mark in a file of its own, next to `hosts/`.** The site build would read two things and the two could disagree.
- **Mail or a webhook for the notification.** An issue is already the way work enters this repo, it reaches the owner by mail, and it holds the report.
