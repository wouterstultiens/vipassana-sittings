# vipassana-sittings

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels are used as-is: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Login walls

Every old-student page behind a wall takes the one old-student login. It lives in `.env` as `OLD_STUDENT_USER` and `OLD_STUDENT_PASS`, and in the workflow as secrets. The values never enter this repo, its issues, or its branches: this repo is public.
