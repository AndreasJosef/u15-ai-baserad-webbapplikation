# Prototype: History view (issue #7)

**Question**: what should the history view — listing past Interview sessions
(transcript + resulting Task Breakdown, per `docs/plan.md` §10) — actually
look like and behave like?

**How to view**: open `history-view.html` directly in a browser (double-click
it, no server or build step needed). Flip between variants with the
bottom-center pill (click the arrows, or use ← / →); the choice is reflected
in the URL as `?variant=a|b|c` so it's shareable.

## Why a static file, not a route on the app

At the time this was built, the repo had no app scaffold yet — no routes, no
task runner, no established convention for a throwaway route. There was
nothing to embed variants into (`prototype/UI.md`'s sub-shape A) and no
routing convention to follow for a new one (sub-shape B). Once the real app
exists, whichever variant wins gets rebuilt properly as a real route/component
against real data — this file doesn't get promoted as-is.

## The three variants

Mock data is five `Session`s, one per interesting `Phase` case (`Defining`
with no `project_title` yet, `Drilling`, `Proposed` but not yet confirmed,
and two `Completed`), per `CONTEXT.md`'s vocabulary.

- **A — Accordion list**: flat, chronological list of sessions; click a row
  to expand it in place, with a Transcript/Task Breakdown tab switch inside.
  Cheapest to build, keeps everything on one page.
- **B — Master-detail split**: a persistent left-hand list plus a full-height
  reading pane on the right (transcript and breakdown shown side by side).
  Best for skimming across many sessions quickly.
- **C — Kanban by phase**: sessions grouped into columns by `Phase`
  (Defining/Drilling/Proposed/Completed) rather than by time; clicking a card
  opens a modal with the transcript/breakdown. Emphasizes "what's in flight"
  over history-as-a-log — arguably answers a different question than "history"
  strictly means, worth discussing.

## Open question surfaced while building this

Should incomplete Interviews (`Defining`/`Drilling`/`Proposed`) be resumable
from the history view, or does an Interview only ever happen in one sitting?
`docs/plan.md` doesn't say. All three variants currently just *display*
in-progress sessions read-only — none of them wire up a "resume" affordance.
Worth deciding explicitly before implementation, since it affects whether the
history view is read-only or also an entry point back into `/interview`.

## Capture

- **Verdict**: Variant A — accordion list.
- **Why**: picked over B (master-detail) and C (kanban by phase) with no further reasoning recorded beyond the direct preference call. Worth asking for the "why" explicitly if this decision is revisited later.
- **Anything stolen from a losing variant**: none noted.
- **Landed as**: `docs/plan.md` §10 (history view bullet expanded); this file's full variant set stays on this throwaway branch, out of `dev`/`main`, per the prototype skill's cleanup step. See issue #7 for the resolution comment.
