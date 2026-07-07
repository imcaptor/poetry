# Poetry Skill

This is the working home for the poetry skill. Keep future changes here so the project can grow without scattering rules across the workspace.

## Structure

- `SKILL.md` is the invocation and operating contract.
- `poetics/` holds taste, standards, taboos, and craft principles.
- `forms/` holds fixed-form rules and reusable constraints.
- `corpus/` holds poems, reading notes, admired examples, and anti-examples.
- `prompts/` holds reusable prompts and workshop protocols.
- `examples/` holds finished outputs worth keeping.
- `drafts/` holds unstable working drafts.
- `notes/` holds planning notes and decisions.
- `tests/` holds rubrics and quality checks.

## Maintenance

When a rule becomes durable, move it out of chat and into the smallest file that owns it. When a draft becomes a reference example, copy it from `drafts/` to `examples/` with a short note on why it is worth keeping.
