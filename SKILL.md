---
name: poetry
description: Write, revise, critique, translate, or workshop poems in Chinese or English; use for poem drafting, poetic line edits, form constraints, imagery, rhythm, voice, and literary taste calibration.
---

Use this skill when the user wants poetry work: composing a poem, revising lines, judging poetic quality, translating poetry, imitating or avoiding a style, building a poetics, or collecting examples for taste calibration.

For Chinese regulated verse requests, especially `五绝`, `七绝`, `五律`, `七律`, `近体诗`, `平水韵`, `平仄`, `对仗`, `步韵`, `和诗`, `题诗`, or old-poem revision, load `forms/jintishi.md` before drafting. That file overrides the general defaults for scope, workflow, reports, and quality gates.

When a regulated-verse request needs checker/tool support, also load `tools/souyun-checker.md`. Use it as an external verification protocol for Sou-yun-style checks; do not copy proprietary Sou-yun databases or imply that a local clone exists unless the user has supplied a legitimate API, export, or licensed dataset.

## First Move

Identify the job before writing:

- **Draft**: create a new poem from a subject, mood, image, form, or occasion.
- **Revise**: improve an existing poem while preserving its live center.
- **Critique**: diagnose what works, what fails, and what to try next.
- **Translate**: carry the poem's pressure, movement, and music across languages.
- **Study**: extract craft principles from examples, notes, or a poet's body of work.

If the user gives too little direction, make one confident draft choice and proceed. Ask only when the missing choice would change the poem's basic identity: language, occasion, form, or whether to imitate a living poet.

For a bare regulated-verse prompt such as “帮我写一首七绝”, ask at most three questions, then proceed with reasonable defaults from `forms/jintishi.md`.

## Working Rule

Prefer concrete pressure over explanation. A poem should move through image, turn, rhythm, omission, and discovery; commentary is secondary unless the user asks for it.

## Project Map

- `poetics/`: taste, standards, recurring principles, and taboos.
- `forms/`: constraints for fixed forms, meters, stanza shapes, and experiment templates.
- `corpus/`: source poems, admired examples, anti-examples, and reading notes.
- `prompts/`: reusable task prompts and workshop protocols.
- `examples/`: finished samples produced with this skill.
- `drafts/`: working drafts that may change often.
- `notes/`: meeting notes, decisions, vocabulary, and open questions.
- `tests/`: checklists and evaluation rubrics for poem quality.
- `tools/`: external checker protocols, tool adapters, and integration boundaries.

Load the relevant file only when that branch needs it. Keep durable rules in the narrowest folder that owns them.

## Defaults

- For Chinese poems, default to modern Chinese unless the user asks for classical style.
- For English poems, default to contemporary free verse unless the user names a form.
- Avoid decorative abstraction when a precise image can do the work.
- Do not explain the poem before the poem unless the user asks for process notes.
- When revising, preserve the strongest image, turn, or emotional pressure before changing surface style.

## Output Shapes

- **Draft**: title if useful, poem only, then a short note if needed.
- **Revision**: revised poem first, then 2-4 high-signal changes.
- **Critique**: strengths, weak spots, next revision move.
- **Translation**: translation first, then brief notes on hard choices.
- **Study**: extracted principles with citations or source references when available.
