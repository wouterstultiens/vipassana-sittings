# Data sources audit: what exists, how it links, and where it disagrees

Audit date: 2026-09-07. Scope: every source of truth behind one sitting on the calendar, how the pipeline uses each source today, and what the audit found when every source was read side by side. Written as the starting point for a session that collects all available information before the pipeline is changed. Claims marked *(inference)* are my own reasoning, not a source.

## Summary

- The stored data is fresh and complete against the dhamma.org API: 49 of 50 listings, identical to the live API on the audit date.
- The pipeline reads one source for almost every listing: the free text an API listing carries. It reads a host page for 3 listings only.
- The old-student login (`oldstudent` / `behappy`, the same everywhere) opens the host page for 27 of the 49 listings. The pipeline cannot pass those logins yet, except basic auth, which no page uses.
- Where the host page and the listing text could be compared, one in three disagree on a fact that changes what the calendar shows or which link the old student clicks. In every such case the host page was the current one.
- The site shows a misleading "Host page" link for most listings: it is the centre's generic old-student site, and two thirds of those are dead or a login wall.

## The four things and how they link

There are four kinds of thing, from three different owners.

### 1. The listing on dhamma.org

The dhamma.org virtual events API answers at `https://www.dhamma.org/api/v1/events/virtual` with a list of 50 listings. One listing is one row a volunteer filled in on the dhamma.org events form. Its fields:

| Field | What it is | Example |
|---|---|---|
| `id` | Stable number, the file name in the data repo | `985` |
| `name` | Title | "Nordic Online Group Sittings" |
| `short_description` | One line | "Wednesdays 7:00 p.m., Sundays 8:00 a.m." |
| `description` | Free HTML, the body of the form | Times, join link, meeting id, password, guidelines |
| `schedule` | Free text, one line | "Mon/Wed/Fri 7AM; Mon/Wed 8 PM; Sun 6 PM" |
| `url` | **The listing's own page on the host's site.** 32 of 50 have one. | `https://sobhana.dhamma.org/os/` |
| `event_instruction_languages` | Language names | `["English"]` |
| `sub_location` | The host record, see 3 | |
| `ics_url` | Calendar feed URL, unused | |

The description is what the site shows under the label "Host page details". That label is wrong: the text does not come from any host page. It is the listing's own body. The description and the host page are two unrelated texts by two different volunteers, and they drift apart independently.

### 2. The host page

A page on the host's own website that holds the schedule detail for a listing. Three ways to reach one:

- **The listing `url`** on the API. 32 listings have one. It is the natural host page but the pipeline never stores it or reads it.
- **The hand-kept list** in `pipeline/host-pages.json`. 3 entries today: Pamoda (785), Malaya and Singapore (809, 810). Only these are fetched, hashed, and sent to the extraction. The page wins over the description when they disagree.
- **A deeper page** the API does not name. Kunja and Pakasa both keep the schedule at `/os/practice/vgs/`, while the listing `url` points at a dead file or the login page. Korea's, Hungary's, Ukraine's, Japan's, and Sarana's schedule pages are all one click below the URL the API gives.

Most host pages sit behind the old-student login. The login is the same everywhere, but the wall is not. Four kinds were met:

| Wall | How it works | Sites |
|---|---|---|
| Basic auth | HTTP 401, `Authorization: Basic` | None met in this audit. The fetcher supports only this one. |
| TYPO3 form | POST `user`, `pass`, `logintype=login` to the form's action, keep the cookie | sobhana, suttama, fr (mahi), jp, talaka, bg, ua, hu, es, paphulla, korea |
| WordPress login | POST `log`, `pwd` to `/wp-login.php`, keep the cookie | dhara, karuna, kunja, pakasa, santosa |
| WordPress post password | POST `post_password` to `/wp-login.php?action=postpass`, keep the cookie | phala, id, sarana |

Three were not opened: UAE (788, a WordPress login whose form fields differ), Bodhi (773, a Drupal login at os.vridhamma.org), and Iran (6226, no old-student page found).

Some host pages carry several hosts. Santosa's page lists the West Coast, Northwest, and East Coast rooms. Japan's page carries a hand-made table of 17 hosts worldwide. An extraction that reads such a page must be told which host it is reading for. *(inference)*

### 3. The centre, called the host

The API's `sub_location`. One centre or region that runs one or more listings. Fields the pipeline keeps: `name`, `city`, `contact_email`, `url`, `country_iso_code`, `time_zone`. Kept as `listing.host` in the stored record.

`sub_location.url` is the centre's generic old-student site, such as `http://www.karuna.dhamma.org/os`. It is not the schedule page. The site shows it as "Host page" whenever the hand-kept list has no entry, which is 33 listings. Of those centre URLs, checked over HTTP on the audit date:

- Dead (404, unreachable): santosa (770, 831), bodhi (773), ae (788), dhamma.org page (828), kunja vgs.html (890), nagajjuna (908, 957, 958, 959), iran (6226), sarana (1082), phala (895, 896).
- Redirect to a 404 page with status 200: mahi (1085, 1115), paphulla (909).
- Login wall: karuna (771), kunja (790), pakasa (995).
- Alive and generic: the rest.

One centre can hold several listings that are one programme split by weekday or by length. Nagajjuna has four listings, Phala two (weekdays and weekends), Santosa two (daily and weekend), Dhara two (daily and one-day), Mahi two (one hour and half day), Sarana two (two Zoom rooms). The pipeline treats each as independent.

### 4. The sitting

One occurrence on the calendar at a date, start, and length. Sittings are not stored. They are computed at build time from the stored listing's schedule rules, see `src/lib/expand.ts`. A rule is weekdays, weeks of month, start, length, timezone, and an optional set of join details of its own.

So the chain is:

```
API listing (title, description, schedule, url, host)
    + host page text (only when on the hand-kept list)
    → LLM extraction → stored record (data/listings/<id>.json)
    → schedule rules → sittings → slots on the calendar
```

The detail panel reads the stored record only. It shows the join link from the extraction, the host page as `hostPageUrl ?? host.url`, and the raw description under "Host page details".

## What the pipeline does today

`pipeline/refresh.ts`, run by hand. Not wired into the deploy workflow yet (issue #23). The weekly cron in `deploy.yml` only rebuilds and redeploys; the data froze at the 5 September 2026 extraction.

Per listing: hash the API fields, fetch and hash the host page if listed, and send both texts to Claude Haiku only when a hash moved. The prompt is `pipeline/prompt.md`. The rule "the host page overrides the listing when they disagree" is in the prompt, but applies to 3 listings only, because only 3 pages are fetched.

`pipeline/fetch-page.ts` fails on a login redirect, a redirect to another host, and text under 200 characters. It cannot pass a form login.

## What the audit found, per listing

Read with the login where needed. "Agree" means the page and the description name the same sittings and the same room.

| Id | Host | Page reached | Result |
|---|---|---|---|
| 770, 831 | Santosa (US West) | Yes, WordPress login, `/os/virtual-group-sittings/` | Agree. Daily 7:00 and 19:00 PT, Sat and Sun 9:00 to 12:00, Zoom 9720994605. Page gives phone password 352290. |
| 771 | Karuna (CA Mountain) | Yes, WordPress login | **Disagree completely.** Description: daily 8:00 on dial-in room `dk.paz`. Page: Mon 18:30 and Tue 19:00 on room `smartj`, Thu 19:30 on `vlegorre`, Sun 7:30 on Teams. Stored data shows the description. |
| 772, 952 | Dhara (US East) | Yes, WordPress login | Agree. Daily 7:00 and 18:00 ET on two Zoom rooms, first Saturday one-day, Sundays half day. Passcode `behappy`. |
| 785 | Pamoda (Israel) | Yes, open | Page wins, stored follows page. Page has stale notices from April and May with no year. |
| 787 | Adicca (Japan) | Yes, TYPO3 login | **Disagree.** Description: Sat and Sun 18:00 stream. Page: Sat and Sun 18:00 and 20:00, plus a daily programme at 5:30, 18:00, 20:00 whose per-slot links live in a public TimeTree calendar, no password. Stored has two of nine sittings and the join link is the host page. |
| 788 | UAE | No, login not passed | Unknown. |
| 790 | Kunja (US Pacific) | Yes, WordPress login, `/os/practice/vgs/` | Agree. Daily 8:00 and 18:00 PT, Zoom 2873725986, old-student password. The listing `url` `/os/vgs.html` is dead. |
| 809, 810 | Malaya, Singapore | Yes, open | Page wins, stored follows page. Description's second dial-in room for half days is not on the page. |
| 822 | Suttama (CA East) | Yes, TYPO3 login | **Disagree.** Page adds Sunday 8:00. Page says Sunday 18:00 uses the Dhara room 85852750934, not the listing's room. Stored Sunday 18:00 rule points at the wrong room. Page gives password `behappy` and a dial-in the description lacks. |
| 828 | Korea | Yes, TYPO3 login, `/old-student-site/group-sittings/virtual-group-sitting/` | **Disagree on password and Saturdays.** Same Zoom room and daily 6:00 and 21:00. Page password is `0000`; stored says old-student password. Page: one-day on 1st, 3rd, 5th Saturday, half day on 2nd and 4th. Description has them the other way round. |
| 890 | Kunja one-day | Yes, same page as 790 | Agree. Dates are on a separate portal at `/virtual/index.html`. No rule stored, correct. |
| 895, 896 | Phala (Philippines) | Yes, post password | Agree. Same Zoom link and passcode. |
| 907 | Vietnam | No page in API | Japan's world table gives the full Zoom link with password and a host site, `os.vipassana.vn`. Stored has meeting id and password, no link. |
| 908, 957, 958, 959 | Nagajjuna (India) | The URL is a redirect into the Teams meeting | Agree. The stored join link is the redirecting host URL, which works. |
| 909 | Paphulla (India) | Yes, TYPO3 login | Page lists in-person groups only. No virtual detail. |
| 953 | Indonesia | Yes, post password | **Disagree.** Description: "click here for the link". Page: Wed, Sat, Sun at 19:00, each with its own Zoom link and passcode. Stored has Wednesday only and the join link is the host page. |
| 965 to 969 | VDGS (US, India) | No page | Dial-in only. Correct as stored. |
| 980 | Hungary | Yes, TYPO3 login, `/en/old-students/online-group-sitting/` | Agree. Sunday 20:00 Teams, passcode `RVMarK`. |
| 985 | Nordic | Yes, TYPO3 login | Agree. Wed 19:00 and Sun 8:00 CET, same Teams link. Description says "Updated 2023-01-04". |
| 990 | Ukraine | Yes, TYPO3 login, `/old-student/meditation-online/` | **Disagree on the room.** Description and stored: Zoom `us02web.zoom.us/j/83557184027`. Page: `us05web.zoom.us/j/88517545838`. Same password. Japan's table of March 2026 still lists the old room. |
| 995 | Pakasa (US Central) | Yes, WordPress login, `/os/practice/vgs/` | Agree. Daily 7:00 CT, passcode `behappy`. |
| 1082, 1083 | Sarana (Brazil) | Yes, post password, `/pt-BR/meditacoes-em-grupo-vipassana/` | **Page lists more sittings** than either description. Not read in full. Japan's table lists for room 902419783: daily 5:00 chanting, Mon to Fri 9:30, 14:30, 19:00, Sat and Sun 7:30, 18:00, 19:00. Stored 1083 has Mon to Fri 5:00 and 19:00, Sat and Sun 7:30 and 17:30. |
| 1085, 1115 | Mahi (France) | Yes, TYPO3 login | Agree. Page adds the meeting id. |
| 1167 | Bulgaria | Yes, TYPO3 login, `/old-student/group-sittings-and-1-day-courses/` | Agree. Tuesday 19:30 Teams. |
| 1540 | Goa | Generic schedule page | Nothing to compare. |
| 2530, 2763 | Palestine, Lebanon | Generic pages | Nothing to compare. |
| 5995 | Spain | Yes, TYPO3 login | **Disagree.** Description: one Wednesday session at 20:30. Page: every day 7:00 to 8:06 and 20:30 to 21:36, and Sunday 17:00 to 21:30, on Teams via two short links. Stored shows one sitting a week. |
| 6226 | Iran | No page found | Unknown. |
| 7085 | WhatsApp Spain | No page | No join details anywhere. Contact only. |
| 7348 | Talaka (Netherlands) | Yes, TYPO3 login | **Page has what the description lacks.** Teams link, meeting id, passcode. Length 65 minutes, stored 60. |

Count: 27 comparable. 9 disagree on a sitting or a room. 10 agree. The rest add detail without conflict or could not be compared.

## Other facts worth keeping

- The live API on the audit date was identical to the golden snapshot: same 50 ids, same content.
- `data/golden/listings/` and `data/listings/` are identical apart from JSON formatting.
- Listing 829 (VRI live Anapana) is excluded on purpose in `pipeline/excluded-ids.json`.
- Two listings have no schedule rule by design: 788 (a stream) and 890 (a monthly one-day with no fixed day). Issue #31 covers how they are shown.
- Japan keeps a hand-made table of world online sittings at `https://jp.dhamma.org/os/old-student-support/world-online-group-sittings/`, behind the TYPO3 login, dated 2026-03-29. It lists links, ids, passwords, and local times for 17 hosts. It is the closest thing to a second source, and it can catch a stale description, but it drifts too: it still has Ukraine's old room.
- Santosa, Kunja, Dhara, and Pakasa publish each other's rooms. The West Coast rooms appear on three pages with the same values.
- The site's "No direct link in the listing. Use the host page." text shows for 7085 and 7348 while no host page row is shown, because neither has a centre URL stored.
- The description's "Join Zoom Meeting" text in 907 is not a link. That is a source problem, not an extraction problem.
- Stored 770 and 831 hold the password as `BEHAPPY` in capitals. The description says `behappy`. Origin not traced.

## Open questions for the next session

1. **Which page is the host page per listing.** The listing `url` is the start, but seven hosts keep the schedule one click deeper. Is that a hand-kept override per listing, or a crawl one level down from the listing URL?
2. **Which source wins.** The prompt says the host page. The audit supports that. But the page is often a shared page for several hosts, and sometimes stale itself. Does the extraction get the whole page, or a section?
3. **What to do with the description.** Keep it as the base and the fallback. Rename the panel block so it stops claiming to be a host page.
4. **Logins in the pipeline.** Four wall types, one credential. The credential is public among old students but the pages are meant for them only. The data repo is already private for the same reason.
5. **Link checks.** A dead host page or join link should be named in the run summary each refresh.
6. **One programme, several listings.** Should Nagajjuna's four, Phala's two, and Sarana's two be extracted from one page once, and split after?
7. **The refresh is not scheduled.** Issue #23. Until it runs, nothing above self-corrects.

## Sources

- `pipeline/refresh.ts`, `pipeline/fetch-page.ts`, `pipeline/extract.ts`, `pipeline/prompt.md`, `pipeline/host-pages.json`, `src/schema/listing.ts`, `src/components/SittingDetails.tsx`, `.github/workflows/deploy.yml`.
- `data/golden/api.json` and the live API, compared with `pipeline/hash.ts`.
- Every centre URL and listing URL fetched over HTTP on 2026-09-07, first without and then with the old-student login.
- Web search for the centres whose URLs were dead: santosa, kunja, karuna, sarana, korea, nagajjuna, vridhamma, ae, iran.
