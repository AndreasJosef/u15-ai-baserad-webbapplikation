# Stack research notes

Background research done during planning (2026-08-30) to inform the decisions in `docs/plan.md`. Facts below were current as of that date — re-verify anything version- or pricing-sensitive before relying on it late in the project.

## 1. Todoist API for task creation

**Bottom line:** Use a personal API token for the whole project — zero setup, no expiry, no OAuth review needed. The API is unified under `/api/v1/` (REST v2 and the old Sync v9 have been merged/superseded). Tasks fully support parent/child sub-tasks, labels, priority, and natural-language due strings. An official Doist TypeScript SDK exists, but it's thin enough that plain `fetch` calls against REST are equally viable and arguably clearer for a grading rubric that wants visible tool-calling logic.

**Auth options:**
- **Personal API token**: generated instantly from Todoist Settings → Integrations, used as a `Bearer` header. Never expires unless manually revoked. Zero review process. This is what we're using.
- **OAuth app**: requires registering an app at developer.todoist.com (client_id/secret), a 3-step authorization-code flow, and refresh-token handling since access tokens expire after 1 hour. Scopes are coarse (`task:add`, `data:read`, `data:read_write`, `data:delete`, `project:delete`, `backups:read`). Meaningfully more plumbing for no benefit given our per-user personal-token model.
- Source: https://developer.todoist.com/api/v1/

**Task structure:**
- Fields available on task create/update: `content` (title, max 500 chars), `description`, `project_id`, `section_id`, `parent_id` (this is how sub-tasks work), `labels` (array, max 100/task), `priority` (1–4), `due_string` (natural language, parsed server-side), `due_date`/`due_datetime` (ISO 8601), `assignee_id`, `duration`+`duration_unit`.
- Sub-tasks are a first-class, flat mechanism (any task can point at any other task's `parent_id`) — good fit for our one-level project→sub-task structure.

**Rate limits:** ~1,000 requests / 15-minute window per token. Trivial to stay under for an interview-to-tasks flow.

**SDK:** Official TypeScript SDK `@doist/todoist-sdk` on npm (renamed from `@doist/todoist-api-typescript`; repo: https://github.com/Doist/todoist-sdk-typescript). Requires Node ≥20.18.1. Reasonable convenience layer, but calling REST directly from a TanStack Start server function is just as easy and keeps the LLM tool-call → HTTP call mapping transparent.

## 2. OpenRouter tool/function calling

**Bottom line:** Tool calling is **not universal** — it's per-model/per-endpoint, so check `supported_parameters` before picking a model (filter at https://openrouter.ai/models?supported_parameters=tools). Streaming + tool calls work together. Recommended: **Claude Sonnet 4.6** as primary (quality-first per our interview design), **Gemini 2.5 Flash** as a cheap swap for dev iteration.

**Uniformity / model support:**
- OpenRouter exposes an OpenAI-compatible tool-calling format uniformly at the API level, but whether a given model actually accepts `tools` depends on the model/provider.
- **Gotcha**: `openai/gpt-4o-mini`'s OpenRouter endpoint explicitly does **not** accept `tools` (https://openrouter.ai/openai/gpt-4o-mini), despite gpt-4o-mini supporting function calling on OpenAI's own API directly. Always verify per-model on OpenRouter specifically, never assume from the model's native provider docs.
- OpenRouter has an "Exacto" routing mode aimed at maximizing tool-calling accuracy (vs. "Balanced"/"Nitro" for price/speed). See https://openrouter.ai/docs/guides/features/tool-calling
- `parallel_tool_calls` (default on) controls whether the model can request multiple tool calls in one turn.

**Streaming + tools:** Confirmed supported — tool-call fragments appear in streamed delta chunks, standard OpenAI-style handling applies.

**Candidate models & pricing (per 1M tokens, as of Aug 2026):**

| Model | Input | Output | Tool calling | Notes |
|---|---|---|---|---|
| Gemini 2.5 Flash (`google/gemini-2.5-flash`) | $0.30 | $2.50 | Yes | cheap/fast dev default |
| GPT-4.1 Mini (`openai/gpt-4.1-mini`) | $0.40 | $1.60 | Yes | alt cheap option |
| GPT-4o-mini (`openai/gpt-4o-mini`) | $0.15 | $0.60 | **No** on OpenRouter | unusable for our tool-calling requirement |
| Claude Sonnet 4.6 (`anthropic/claude-sonnet-4.6`) | $3.00 | $15.00 | Yes | our primary model — 1M context |
| Open models (GLM 5.3 Flash, Qwen 3.8 Flash) | $0.05–0.15 | $0.17–0.47 | Listed as tool-capable | reliability for tool-calling less proven, verify empirically |

For our expected volume (a few hundred sessions, each ~5–15k tokens plus a handful of tool calls), total cost is realistically single-digit dollars even on Sonnet 4.6. Budget is not the binding constraint — tool-call formatting reliability is.

**Vercel AI SDK integration:** `@openrouter/ai-sdk-provider` (https://github.com/OpenRouterTeam/ai-sdk-provider) is the official/community-maintained provider, requires `ai@^7.0.0` and Node ≥22, ESM-only. Use `createOpenRouter({ apiKey })` then pass the model into `streamText()`/`generateText()` with a normal `tools: { ... }` object (Zod schemas + `execute` functions) — works cleanly through this provider, including streaming, and exposes OpenRouter's usage-accounting extension for token tracking.

## 3. TanStack Start maturity

**Bottom line:** Release Candidate — "feature-complete and its API is considered stable" per the official docs, not yet formally 1.0. Safe to build a course project on. Server functions are first-class and exactly what's needed to keep the OpenRouter key server-side. Vercel is the lowest-friction deploy target.

**Release status:** https://tanstack.com/start/latest/docs/framework/react/overview states RC stability explicitly, with 1.0 "expected relatively soon." Package version numbers (e.g. `@tanstack/react-start` in the 1.16x range) don't map to semver-1.0 the way other ecosystems do — trust the docs' explicit RC statement over the version number.

**Server functions for secret-key handling:** Yes — RPC-style functions that only ever execute server-side; the function body (including `process.env.OPENROUTER_API_KEY` usage) never ships to the browser bundle. This is our mechanism for routing OpenRouter calls. Integrates with TanStack Query's cache and TanStack Router's data loading. See https://tanstack.com/start/latest/docs/framework/react/guide/server-functions

**Deployment targets:**
- **Vercel** (our choice) — officially detected/auto-configured, full Node.js compatibility, integrated previews. https://vercel.com/docs/frameworks/full-stack/tanstack-start
- **Netlify** — official plugin `@netlify/vite-plugin-tanstack-start`; needs `netlify-cli` ≥17.31.
- **Cloudflare Workers** — official Vite plugin; not full Node.js runtime, check npm dependency compatibility before choosing this path.
- **Node.js/Docker** — plain Node server via Nitro/Rsbuild output, most "boring/reliable" for a grading demo.
- **Bun** — only supported with React 19+.

**Rough edges:** No hard evidence of specific bugs found; the main practical risk is pre-1.0 API churn. Two docs-stated caveats: (1) the Nitro Vite plugin for non-Vercel deployment "is still under active development"; (2) cross-check code samples against the live `tanstack.com/start/latest` docs rather than older blog posts, since the RC has a fast release cadence.
