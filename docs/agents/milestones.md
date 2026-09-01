# Milestones: GitHub Milestones

Milestones are tracked as GitHub Milestones in this repo, with issues attached to them as they're created — not a separate planning doc a milestone could drift out of sync with. See `docs/team-workflow.md` §9 for when/why the team uses them and who decides on defining or closing one.

## Conventions

`gh` has no dedicated `gh milestone` subcommand — go through `gh api` for anything beyond attaching an issue.

- **Create a milestone**: `gh api repos/<owner>/<repo>/milestones -f title="..." -f state="open" -f due_on="<ISO8601>" -F description=@<file>` (use `-F description=@<file>` for a multi-line description; a short one can go inline with `-f description="..."`).
- **List milestones**: `gh api repos/<owner>/<repo>/milestones --jq '.[] | {number, title, state, due_on, open_issues, closed_issues}'`
- **Read one milestone**: `gh api repos/<owner>/<repo>/milestones/<number>`
- **Update a milestone** (e.g. edit its description or due date): `gh api repos/<owner>/<repo>/milestones/<number> -X PATCH -f description="..." -f due_on="..."`
- **Close a milestone**: `gh api repos/<owner>/<repo>/milestones/<number> -X PATCH -f state="closed"`
- **Attach an issue to a milestone**: `gh issue create --milestone "<title>" ...` at creation time, or `gh issue edit <n> --milestone "<title>"` after the fact. `gh issue edit <n> --remove-milestone` detaches it.
- **List a milestone's issues**: `gh issue list --milestone "<title>" --state all`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## When a skill or doc says "file it as a milestone"

Create (or reuse) the GitHub Milestone by title via `gh api`, and attach issues to it with `--milestone` as they're created through the normal `grilling` → `to-spec` → `to-tickets` flow. Don't pre-create issues just to seed the milestone — it should hold real, already-scoped tickets, not placeholders.

## Define one at a time

Per `docs/team-workflow.md` §9, don't chart the whole milestone sequence up front. Define the next milestone once the current one is reached, or clearly in sight.
