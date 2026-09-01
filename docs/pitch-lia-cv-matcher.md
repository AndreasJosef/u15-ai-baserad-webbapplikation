# Pitch: LIA / job-ad CV matcher

Working name: TBD.

Status: captured via a `/grilling` session on 2026-09-01, on branch `grilling/lia-cv-matcher` — a teammate's proposal (raw capture in `ideas.md`) grilled to spec-depth as an **alternative to `docs/plan.md`** (the currently agreed plan), for comparison at a whole-team mob session per `docs/team-workflow.md` §2. This session was solo (one driver; the idea's originator wasn't live in the room), and the normal pairing/async-approval sign-off doesn't apply here because this doc isn't headed into `to-tickets` — it exists to be decided *between*, not committed to, by the whole team. Nothing here is adopted, and nothing in `docs/plan.md` is superseded by it.

## 1. Vision

A tool for LIA/internship search: paste your CV, search or paste job/LIA ads, and get a structured fit comparison per ad — match score, matching skills, missing skills, cover-letter angles — instead of manually re-reading each ad against your own background. Positioned as a "promising companies finder" rather than strictly "LIA ad matcher," since literal LIA-tagged postings are scarce in practice (see §6).

## 2. Relationship to `docs/plan.md`

This is not an addition to the Todoist-breakdown app — it's a distinct product idea for the same assignment, meant to be evaluated *instead of* it, not alongside it in the shipped product. Both ideas reuse the same already-researched tech stack (§3), so the stack choice doesn't need to be reopened regardless of which one the team picks.

## 3. Tech stack

Reused as-is from `docs/plan.md` §4: TanStack Start (TypeScript) on Vercel, Supabase/Postgres, Better Auth, OpenRouter with Claude Sonnet as primary model.

## 4. Interaction shape

Form/dashboard, not conversational: structured search fields plus a paste-CV box, results as a list, comparison triggered per ad. Deliberately not interview-style — the adaptive, drilling interview UX is the sibling pitch's whole differentiator, and duplicating it here would blur the two ideas together if the team wants to compare them side by side rather than pick blind.

## 5. CV handling & PII

- CV is pasted as plain text (file upload is out of scope for MVP).
- `parse_cv` (LLM) extracts a structured profile from the raw text — a real AI parsing step, not just a text field.
- Raw CV text is discarded once parsed; only the structured profile is persisted, to minimize stored PII.
- Baseline per-user auth/RLS scoping (Better Auth + Supabase, already implied by having accounts) is the PII safeguard for MVP. No separate encryption-at-rest or delete-my-data control is planned for MVP.
- The profile is stored once and reused across every ad comparison, not re-entered each time.

## 6. Job-ad sourcing

- `search_job_ads` — a real tool call against the free [JobTech Dev JobSearch API](https://jobsearch.api.jobtechdev.se/) (Arbetsförmedlingen's Platsbanken). Uses broad occupation/keyword search rather than the API's narrow `trainee` filter, since literal LIA-tagged ads are scarce in practice — `compare_match` (§7) does the actual suitability judgment regardless of formal tagging.
- Manual paste is kept as a fallback input path for ads the API doesn't carry (e.g. a company's own careers page).
- No API key appears to be required for this API; worth a final confirmation against its docs at implementation time, not a design blocker.

## 7. Core comparison

`compare_match`: structured JSON output per ad,

```
{ matchScore, matchingSkills[], missingSkills[], suggestedCoverLetterPoints[] }
```

This is structured output (JSON mode), not a tool call with a side effect — worth keeping that distinction precise in the assignment's required reflection write-up, alongside the real tool calls in §6 and §9.

## 8. Multi-ad ranking

Real embeddings-based ranking via Supabase pgvector (embed the CV profile and each ad, cosine-similarity rank) — not an LLM call fed all ads in context relabeled as "embeddings." Directly exercises the embeddings track the assignment brief itself suggests.

## 9. MVP scope (target: presentable by Sep 11, same deadline as `docs/plan.md`)

- `search_job_ads` (tool call, real external API).
- `parse_cv` (structured extraction).
- `compare_match` (structured comparison output) per ad.

## 10. Stretch backlog (only if time remains after MVP)

Roughly in this order:

1. Embeddings-based multi-ad ranking (§8).
2. `save_ad` — Supabase write, a real side effect, direct analog of the sibling pitch's `create_todoist_tasks`.
3. `draft_cover_letter` — generative, based on a saved match result.
4. Memory/trend-insight feature — surfaces patterns across a user's saved comparisons (e.g. "you're missing skill X across your last 3 saved ads"), the analog of the sibling pitch's memory/retro stretch idea.
5. Contact-discovery module: given a company domain and a contact name the *user* already found (not auto-discovered), construct a best-guess email from common corporate naming patterns — no live scraping, clearly labeled in the UI as an unverified guess, one target at a time. Deliberately scoped narrow: no automated discovery of a specific person's identity, no bulk lookups.

## 11. Tool-calling / AI-technique tally

For the assignment's VG bar: one real external-API tool call (`search_job_ads`), one structured-extraction call (`parse_cv`), one structured-comparison call (`compare_match`), real embeddings (§8, stretch), a generative call (`draft_cover_letter`, stretch), and a memory-style stretch feature — a broader spread of distinct AI techniques than the sibling pitch's two Todoist tool calls, which was the "fun features" gap this pitch was grilled to close.

## 12. Open items / risks

- JobTech Dev API auth/rate-limit specifics unverified beyond a quick doc check during this session — confirm before building §6.
- No app name chosen.
- Whether the team picks this over `docs/plan.md` is undecided — see status line above.
