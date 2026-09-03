# Hone

An app that turns a vague idea ("I should sort out the garage") into concrete Todoist tasks, by relentlessly interviewing the user about it — the discipline of the `/grilling` skill, generalized from coding projects to daily life.

## Language

**Interview**:
The multi-turn, one-question-at-a-time conversation between the user and the app that turns a vague idea into a Task Breakdown. Has two phases — defining what the project actually is, then drilling it into tasks — separated by a Checkpoint.
_Avoid_: chat, session (a Session is the broader technical/persistence concept; an Interview is what happens *within* one)

**Checkpoint**:
The conversational transition point inside an Interview where the app confirms its read of the project ("Sounds like the project is: X — let's break that into steps") before shifting from defining the project to drilling into tasks. A moment in the conversation, not a separate tool call or UI screen.
_Avoid_: phase change, mode switch

**Task Breakdown**:
The structured output of a converged Interview: one top-level project task plus a list of sub-tasks (title, optional description/label/priority/due date), proposed via `propose_task_breakdown` and, once the user confirms and edits it, created in Todoist via `create_todoist_tasks`.
_Avoid_: plan, proposal (ambiguous with the product/pitch sense already used elsewhere in this repo's docs)
