# Claude Code setup — Improve the onboarding experience (one time)

**Who:** the Rock's owners (Brent, Bernardo) and anyone who uploads changes.
**Why:** so each person can save changes to the three live docs (`decision-log.md`, `project-brain.md`, `master-plan.md`) without knowing Git. Project chats READ the repo on their own; to SAVE, each person uses their own Claude Code session, set up once with this guide.
**Time:** 15–20 min.

## Step 0 — Get the shared GitHub login
Everyone uses the same shared Strong Standard GitHub account (`F4LA`, the one on the membership email). No individual accounts, no collaborators. Ask Bernardo for it through the team password manager — never over Slack, email, or a chat.

## Step 1 — Create the folder FIRST, then open Claude Code
Create one stable folder for this Rock before you open anything. Name it exactly like the repo: `onboarding-experience`. Desktop is fine. This same folder gets reused every time you save a change, so remember where it is.

Then open the **Claude desktop app** (not the browser) → Claude Code, and add that folder to the session.

**Only that folder.** If a second project folder is loaded in the same session, Code can clone into the wrong one or edit the wrong repo — this happened on the first install. If you see another folder listed, remove it or start a fresh session.

## Step 2 — Clone the repo
Paste to Claude Code, as is:
> Clone the public repo https://github.com/F4LA/onboarding-experience into this folder and cd into it. If git is missing, install it. Then show me the absolute path of the repo and its remote URL.

**Check the path it reports.** It must end in `/onboarding-experience`, and it must NOT be nested inside some other project's folder. If it landed in the wrong place, tell Code: *"Move the repo so it lives directly at [correct path], remove the old copy, and cd into the new location."*

## Step 3 — Confirm you can push
Paste to Claude Code:
> Check whether I can push to this repo. If I have no credentials configured, guide me to authenticate once with GitHub CLI via the browser (`gh auth login`), installing it first if needed. Do not ask for or use tokens in plain text.

Two possible outcomes, both fine:
- **You already have credentials** (saved in your Mac keychain from earlier work) — Code will verify a push works and you skip ahead.
- **You don't** — Code shows a one-time device code (like `ABCD-1234`) and a `github.com/login/device` link. Open it, sign in with the shared account from Step 0, enter the code, authorize, and tell Code it's done. Once only.

## Step 4 — Set your name on your commits
This is not cosmetic. Everyone pushes from the same shared GitHub account, so the name on the commit is the **only** thing recording who made each change. Skip it and the history is anonymous.

Paste to Claude Code, with your own name and work email:
> Set my git identity globally: user.name "YOUR NAME" and user.email "your@email.com". Then show me the configured identity.

## Step 5 — Prove the full cycle works
Paste to Claude Code:
> In this repo: pull from main first, then append one line to setup-checks.md with my name, today's date and "setup OK", following the format in the comment at the top of that file. Commit and push to main. Show me the commit hash.

Then open https://github.com/F4LA/onboarding-experience/blob/main/setup-checks.md and confirm your line is there. Post in Slack: "Setup done, test push OK."

That test is the real thing: pull → edit an existing file → push. It's the same cycle you'll run every time.

## Day to day (after setup)
1. Work in a Project chat. At close it hands you ready-to-paste content (Decision Log rows, Project Brain edits).
2. Copy it, open your same Claude Code folder/session, paste it, say "upload this" / "sube esto".
3. Code does pull → apply → push on its own (rules live in `CLAUDE.md`) and returns the commit hash.
4. Paste that hash back into the chat to close.

Never type Git commands yourself, and never paste tokens or passwords anywhere.

## If something fails
- **Push rejected / "permission denied"** → re-auth in Code: "authenticate me again with gh auth login via the browser," sign in with the shared account.
- **Code cloned into the wrong folder** → tell it the correct absolute path and have it move the repo and remove the old copy.
- **Commits show the wrong name** → redo Step 4.
- **Code reports conflicts** → don't resolve them yourself; screenshot to Bernardo. With people editing different files it should be rare.
- **A chat says the memory looks out of date right after you pushed** → that's a caching delay, not a failed push. Have the chat re-fetch with a cache-busting query param and continue.
- **Anything else** → ask Claude Code what happened; if it isn't solved in 5 minutes, Slack Bernardo.

## One thing this guide does NOT cover
Don't ask the Rock Project for setup help. It runs the Rock's work; it doesn't know these steps and it's told never to touch GitHub. Use a plain Claude chat (or Claude Code itself) for anything setup-related.
