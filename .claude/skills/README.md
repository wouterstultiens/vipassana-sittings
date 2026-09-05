# Skills

Matt Pocock's agent skills, vendored from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

- Version: `1.2.3`
- Source commit: `3cca18b368ae95cdbdebbff572ccafa662551015`
- Installed: the 25 skills listed in the upstream `mattpocock-skills` plugin manifest (`skills/engineering/*` + `skills/productivity/*`). The upstream `misc/`, `in-progress/`, and `deprecated/` buckets are deliberately excluded, as they are upstream.
- Per-skill `agents/openai.yaml` files were dropped; they target Codex, not Claude Code.

These are editable files we own. To pull upstream changes, either re-vendor from the
commit above or run `npx skills@latest add mattpocock/skills`.

Repo configuration for these skills lives in `CLAUDE.md` and `docs/agents/`,
written by `/setup-matt-pocock-skills`.
