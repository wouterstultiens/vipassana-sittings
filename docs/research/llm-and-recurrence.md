# Research: Claude Haiku structured output and a recurrence representation

Resolves issue #4 (part of map #1). Verified on 2026-09-04 against primary sources. Prices are USD.

## 1. Claude Haiku model id and pricing

**Facts**

- Latest Haiku is Claude Haiku 4.5. Pinned id `claude-haiku-4-5-20251001`, alias `claude-haiku-4-5`. Released 2025-10-15. Retirement not sooner than 2026-10-15. Context 200K tokens, max output 64K. ([Haiku 4.5 model page](https://platform.claude.com/docs/en/models/haiku-4-5/overview), [models overview](https://platform.claude.com/docs/en/models/overview))
- Price: $1 / MTok input, $5 / MTok output. Cache write $1.25 (5 min) or $2 (1 h), cache read $0.10. Batch API gives 50% off both directions. ([pricing](https://platform.claude.com/docs/en/about-claude/pricing))
- Haiku 4.5 uses the older tokenizer. Rough rule from the pricing page: 1 token is about 4 characters; a 10 kB web page is about 2,500 tokens.
- For comparison, Sonnet 5 costs $2 / $10 and Opus 5 $5 / $25. Sonnet 5's $2 / $10 is now the standard price (the September 2026 increase was cancelled).

**Cost estimate**

Assumptions per listing: HTML description 1 to 9 KB (average 4 KB, so about 1,000 tokens; worst case about 2,250), plus name, schedule, timezone and other API fields (about 300 tokens), plus a fixed system prompt with instructions and the output schema (about 2,000 tokens). Output: a JSON object with rules, platform, summary and join data, about 600 tokens (worst case 1,000). The pipeline copies `description` from the API into the record itself; the model must not echo it back.

| Run | Input tokens | Output tokens | Cost |
| --- | --- | --- | --- |
| Full run, 50 listings, average | 50 × 3,300 = 165K | 50 × 600 = 30K | $0.17 + $0.15 = **about $0.32** |
| Full run, 50 listings, worst case | 50 × 4,550 = 228K | 50 × 1,000 = 50K | $0.23 + $0.25 = **about $0.48** |
| Daily run, 3 changed listings | 3 × 3,300 = 10K | 3 × 600 = 1.8K | **about $0.02** |
| One year of daily runs at 3 changes per day | | | **about $7** |

Prompt caching and the Batch API would each cut this further, but at this volume they add complexity for cents. Not worth it.

**Recommendation**: use `claude-haiku-4-5-20251001` (pinned, so output stays stable until we change it on purpose). Budget under $0.50 per full run and under $1 per month for the daily job. Put the pinned id in one constant.

## 2. Schema-validated JSON from the Claude API in TypeScript

**Facts**

- Structured outputs are GA. The request carries `output_config.format = { type: "json_schema", schema }`. No beta header is needed any more (the old `structured-outputs-2025-11-13` header and `output_format` field are only accepted for a transition period). `claude-haiku-4-5-20251001` is in the supported model list. ([structured outputs](https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs))
- The same page describes a second, complementary feature: strict tool use (`strict: true` on a tool). That is for agent loops, not for one-shot extraction.
- JSON Schema limits that matter for our schema: objects need `additionalProperties: false`; `enum` and `const` work; `anyOf` works; string `format` supports `date-time`, `time`, `date`, `duration`, `uri`; `minimum`/`maximum`, `minLength`/`maxLength`, `pattern` and recursive schemas are **not** supported. So a rule like "start time is `HH:MM`" must be a `format: "time"` string or a plain string that we check after parsing.
- Compiled grammars are cached for 24 hours from last use; the first request after a schema change is slower.
- The official TypeScript SDK (`@anthropic-ai/sdk` 0.123.0) ships `zodOutputFormat` in `@anthropic-ai/sdk/helpers/zod` and `client.messages.parse()`. `parse()` returns `parsed_output` typed from the Zod schema, and it runs `safeParse` on the response, so the API's grammar and Zod's runtime check both apply. ([helpers.md](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md), [src/helpers/zod.ts](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/helpers/zod.ts))
- `zodOutputFormat` calls `z.toJSONSchema(...)`, which is the Zod 4 API. The SDK's optional peer dependency is `zod: ^3.25.0 || ^4.0.0`. Use Zod 4. ([package.json](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/package.json))
- The SDK strips unsupported keywords and adds `additionalProperties: false` before sending the schema. Constraints you write in Zod (`.min()`, `.regex()`) still run in the local `safeParse`, so they are not lost, they are just not enforced by the model's grammar.

**Recommendation**: define the listing schema once in Zod 4, send it with `zodOutputFormat`, call `client.messages.parse()`, and treat a thrown parse error as the validation failure that keeps the old entry and fails the workflow (as decided in #1). Do not use tool use for this; it costs extra system-prompt tokens (496 on Haiku 4.5) and adds nothing for one-shot extraction. Keep the same schema object for validating the golden dataset, so both paths share one source of truth.

## 3. Representing schedule rules

**Options**

1. iCalendar RRULE strings expanded with `rrule` (2.8.1, 13.1 kB gzip, one dependency `tslib`). ([bundlephobia](https://bundlephobia.com/package/rrule), [npm registry](https://registry.npmjs.org/rrule/latest))
2. A custom object: weekdays, local start time, duration, IANA timezone.
3. Both: the object as the source of truth, RRULE only as an export format.

**Facts about `rrule` and timezones**

- The README says the library supports `TZID` through the Intl API, but then: "Returned 'UTC' dates are always meant to be interpreted as dates in your local timezone. This may mean you have to do additional conversion to get the 'correct' local time with offset applied." The docs' own example converts every result with Luxon. ([README](https://github.com/jkbrzt/rrule#timezone-support))
- Luxon was removed as a dependency in 2.7.0 (2022-06-05); nothing in the changelog up to 2.8.1 mentions a DST fix. ([CHANGELOG](https://github.com/jkbrzt/rrule/blob/master/CHANGELOG.md))
- Open issues about DST with `tzid` still exist: #610 (2023), #390, #359, #336, #295. Issue #550 (closed) shows a daily rule in `America/Denver` shifting from 06:00 to 05:00 local after the autumn transition on 2.7.1. ([issues](https://github.com/jkbrzt/rrule/issues?q=is%3Aissue+tzid+dst), [#550](https://github.com/jkbrzt/rrule/issues/550))
- The API gives each listing a `sub_location.time_zone`, and the LLM must extract weekdays and a wall-clock time from free text. Our rules are all "these weekdays at HH:MM local, for N minutes". No monthly, yearly, or "second Tuesday" rules have appeared in the snapshot.

**Recommendation**: option 2, the custom object. Store per rule `{ weekdays: ["MO","WE"], start: "06:00", durationMinutes: 60, timeZone: "Asia/Kolkata" }`. Expansion is then trivial and correct by construction: for each day in the window, build the wall-clock start in the rule's zone with a timezone-aware date type (section 4), then convert to the visitor's zone. Daylight saving is handled per rule because the wall-clock time is always resolved in the rule's own IANA zone. This avoids `rrule`'s floating-date footgun, its 13 kB, and its open DST issues. The LLM also produces this object more reliably than an RRULE string, and the JSON schema can enforce the weekday enum. If a genuine RRULE ever becomes necessary, generate the string from this object; do not parse strings from the model.

## 4. Timezone conversion and expansion in the browser

| Library | Version | Gzip | Deps | Notes |
| --- | --- | --- | --- | --- |
| `@date-fns/tz` | 1.5.0 | 2.0 kB (TZDate 1.2 kB, TZDateMini 916 B per README) | 0 | `TZDate` extends `Date` ([source](https://github.com/date-fns/tz/blob/main/src/date/index.js)), does all maths in the given IANA zone via Intl, handles DST, `tzScan` lists DST transitions. Works with or without `date-fns` v4. ([README](https://github.com/date-fns/tz), [bundlephobia](https://bundlephobia.com/package/@date-fns/tz)) |
| `luxon` | 3.7.2 | 21.9 kB | 0 | IANA zones via Intl. Documented gap: ambiguous times in the autumn fall-back hour are "undefined". ([zones docs](https://github.com/moment/luxon/blob/master/docs/zones.md), [bundlephobia](https://bundlephobia.com/package/luxon)) |
| `Temporal` (built in) | ES2026, Stage 4 March 2026 | 0 | 0 | Chrome/Edge 144+, Firefox 139+, Opera 131+; Safari only in Technology Preview, no iOS Safari. Global usage 71.34% on caniuse. `ZonedDateTime` handles IANA zones and DST natively with explicit disambiguation. ([caniuse](https://caniuse.com/temporal), [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)) |
| `temporal-polyfill` | 1.0.4 | 19.8 kB | 2 | Needed for Safari until it ships. ([bundlephobia](https://bundlephobia.com/package/temporal-polyfill)) |
| `@js-temporal/polyfill` | 0.5.1 | 45.2 kB | 1 | Reference polyfill; larger. |

**Recommendation**: `@date-fns/tz` today. It is 2 kB, dependency-free, Intl-based, and enough for "build 06:00 on Wednesday in Asia/Kolkata, then read it in the visitor's zone". Worldwide old students include many iPhone users, and Safari does not ship Temporal, so Temporal without a 20 kB polyfill is not an option yet. Revisit when Safari ships Temporal; the expansion code is small, so a later swap is cheap. Do not add `luxon`; it is ten times larger for the same Intl-based zone maths.

## 5. Generating a calendar file for one sitting in the browser

| Option | Version | Gzip | Deps | Browser | Notes |
| --- | --- | --- | --- | --- | --- |
| `ics` | 3.12.0 | 22.2 kB | 3 direct (`yup`, `nanoid`, `runes2`), 7 total | Yes, ESM; README shows the Blob-download pattern | Times as arrays or ms timestamps; `startInputType` local/utc, `startOutputType` utc or floating. No `TZID` support. ([README](https://github.com/adamgibbons/ics), [bundlephobia](https://bundlephobia.com/package/ics)) |
| `ical-generator` | 11.1.1 | 9.4 kB | 0 (optional peers for date libs) | Engines field says Node 22 / 24; docs are server-oriented | Supports `timezone` on an event and VTIMEZONE via an extra package. ([README](https://github.com/sebbo2002/ical-generator), [registry](https://registry.npmjs.org/ical-generator/latest)) |
| Hand-written VEVENT | none | about 0.3 kB | 0 | Yes | A single-event file is about 15 lines of RFC 5545 text. |

**Recommendation**: write the file by hand. One sitting is a single `VEVENT` with `DTSTART`/`DTEND` in UTC (`Z` suffix), `SUMMARY`, `DESCRIPTION` with the join link, `URL`, `UID`, and `DTSTAMP`. UTC times need no `VTIMEZONE` block, and every calendar app converts to the user's zone. Lines must be CRLF-terminated and folded at 75 octets; escape `,` `;` `\` and newlines in text fields. Serve it with `new Blob([text], { type: "text/calendar" })` and an `<a download>` click. This is less code than configuring `ics`, saves 22 kB, and has no schema-validation or nanoid dependency. Export one occurrence, not a recurring event: the join link and password can change, and the site is the source of truth.

## Summary of recommendations

1. Model: `claude-haiku-4-5-20251001`, about $0.32 to $0.48 per full run of 50 listings, about $0.02 per daily run.
2. Output: `output_config.format` via `zodOutputFormat` (Zod 4) and `client.messages.parse()`. No tool use, no beta header.
3. Schedule rule: custom object `{ weekdays, start, durationMinutes, timeZone }`. No `rrule`.
4. Browser dates: `@date-fns/tz` (2 kB). Temporal later, once Safari ships it.
5. Calendar export: hand-written single `VEVENT` in UTC, downloaded as a Blob.
