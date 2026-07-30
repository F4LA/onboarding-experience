# Improve the onboarding experience — Strong Standard

Shared memory of the "Improve the onboarding experience" Rock (sprint S3-2026, go-live September 14, 2026). This repo (branch `main`) is the single source of truth for the three project documents. Any Google Docs are frozen and point here.

**Rock owner:** Brent · **Co-lead:** Bernardo

## The three documents
| File | What it is | Update rule |
|------|-----------|-------------|
| decision-log.md | Every decision, one row, append-only. Supersedes all other documents. | New rows at the top. Never edit old rows (except marking "Replaced by D-XXX"). |
| project-brain.md | Living state: phase, done, in progress, blocked, next. | Updated at the close of any chat that changes status. |
| master-plan.md | Full task layout: tasks, owners, dependencies, execution order. | Only when the plan itself changes (logged as a decision first). |

## Workflow
- **Chat start:** every Project chat reads the three files directly via their public raw URLs — no GitHub API, no token.
- **Chats never write:** a chat produces the content of a change and hands it back; the person uploads it with their own Claude Code session, which does pull → edit → push on `main` following `CLAUDE.md`.
- Documents are pure Markdown — no HTML, no GitHub Pages.
- Task deliverables do NOT live here. Each one is a single live Google Doc in the Rock's Drive folder, linked from its Decision Log row.

## Setting up
New to this? Read `setup-claude-code.md` — one-time, 10–15 minutes. When your test push works, append your line to `setup-checks.md`.
