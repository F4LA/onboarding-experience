# Master Plan — Improve the onboarding experience
**Company:** Strong Standard   **Rock owner:** Brent (co-lead: Bernardo)   **Sprint:** S3-2026 (July 27 – September 13, 2026)   **Go-live:** Monday, September 14, 2026

## What this is
The full task layout for this Rock: every project, milestone and task, its owner, dependencies, and execution order per person. Source of truth for *why* is the Decision Log. This file changes only when the plan itself changes, logged as a decision first. Rules: one task = one chat; specs approved before building; dates are the theoretical-minimum floor and get recalculated as work happens.

Support on this Rock: Sprint (incoming Head Coach) and Miguel Salas (AI automation infrastructure). The work is a network, not a line — milestones with no dependency between them and different owners run in parallel. Each task carries its own owner (Brent / Bernardo / Both); "Both" means a joint decision, usually done live or through a Loom exchange.

## Definition of Done
Historical data analyzed and baselines established; onboarding problems solved; new Google Form intake (with address field) replacing the current one; welcome email restructured; AI automation for roadmap and kickoff presentation; 100% of coaches adopted; t-shirt + handwritten note fulfillment defined with an inventory/shipment dashboard; and measurement system live.

---

## Project 1 — Baseline Data and Measurement System
**Objective:** Establish historical baselines and set up ongoing measurement that keeps collecting post-sprint.

### M1 — Historical satisfaction data validated as usable
Owner: **Brent** · Duration: 1 working day · Depends on: none
- Analyze whether the historical onboarding satisfaction questionnaire data is useful. Check for bias (e.g. clients scoring higher because they fill it out in front of the coach). Confirm trustworthy before using as baseline. Raw data: https://docs.google.com/spreadsheets/d/1ULtKCuLxZ6GriLkVs08UezPpK8mcnqwFoLa412oMA7k/edit · V2 questionnaire: https://docs.google.com/document/d/1h4oDUgtgp0o2yb8o-7kYIO8nAWN2LSAG-fjFGwnozaM/edit — *Brent*

### M24 — V2 questionnaire (post-kickoff + Day-2) live and collecting data
Owner: **Both** · Duration: content ready now; Bernardo's verify + build TBD · Depends on: none
- Content drafted and ready now (post-kickoff check-in + Day-2 follow-up). — *Brent*
- Verify the V2 questionnaire and build it into a live Google Form. — *Bernardo*

> Per D-007, this replaces the historical-data pull as the input to M2 task 1's overwhelm score baseline.

### M2 — Baselines locked + refund target % set in the KPI
Owner: **Both** · Duration: 1 working day (5 tasks in parallel) · Depends on: M1
- Collect V2 questionnaire data live; baseline computed once sufficient data exists. — *Brent*
- Pull historical refund rate post-kickoff. Compute baseline, set target %. **[needs master-sheet access]** — *Bernardo*
- Pull historical first end-of-meso extension rate. Compute baseline. — *Bernardo*
- Validate the overwhelm questionnaire item — is the phrasing measuring what we think? Adjust if needed. Raw data: https://docs.google.com/spreadsheets/d/1ULtKCuLxZ6GriLkVs08UezPpK8mcnqwFoLa412oMA7k/edit · V2 questionnaire: https://docs.google.com/document/d/1h4oDUgtgp0o2yb8o-7kYIO8nAWN2LSAG-fjFGwnozaM/edit — *Brent*
- Lock the refund rate target % into the Rock KPI section. — *Both*

### M3 — Targeted feedback collected from last 8 post-kickoff clients
Owner: **Brent** · Duration: ½ day of work + 3–4 days of reply wait · Depends on: M2
- Reach out to the last 8 clients right after their kickoff. Ask closed-ended questions testing our hypotheses (e.g. "Was the long-term plan overwhelming?"). Not open-ended. Outreach email: https://docs.google.com/document/d/1NdjHH5NCXOquNIZUw-2n2PTEWKaM-5Am-JNeeq83SMM/edit — *Brent*

> **Wait:** replies take 3–4 days. During that wait, both owners are free to advance other work.

### M4 — Ongoing measurement cadence defined and running
Owner: **Both** · Duration: ½ day + a 30-minute meeting · Depends on: M3
- Define ongoing cadence: overwhelm question in the post-onboarding check-in, refund rate per client, extension rate at First End-of-Meso. Document where each metric lives (temporary storage is fine for now). — *Both*

---

## Project 2 — Intake Redesign and Welcome Email Flow
**Objective:** Rebuild the intake to reduce friction and capture usable signal; restructure the welcome email into one clean entry point.

### M5 — Intake audited (KEEP/SIMPLIFY/CUT) and structural decisions locked
Owner: **Both** · Duration: 3 days (1 day of work + Loom exchange + buffer) · Depends on: none
- Audit the current intake question by question: CRUCIAL / KEEP-BUT-SIMPLIFY / CUT. Reference the meal-schedule question that added friction. Each does their own audit first (no bias). Brent's audit: https://docs.google.com/document/d/1tIXUOA4hd0LVVDU0hQbkSaVmERnpycp8-o6l5ZJkHqA/edit — *Both*
- Design the struggles section as a check-box list with ranking, replacing the open-ended narrative. Include concrete items (veggie servings, protein, sleep, consistency, tracking). DRAFT — not yet locked, pending Bernardo's audit + Loom exchange: https://docs.google.com/document/d/1DwAdAdw2GuSKE7pxaja82dEHfvPpVTGuuGGjokMjQUA/edit — *Brent*
- Add lifestyle-phase pre-personalization data: hobbies, activities the client enjoys, activities they can no longer do (e.g. "used to play basketball"). Each proposes, then merge. DRAFT — not yet locked, pending Bernardo's audit + Loom exchange: https://docs.google.com/document/d/1DwAdAdw2GuSKE7pxaja82dEHfvPpVTGuuGGjokMjQUA/edit — *Bernardo*
- Record and send a Loom walking through your own audit; exchange Looms, resolve differences by message (escalate to a call only if there is real disagreement). — *Both*

### M6 — New intake questionnaire built on Google Form (forward-compatible schema)
Owner: **Bernardo** · Duration: ½ day · Depends on: M5
- Build the new questionnaire on Google Form. **[needs Miguel if infra]** — *Bernardo*
- Design the storage schema so answers land forward-compatible with the future unified client + coach dashboard (the dashboard itself is out of scope — the goal is no rework later). — *Bernardo*
- Keep the ADDRESS field in the new form, and it is REQUIRED, not optional — locked by D-008 (the shipment dashboard has no other way to get a client's address). **[CROSS-DEP: Project 5 — the shipment dashboard depends on this to know where to ship]** — *Bernardo*

### M7 — Welcome email restructured to single entry + sales script updated + 24h rule
Owner: **Bernardo** · Duration: 1 day · Depends on: M5
- Design the welcome email around Everfit's automatic one, which cannot be disabled (D-016). "Single entry point" means the client gets one email that tells them what to do, not that only one email arrives. The 24-hour intake-completion rule (D-015) goes in the email the client is expected to act on, and must not be split across both. — *Bernardo*
- Restructure to ONE welcome email: (a) intake link, (b) next steps in order — intake → schedule kickoff → app. Single direct entry point. — *Bernardo*
- Update the sales call closing script for the new flow. Coordinate with Emery so the closer knows what to say once live. — *Bernardo*

> **Gap:** the milestone title promises a "24h rule" that none of the three tasks defines. See Open decisions in the Project Brain.

---

## Project 3 — Kickoff Call Redesign and Coach Calibration
**Objective:** Rebuild the kickoff presentation (condensed, phase-anchored) and calibrate every coach to the new standard.

### M8 — Kickoff call audited (KEEP/IMPROVE/DELETE) and structural decisions locked
Owner: **Both** · Duration: 3 days (task 2 is a live meeting, + buffer) · Depends on: none
- Brent and Bernardo audit the kickoff presentation and process end-to-end. Produce KEEP/IMPROVE/DELETE. Also flag content not essential to the live call that could move elsewhere (e.g. a short in-app video). Each audits on their own first. Brent's audit: https://docs.google.com/document/d/17WQAbF7Br_2EsoneSCTcof1gTZEMyBJRmvsgGmjqJso/edit — *Both*
- Decide the structural changes: condense the roadmap to ONE compact overview by phase with timeframes. Lock (a) total timeframe shown, (b) detail vs. preview, (c) sequencing. **[LIVE MEETING]** — *Both*
- Include case studies near the end, before the extension conversation. Brent builds 4–6 avatars; Bernardo picks the case studies per avatar. Avatar framework (in progress): https://docs.google.com/document/d/1ZnVTd8jP7uoLjpr4VxtufA8TWYPLdmnNimc00hBSbx0/edit — *Both*

> When both owners finish their own audit (task 1), the structural-decision meeting gets scheduled for the next day.

### M9 — Format decided (Slides vs HTML) and new presentation template built
Owner: **Both** · Duration: 2 days · Depends on: M8
- Evaluate Google Slides vs. interactive HTML (dropdowns, whole journey in one view). Investigate feasibility, then decide. — *Both*
- Build the new presentation template in the chosen format. Also feeds Project 4. — *Bernardo*

### M10 — Onboarding + kickoff SOP updated with competency questionnaire
Owner: **Brent** · Duration: 1 day · Depends on: M8
- Update the SOP to reflect the new structure. Include a post-completion competency questionnaire per coach. — *Brent*

### M11 — All 4 coaches calibrated via 1-on-1 practice and passed competency
Owner: **Brent** · Duration: 4 days (including scheduling the coaches) · Depends on: M10
- 1-on-1 calibration + practice with each coach: the coach picks a past client, rebuilds the presentation with the new system, runs it live with Brent. Brent gives feedback. — *Brent*
- Each coach completes the competency questionnaire before running live kickoffs. — *Brent*

> **Framing to hold throughout:** the lifestyle phase is NOT the end of coaching — it's the tools to maintain results long-term. Roadmap accuracy is a belief-builder: projections accurate enough that hitting week 24 matching the projection reinforces trust.

---

## Project 4 — AI Automations (Roadmap + Kickoff Presentation)
**Objective:** Automate generating the client roadmap and pre-populating the kickoff presentation with client-specific content and case studies.
**Lead:** Bernardo
**Design principle:** Heavy automation with constraints, but the coach guides input and reviews output before it reaches the client. AI drafts; coach approves or iterates.

### M12 — Design framework locked (approach + metrics + formula/tiers + constraints)
Owner: **Both** · Duration: 2 days (live meeting) · Depends on: none
- Decide the technical approach (Claude agent, script, or third party). Lead: Bernardo. — *Bernardo*
- Agree on key progress metrics for the roadmap (pounds as primary — clients understand pounds over percentages). Lock the list. **[LIVE MEETING]** — *Both*
- Define the formula/framework for the roadmap: rate-of-progress tiers (slow/moderate/aggressive) mapped to phase types. **[LIVE MEETING]** — *Both*
- Define output structure and constraints: max per phase, sequencing rules (e.g. mandatory diet break every X weeks, never maintenance before fat-loss), default moderate. Coach can override per phase. **[LIVE MEETING]** — *Both*

> The source plan places this live meeting on September 1 while estimating the milestone closes in late August, ahead of a build that depends on it. See Open decisions in the Project Brain — the meeting date needs resolving before the build starts.

### M13 — Inputs configured (personality signals from sales call)
Owner: **Deferred** · Duration: deferred · Depends on: M12
- Give the automation a way to read personality/capability signals (from the sales call recording) to advise the coach how much detail to present per client. **[DEFERRED — needs Brent's input on defining personality types; only build if ahead of schedule, or once Andy joins]** — *deferred*

### M14 / M15 — Roadmap + Kickoff presentation automations live and validated
Owner: **Bernardo** · Duration: 5 days (both combined) · Depends on: M6, M9, M12
- Build the roadmap generation automation with the constraints. Coach fills inputs; AI drafts; coach accepts or regenerates. — *Bernardo*
- Build the case study selection logic: client profile (age, composition, goals, timeline, persona) → best-matched case study from a curated library. Feeds the kickoff presentation. — *Bernardo*
- Build the kickoff presentation generation automation. Same coach-guides-then-AI-drafts flow; the coach can adjust any piece. — *Bernardo*

---

## Project 5 — T-shirt and Handwritten Note Fulfillment
**Objective:** Add a physical touchpoint — branded t-shirt + handwritten note from Joey — shipped to every new client, run through an inventory/shipment dashboard.
**Note:** The only project in the Rock eligible to be cut if capacity slips. The note ships from the US and must be from Joey.

### M16 — In-house fulfillment approach approved with operator identified
Owner: **Brent** · Duration: 1 day · Depends on: none · **Order samples ASAP once approved**
- Approve in-house fulfillment from Tampa (Joey's house; operator: Joey's wife, paid, Joey as backup). Approval required before downstream tasks. Brent talks to Joey. **[APPROVAL]** — *Brent*
- Lock cost-per-client and confirm budget approval. — *Both*

### M17 — T-shirt supplier locked (sample approved) + note template ready
Owner: **Brent** · Duration: 5 days (+ shipping wait) — CRITICAL · Depends on: M16
- Order sample t-shirts so Brent can review quality/design/fit before a bulk order. Order early — the shipping wait is the bottleneck. — *Brent*
- Source supplier: unit cost, sizing, minimum order, turnaround. Confirm brand alignment. Design kept simple (Strong logo). — *Brent*
- Draft the handwritten note template. Joey writes it; personalization limited to the client name. **[NOTE: Joey]** — *Brent*

> **Wait:** samples must physically arrive before quality can be judged and the supplier locked. The plan names this shipping wait as the bottleneck of this project.

### M18 / M19 — Inventory & shipment dashboard built
Owner: **Both** · Duration: 5 days · Depends on: M6 (address field)
- Build the inventory + shipment dashboard as one system. It: (a) surfaces the weekly shipment trigger ("ship a shirt to this client this week") based on the shipment logic — which clients, when, respecting the refund grace period, batched weekly not daily; (b) lets the operator mark shipped / not shipped and which size; (c) feeds that back into inventory counts; (d) tracks stock level and fires a restock notification (to Gabby / Joey's wife / VA) when stock hits a set threshold. Pulls the client address from the new intake form. **[needs Miguel; CROSS-DEP: M6 address field]** — *Both*

### M20 — First batch shipped to a real cohort of new clients
Owner: **Both** · Duration: 3 days + ~10–14 day order wait — CRITICAL PATH · Depends on: M18/M19, M17
- Place the first order (~50 t-shirts, mixed sizes: ~40% XL, ~40% L, rest M). Define the size distribution. — *Brent*
- Once stock arrives, ship the first batch (shirt + note) to the next cohort of new clients as a live test — batched, once per week, after the grace period. — *Both*
- Message the clients who received the first batch: let them know something was sent to their address and ask them to confirm when it arrives (first-time validation of the system). — *Bernardo*

> **Wait:** the ~50-shirt order takes an estimated 10–14 days to arrive. The plan names this the longest wait in the Rock — start the approval and supplier milestones early so it doesn't block the batch.

---

## Project 6 — Team Rollout and Adoption
**Objective:** Move the coaching team to the new onboarding cleanly, go-live September 14, 100% adoption verified.
**Note:** The go-live date is already set and the change is announced at the coaching call on July 30 — so the separate "announce" milestone is already handled and was removed from the plan.

### M22 — Adoption tracked + coach feedback loop + kickoff timing rule locked
Owner: **Both** · Duration: 2 days (post go-live) · Depends on: M9, M11
- Brent and Bernardo each review 2 kickoff calls per coach, on their own (day 1). — *Both*
- Feedback loop (day 2): Brent records a Loom for Bernardo → Bernardo replies with a Loom (agree / adjustments / extra feedback / disagreements) → Brent records a Loom per coach with the consolidated feedback. — *Both*
- Lock the kickoff timing rule into practice: ideal within 72h of signup, standard 5–7 days, contract start = 7 days from signup, kickoff BEFORE contract start; refund eligibility requires kickoff within 7 days; if the start is delayed (e.g. travel) the kickoff shifts with it. Coordinate with Emery on how it's set at the end of the sales call. Lock this once the new presentation exists and we've tested how fast the flow really is. **[coordinate w/ Emery]** — *Both*

### M23 — End-of-sprint retro completed with carry-overs captured
Owner: **Both** · Duration: 1 day (meeting) · Depends on: M22
- End-of-sprint retro: what worked, what didn't, carry-overs into the next sprint. **[LIVE MEETING]** — *Both*

> The source plan dates this meeting September 15 while estimating its dependency closes September 16–17. See Open decisions in the Project Brain.

---

## Execution order per person

### Brent
1. **Approval conversation with Joey** (M16) — no dependency. Do this first: behind it sit the bottleneck of the t-shirt project (samples must physically arrive before the supplier can be locked) and then the longest wait in the Rock (the ~50-shirt order, 10–14 days).
2. **Order the sample t-shirts, then source the supplier and draft the note template** (M17) — needs the approval. Order the samples the day the approval lands; do the sourcing and the note template while the samples travel.
3. **Validate the historical satisfaction data** (M1) — no dependency. Unblocks the whole baseline project.
4. **Overwhelm score baseline + validate the questionnaire wording** (M2) — needs M1.
5. **Design the struggles check-box section** (M5) — no dependency; slot it into any wait.
6. **Build the 4–6 avatars for the case studies** (M8) — no dependency; feeds Bernardo's case-study picks.
7. **Reach out to the last 8 post-kickoff clients** (M3) — needs baselines locked. Fire it and move on; replies take 3–4 days.
8. **Update the onboarding + kickoff SOP with the competency questionnaire** (M10) — needs the kickoff audit closed.
9. **Calibrate all 4 coaches 1-on-1 and run the competency questionnaire** (M11) — needs the updated SOP. Start scheduling coaches while writing the SOP.
10. **Place the first t-shirt order** (M20) — needs the supplier locked.

### Bernardo
1. **Propose the automation technical approach** (M12) — no dependency; you lead this one. The metrics, tiers and constraints are the joint live meeting, not yours to pre-decide.
2. **Propose the lifestyle-phase pre-personalization data** (M5) — no dependency.
3. **Pick the case studies per avatar** (M8) — needs Brent's avatars.
4. **Refund rate + first end-of-meso extension rate baselines** (M2) — needs M1, and needs master-sheet access. Request that access now so it isn't a surprise blocker.
5. **Build the new intake questionnaire on Google Form, with the forward-compatible schema and the ADDRESS field** (M6) — needs the intake audit. Two things wait on this: the automations and the shipment dashboard.
6. **Restructure the welcome email to a single entry point and update the sales closing script with Emery** (M7) — needs the intake audit.
7. **Build the new presentation template** (M9) — needs the format decision. Also feeds the automations.
8. **Build the roadmap automation, the case-study selection logic, and the kickoff presentation automation** (M14/M15) — needs the intake form, the presentation template, and the design framework. Longest single block of build work in the Rock.
9. **Message the first-batch clients to confirm arrival** (M20) — needs the batch shipped.

### Both (joint sessions — live or Loom exchange)
1. **Intake audit: each audits alone, then exchange Looms and resolve by message** (M5) — no dependency. Escalate to a call only on real disagreement.
2. **Kickoff audit: each audits alone** (M8) — no dependency. When both finish, schedule the structural-decision meeting for the next day.
3. **Kickoff structural-decision meeting** (M8) — live; needs both audits.
4. **Lock cost-per-client and budget for fulfillment** (M16) — alongside Brent's approval conversation.
5. **Lock the refund-rate target % into the KPI section** (M2) — needs both baseline pulls.
6. **Presentation format decision: Slides vs HTML** (M9) — needs the kickoff audit.
7. **Automation design framework meeting: metrics, tiers, output constraints** (M12) — live; resolve the meeting date first (see the note on M12).
8. **Define and stand up the ongoing measurement cadence** (M4) — needs the client feedback; ½ day plus a 30-minute meeting.
9. **Build the inventory + shipment dashboard** (M18/M19) — needs the address field live in the new form; needs Miguel.
10. **Ship the first batch** (M20) — needs the dashboard and stock on hand.
11. **Review 2 kickoff calls per coach, then run the Loom feedback loop, then lock the kickoff timing rule** (M22) — needs the presentation template and all four coaches calibrated. Runs after go-live.
12. **End-of-sprint retro** (M23) — needs the adoption review closed.

---

## Cut order if capacity slips
**Project 5 — t-shirt + handwritten note + fulfillment dashboard — is the ONLY element eligible to be cut.** Highest effort, lowest measurable impact within the sprint window. Every other project and task is load-bearing and must ship — no downscoping.

---

## Deferred / post-sprint (do not lose)
- **Personality-signal inputs for the automation** (M13) — circle back at the end of the sprint if ahead of schedule; needs Brent's input to define the personality types. Or once Andy joins.
- **End of Mesocycle presentation automation** — full extension of Project 4 covering the EoMC call. Revisit after the kickoff + roadmap automation is stable.
- **Small pre-renewal "act of kindness"** — a short note the week before asking for renewal.
- **Interactive HTML follow-ups on the roadmap** — only if we ship Google Slides this sprint.
