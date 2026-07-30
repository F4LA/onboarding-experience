# CLAUDE.md — Improve the onboarding experience repo

This repo is the single source of truth for the "Improve the onboarding experience" Rock (Strong Standard, sprint S3-2026). It holds three live documents:
- `decision-log.md` — every decision, one row each, append-only.
- `project-brain.md` — the current state of the project.
- `master-plan.md` — the full task layout. Changes only via a logged decision.

Your job: receive change content (usually pasted from a Project chat) and apply it safely. The person pastes text and says "upload this" / "sube esto". You handle all Git mechanics — they never should.

## Non-negotiable workflow
1. Always `git pull` on `main` BEFORE touching any file. No exceptions.
2. Apply the change with targeted edits only. Never rewrite or regenerate a whole document — edit exactly what was handed to you and nothing else. If the pasted content conflicts with what's already in the file (e.g. a decision ID already taken), STOP and tell the person before editing.
3. Always commit and push immediately after editing. An unpushed change does not exist for the team.
4. After pushing, report the commit hash and a one-line summary of what changed.

## Rules per document

### decision-log.md
- New rows go at the TOP of the table, directly under the header.
- Never edit or delete an old row, except changing Status to "Replaced by D-XXX" when superseded.
- IDs are sequential. Read the top row to confirm the last used ID — never invent one. If the pasted ID isn't the next sequential ID, flag it before committing.
- Columns: ID | Date | Decision | Context (2–3 lines max) | Who | Status.
- The log carries plan-level decisions (dates, cut order, rules that govern the whole Rock), not design decisions internal to a single milestone — those live in `master-plan.md`.

### project-brain.md
- Update only the sections that changed (Current phase / Status / Done / In progress / Next up / Blocked / Deferred / Open decisions / Key dates).
- Always update the "Last updated" line (date + who) in the same edit.

### master-plan.md
- Only accepts changes backed by a Decision Log row. If asked to change it without a D-XXX, ask for the decision ID first.

## Scope
Only the three live documents plus repo infrastructure (`CLAUDE.md`, `README.md`, `setup-claude-code.md`, `setup-checks.md`). Do not add other artifacts — deliverables live in Google Drive on purpose.

## Commit messages
Short and specific, referencing decision IDs when applicable. Examples: `Add D-007 (refund target locked)` · `Brain: intake audit done` · `D-004 marked Replaced by D-011`.
