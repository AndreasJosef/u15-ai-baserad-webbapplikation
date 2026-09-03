# Project plan

Working name: **Hone** (placeholder — search-replace if the team lands on something else).

Status: design agreed, no code written yet. This doc is the shared understanding reached during planning on 2026-08-30 — update it as decisions change rather than letting it drift out of sync with reality.

## 1. Vision

Generalize the discipline of the `/grilling` skill — relentless, branching interviews that turn a fuzzy idea into a concrete plan — from coding projects into daily life. A user brings a vague feeling ("I should sort out the garage," "I want to get healthier"); the app drills with them, first converging on what the project actually *is*, then keeps drilling until it has arrived at concrete units of work, which it pushes into Todoist as real tasks.

This framing directly answers the assignment's required reflection: a static todo app or form can't do the active, adaptive questioning that turns vague intent into a well-scoped project — that's the part that specifically needs an LLM, not a template or regex.

## 2. Assignment fit

See `docs/assignment.md` for the full brief. Grading strategy:

- **Godkänt bar**: met via the LLM interview + Todoist tool-calling, AI-assisted development throughout, and documented/commented code.
- **VG bar**: targeted via genuine tool-calling (two real tool calls in the flow, not just JSON parsing dressed up as "AI") and deliberately-authored system prompts (see §6–7), rather than RAG (no retrieval corpus exists in this product shape, so it wasn't forced in).
- The three required reflection questions in the root `README.md` should be filled in once the app is actually built — draft answers are stubbed there now based on this plan, to be firmed up against what we actually shipped.

## 3. Team

Group of 5. No further workflow process defined here — this doc covers product/architecture decisions, not task assignment; see `docs/team-workflow.md`.

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend/full-stack framework | TanStack Start (RC), TypeScript | "Big language" per assignment tip; server functions keep the OpenRouter key off the client; see `docs/research.md` |
| Hosting | Vercel | Officially auto-detected for TanStack Start, lowest-friction path to a public demo URL |
| Database | Supabase (Postgres) | Backs accounts, Todoist tokens, and interview history |
| Auth | Better Auth, tables unified into the same Supabase Postgres schema as the app's own tables; email+password only for MVP | Real per-user accounts; ADR-0001 covers why Better Auth over Supabase Auth's RLS-based approach |
| UI / styling | Tailwind CSS + shadcn/ui | Fastest path to a consistent look with 5 people touching UI code independently |
| LLM gateway | OpenRouter | One integration surface, model-swappable via env var |
| Primary model | `anthropic/claude-sonnet-4.6` | Interview quality is an explicit priority; cost is trivial at our volume (see `docs/research.md`) |
| Dev/cheap model | `google/gemini-2.5-flash` | Swap in via env var for cheap iteration during development |
| Task destination | Todoist REST API v1, personal API token per user | No OAuth review overhead; tokens stored per-account |

## 5. Todoist integration

- Each user pastes their own Todoist personal API token into their account settings (stored server-side, associated with their user row — not client-visible after entry).
- A breakdown maps to **one level of hierarchy**: a top-level task (the project) with sub-tasks nested under it via Todoist's `parent_id`. No deeper nesting.
- Labels, priority, and due dates are available fields on the tool schema (see §7) but not mandatory — the model decides what's relevant per breakdown.

## 6. Interview design

- **Multi-turn, one question at a time** — a real conversation, not a form.
- **Spirit of grilling, not its literal mechanics**: the system prompt enforces the *discipline* (never settle for a vague answer, keep drilling until a thread is actually resolved, converge explicitly before moving on) without exposing meta-concepts like "frontier" or numbered rounds to the end user.
- **Starts from a vague idea, not a pre-defined project**: the first phase of the conversation is about figuring out what the project actually is. Only once that's reasonably well-defined does the interview shift into decomposing it into tasks.
- **Light checkpoint between phases**: a natural conversational transition ("Sounds like the project is: X — let's break that into steps") marks the shift from "defining the project" to "drilling into tasks." This is not a separate tool call or UI screen — just a deliberate moment in the conversation where the user can correct a misread goal before turns get sunk into the wrong specifics.
- System prompt(s) for the interviewer are to be drafted using the `writing-for-agents` skill.

## 7. Tool-calling architecture

Two distinct, real tool calls — this is the core of the VG tool-calling story:

1. **`propose_task_breakdown`** — fired by the model once the interview has converged. Structured args: top-level project task + list of sub-tasks (title, optional description/label/priority/due date). Result is rendered to the user as an editable review UI, *not* sent to Todoist yet.
2. **`create_todoist_tasks`** — fired only after the user explicitly confirms (and possibly edits) the proposal. This is the one that actually hits the Todoist API and has a real external side effect.

Splitting these keeps "the model thinking" (propose) cleanly separate from "the model acting" (create), and gives two genuine, demonstrable tool-calls instead of one.

## 8. Review & edit UX

Between the two tool calls, the user sees a **fully editable** table of the proposed breakdown: rename tasks, change due date/priority, add or remove tasks, before clicking confirm. This is the actual trust/verification mechanism for the whole product — a review step that could only accept-or-reject wholesale wouldn't meaningfully catch AI mistakes.

## 9. Data model / persistence

Supabase stores:
- User accounts (via Better Auth or equivalent).
- Each user's Todoist personal API token.
- **Full interview transcripts** (every Q&A turn, not just the final result) plus the resulting task breakdown, per session — surfaced as a history/dashboard.

Storing full transcripts (not just final breakdowns) is a deliberate choice made now, even though the features it enables are stretch/backlog — retrofitting capture later would mean losing all data from before the retrofit.

## 10. MVP scope (target: presentable by Sep 11)

- Accounts (sign up / log in).
- Connect a Todoist personal API token.
- Interview: vague idea → checkpoint → task drilling → `propose_task_breakdown`.
- Review/edit UI for the proposed breakdown.
- Confirm → `create_todoist_tasks` → real tasks appear in the user's Todoist.
- History view listing past sessions (transcript + resulting breakdown).
- A deliberately well-crafted system prompt, not a generic chatbot wrapper.
- **Error-handling bar**: no silent failures — the user always sees that something went wrong and can retry — but no retry/backoff logic, offline handling, or polished empty/error-state design. Keeps every ticket's effort consistent given the 8-day runway.

## 11. Stretch backlog (only if time remains after MVP)

- **Memory / retro / follow-up system**: use stored transcripts to check in later ("how did the garage project go?") or inform future interviews with context from past ones.
- **Semantic search over past interviews**: embeddings-based search/pattern-finding across a user's history of projects — notably, this would also let the write-up speak to the "embeddings" track the assignment brief itself suggests, on top of the tool-calling/system-prompt story already covered by the MVP.
- Editing polish, richer Todoist fields (labels/priority defaults), multi-level task nesting if Todoist's model is revisited.

## 12. Timeline

- **Today**: 2026-08-30. Plan agreed, no code yet.
- **2026-09-11**: oral presentation — app must be in presentable (MVP) shape.
- **2026-09-14, 23:59**: final submission deadline (GitHub repo + README with reflection, submitted via Canvas).

## 13. Open items / risks

- TanStack Start is RC, not 1.0 — expect possible minor API churn; pin versions and re-check docs against `tanstack.com/start/latest` if something behaves unexpectedly (see `docs/research.md`).
- The README reflection answers are currently drafts based on this plan (see root `README.md`) — revisit them once the app is actually built, especially "why AI was needed" and "what would we have done differently," which should reflect real experience, not just the plan.
- No app name has been chosen yet.
