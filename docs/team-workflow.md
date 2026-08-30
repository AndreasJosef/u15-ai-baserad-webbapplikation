# Team workflow

Status: agreed by the team on 2026-08-30, via a `/grilling` session. Update it as the process changes rather than letting it drift out of sync with how you actually work.

This covers **how the five of us work together** day to day: who's in the room for which decisions, how work moves from a vague idea to merged code, and how bugs get handled. It complements `docs/plan.md` (product/architecture decisions, already settled) and the tracker docs in `docs/agents/` (mechanics an agent needs — issue tracker conventions, triage labels, domain doc layout). This doc is written for this project specifically, not as a generic template — lift from it later if it proves out.

## 1. The loop

The skill chain stays the same one you'd use solo: `grilling` → `to-spec` → `to-tickets` → `implement` (which runs `/code-review` and TDD internally) → merge. `diagnosing-bugs` and `triage` sit alongside it for anything that isn't new work. What changes for a team of five is **who's present for which step**, not the steps themselves — implementation is agent-driven and fast enough that splitting it across people doesn't buy you anything; the actual coordination problem is upstream, in the decisions.

## 2. Decision-making: who has to be in the room

- **Architecture-level / high-stakes decisions** (the kind already captured in `docs/plan.md`): a live mob session, whole team or as close to it as you can get. One person drives the CLI, everyone weighs in.
- **Feature-level specs** (the normal case as the project progresses): **paired grilling** — at least two teammates live, any two, it doesn't need to be a specific role. The pair runs `grilling` together straight into `to-spec` and `to-tickets`. The pairing *is* the sign-off — having a second live voice pushing back is what a solo session can't get from itself, so don't bolt an async approval on top of it; that just re-adds the latency pairing was meant to avoid.
- **Solo fallback**: if genuinely nobody else is free, grilling alone is allowed, but the resulting spec then needs an explicit async approval — a comment or reaction from one steady contributor — before `to-tickets` runs. This is the exception path, not the default; use it when it's true, not as a shortcut around finding a second person.
- **Trivial work** (a bug, a small well-understood change) skips grilling and `to-spec` entirely and goes straight to a ticket — see §6 for bugs, and use the same judgment for tiny enhancements: if there's nothing to actually decide, don't manufacture a grilling session for it.

## 3. Ticket splitting & the shared queue

- When running `to-tickets`, treat the blocking edges as a lever for **parallelism**, not just correctness. Aim for a frontier of roughly **2–3 simultaneously startable tickets** at a time, matching the 3 steady contributors — don't just take whatever vertical-slice decomposition falls out by default if a wider cut is available without sacrificing the tracer-bullet rules.
- Tickets are **claimed, not owned**: `ready-for-agent` issues sit in one shared queue on the tracker. Whoever's next available claims one — `gh issue edit <n> --add-assignee @me`, before starting anything, same convention `/wayfinder` uses — purely to stop two people's agents grabbing the same ticket. It is not a sprint assignment; nobody "owns" an area of the ticket queue.
- **Usage budget**: no tracking spreadsheet. Before claiming, do a quick gut-check on your own remaining agent usage for the session, and bias toward a smaller ticket if you're running low. Whoever has headroom takes more or bigger tickets. This is a norm, not infrastructure.
- **Rotation**: nobody should reach the Sep 11 oral defense never having driven a ticket outside one area of the stack (auth, the LLM interview, Todoist integration, UI). Not mechanically enforced — raise it at the standing sync (§4) if the queue looks like it's skewing into silos.

## 4. Cadence

- **Fixed floor**: a short sync every 2–3 days, to catch drift and keep the 2 intermittent contributors oriented. This is not a status-update standup — the bottleneck on a 2-week project is decision moments, not who-did-what.
- **Everything else is event-triggered**: grill together when a spec-sized decision is ready, review together when a PR is up, pull in whoever's needed the moment something's blocked. Don't force a daily ritual onto a project this short.

## 5. From ticket to merged code

- **`main` is always deployable.** Vercel deploys production from it, so nothing lands on `main` that hasn't already been integrated and working on `dev`. `dev` is the shared integration branch tickets land on day to day, and it's the repo's **default branch** — new clones and PRs point there, not `main`.
- One branch per ticket, off `dev`.
- Run `/implement` on the claimed ticket. TDD at pre-agreed seams and the `/code-review` pass both happen automatically as part of that skill — don't add a separate manual pre-review layer on top, that's already the skill's own final step.
- Open a PR **into `dev`**. **At least one teammate other than the driver reviews and approves** before merge — this is also where the rotation/exposure from §3 happens for free, since reviewing a PR is the cheapest way to see code you didn't write.
- **CI must be green before merge** (`.github/workflows/ci.yml`: typecheck + test). It has nothing to run against yet — the first scaffolding ticket needs to add `typecheck` and `test` npm scripts. Until then, CI failing is expected and correct; don't merge around it, add the scripts.
- Merge into `dev` once approved and green.
- **These two gates (green CI, one approval) are a team norm, not a GitHub-enforced one.** The repo is private, and GitHub only enforces branch protection / rulesets on a private repo with a paid plan or by making the repo public — neither of which we've done. Nothing physically stops a merge that skips them; don't skip them anyway. Revisit enforcing this for real if the repo ever goes public or someone's on GitHub Pro.
- **Promoting `dev` to `main`**: whenever `dev` is in a good, demoable state — a natural checkpoint, not after every single ticket — open a `dev` → `main` PR to promote it, which is what actually goes live. Anyone can propose the promotion; it doesn't need an owner. Before the Sep 11 oral defense, `main` must be promoted and verified working, not just `dev`.

## 6. Bugs

- Anyone who finds a bug files it as a GitHub issue with the `bug` label first, for traceability — even if you're about to fix it yourself in the next five minutes.
- If you're fixing it immediately: self-assign, apply `ready-for-agent` directly, skip `needs-triage`, and run `/diagnosing-bugs`. There's no dedicated triage role on a team this size — the discoverer is the fixer by default.
- Only route it through the full `/triage` state machine (`needs-triage` → …) if you genuinely can't resolve it on the spot: it needs someone else's input, or it's a real "is this in scope" judgment call.

## 7. Handoff

With 2 intermittent contributors, someone will start a ticket and need to step away before it's done. Before signing off mid-ticket, leave a one-paragraph comment on the issue describing state and next step. For anything meatier, run `/handoff` and link the resulting doc from that comment instead of retyping it. Most of the time there's nothing to hand off, since tickets are sized to one context window — but that's a judgment made on the way out, not an assumption.

## 8. Explicitly out of scope

The "agent ledger" idea sketched in `ideas.md` (a shared lock/mutex layer so concurrent agents can't collide on the same files) is **not** part of this project's workflow. Tracer-bullet ticket slicing already minimizes file overlap by design, at most 3 people run agents concurrently, and building a coordination ledger is itself a project — don't spend the two weeks you have solving that instead of the assignment. Worth revisiting for a bigger, longer-running effort later.

## 9. Where things live

- Tracker mechanics (creating/reading/labelling issues): `docs/agents/issue-tracker.md`.
- Triage label vocabulary: `docs/agents/triage-labels.md`.
- Domain docs (`CONTEXT.md`, ADRs — created lazily as terms/decisions land): `docs/agents/domain.md`.
- Product/architecture decisions: `docs/plan.md`.
- This doc: the team-facing process that ties those together. Read it alongside `docs/plan.md`, not instead of it.
