# MVP wayfinder kickoff

Scratch note, not a mechanics doc — the exact line to open `/wayfinder`
with when someone (ideally a pair, per `docs/team-workflow.md` §2) sits
down to chart the MVP. Delete this file once that session has actually
happened and the map/root spec exist on the tracker; it's a kickoff
prompt, not a doc to keep in sync afterward.

> Find the way to: the MVP in docs/plan.md §10, built end-to-end and
> demoable by Sep 11. Stack, tool-calling split, review UX, and data
> model are already decided (see plan.md §4-9) — treat those as settled,
> not open. Out of scope: stretch backlog (§11).

Seeding the settled decisions up front means wayfinder's frontier round
should only surface genuine fog — likely the interview state machine /
system prompt structure, the DB schema, auth wiring, and exact Todoist
tool-call schemas, per §6-9 of the plan.

The resulting map's `/to-spec` output becomes the MVP root spec — see
`docs/agents/milestones.md` for how that folds together with the
already-filed `Submission` GitHub Milestone.
