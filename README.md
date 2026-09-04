# Vipassana Sittings

A public research and planning repo for a website that helps Vipassana
practitioners find virtual group sittings.

The first product goal is a safe viewer for recurring virtual group sittings:

- Search by language, country, weekday, and time of day.
- Show times in the user's local time zone.
- Link back to official source pages.
- Mark old-student-only sittings clearly.

## Privacy Rule

Many virtual group sittings are only for old students in the S. N. Goenka
tradition. This repo must not publish meeting links, meeting IDs, passcodes,
passwords, shared old-student credentials, or copied descriptions that include
those details.

The public app should show safe metadata and source links only.

## Current Status

This repo is in research mode. No tech stack is selected yet.

Research notes:

- [Vipassana virtual group sittings research](docs/research/vipassana-virtual-sittings.md)

## Source API

The current primary source candidate is:

```bash
curl -L -s 'https://www.dhamma.org/api/v1/events/virtual'
```

Use a redacted projection when exploring:

```bash
curl -L -s 'https://www.dhamma.org/api/v1/events/virtual' \
  | jq 'map({
      id,
      name,
      event_type,
      schedule,
      languages: .event_instruction_languages,
      country: .sub_location.country,
      timezone: .sub_location.time_zone,
      source_url: .url,
      center_url: .sub_location.url,
      ics_url
    })'
```

## License

No license has been selected yet.
