# Claude Code setup — Improve the onboarding experience (one time)

**Who:** the Rock's owners (Brent, Bernardo) and anyone who uploads changes.
**Why:** so each person can push changes to the three live docs (`decision-log.md`, `project-brain.md`, `master-plan.md`) without knowing Git. Project chats READ the repo on their own; to WRITE, each person uses their own Claude Code session, set up once with this guide.
**Time:** 10–15 min.

## Step 0 — Shared GitHub account
Everyone uses the same shared Strong Standard GitHub account (`F4LA`, the one on the membership email). No individual accounts, no collaborators. The credential is shared over a secure channel (team password manager) — never pasted in plaintext in a chat, Slack, email, or this repo. If you don't have it, ask Bernardo over that channel.

## Step 1 — Create the folder, then open Claude Code
Create one stable folder for this Rock, named the same as the repo. Bernardo's is at `~/Desktop/onboarding-experience`; put yours wherever you keep your Claude Code projects.

Then open the Claude desktop app (not the browser) → Claude Code, and add that folder to the session. **Only that folder** — if another project folder is also loaded in the same session, Code can end up editing the wrong repo. Reuse this same folder/session every time you upload a change.

## Step 2 — Clone + authenticate (once)
Paste to Claude Code, as is:
> Clone the public repo https://github.com/F4LA/onboarding-experience into this folder and cd into it. If git or the GitHub CLI is missing, install it. Then check whether I can push; if I have no credentials configured, guide me to authenticate once with GitHub CLI via the browser (`gh auth login`). Do not ask for or use tokens in plain text.

Code shows a one-time device code (like `ABCD-1234`) and a `github.com/login/device` link. Open it, sign in with the shared membership account, enter the code, authorize, and tell Code it's done. Once only — the credential stays on your machine.

## Step 3 — Prove push works
Paste to Claude Code:
> In this repo: pull, append a line to `setup-checks.md` with my name, today's date and "setup OK", commit and push to main, and show me the commit hash.

Open `setup-checks.md` on GitHub and confirm your line is there. Then post in Slack: "Setup done, test push OK."

## Day to day (after setup)
1. Work in a Project chat. At close it hands you ready content (Decision Log rows, Project Brain edits).
2. Copy it, open your same Claude Code folder/session, paste it, say "sube esto".
3. Code does pull → apply → push on its own (rules live in `CLAUDE.md`) and returns the commit hash.
4. Paste that hash back into the chat to close.

Never type Git commands yourself, and never paste tokens or passwords anywhere.

## If something fails
- Push rejected / "permission denied" → re-auth in Code: "authenticate me again with gh auth login via the browser," sign in with the shared membership account.
- Auth expired → same as above.
- Code reports conflicts → don't resolve them yourself; screenshot to Bernardo. With people editing different files it should be rare.
- A chat says the memory looks out of date right after you pushed → that's a caching delay, not a failed push. Have the chat re-fetch with a cache-busting query param and continue.
- Anything else → ask Claude Code what happened; if not solved in 5 minutes, Slack Bernardo.
