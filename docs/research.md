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

## 4. JobTech Dev JobSearch API

**Bottom line:** The `/search` endpoint is callable anonymously today — no API key, header, or token needed; verified both by reading the live OpenAPI spec (no `securityDefinitions`) and by firing bare `curl` requests at `/search`, `/ad/{id}`, and `/complete` from this environment, all returning `200`. This contradicts the getting-started doc's "you need a key to authenticate yourself" framing, and an older (2019, v1.1) Terms-of-Use PDF describes a formal registration process with GDPR consent and manual key issuance — worth flagging as a documentation/reality mismatch, but since live behavior is open access, the Sep 14, 2026 deadline risk from a multi-day key-approval process appears low. No documented rate-limit numbers exist beyond a generic `429` error code. Ad data is CC0-licensed per the current OpenAPI spec and the open-data catalog, so server-side storage, ranking, and embeddings generation from ad text/metadata are not restricted by license terms (the older 2019 T&C mentioned CC-BY-SA instead — flagged as a possible discrepancy, but the current authoritative source says CC0). The `/search` endpoint supports rich free-text and taxonomy-based structured filtering, including an explicit `trainee` boolean and an `employment-type` taxonomy filter, both directly relevant to a LIA/trainee-style job matcher.

**Auth:**
- Live test: `curl "https://jobsearch.api.jobtechdev.se/search?q=test&limit=1"` (no headers at all) returns `HTTP/1.1 200 OK` with real ad results; same for `/ad/{id}` and `/complete`. Verified directly against the live API, Sep 1, 2026.
- The live OpenAPI/Swagger spec (`GET https://jobsearch.api.jobtechdev.se/swagger.json`) declares no `securityDefinitions` and no global `security` requirement on any path — nothing in the machine-readable contract requires a key. Source: `https://jobsearch.api.jobtechdev.se/swagger.json`.
- The official getting-started guide nonetheless says: "The easiest way to try out the API is to go to the Swagger-GUI... But first you need a key to authenticate yourself." Source: `https://gitlab.com/arbetsformedlingen/job-ads/jobsearch/jobsearch-api/-/blob/main/docs/GettingStartedJobSearchEN.md`. This may be legacy text left over from when a formal key process was enforced (see next point) — current behavior does not match it.
- An archived (2021-07-27) snapshot of the key-request page shows a manual sign-up flow: fill in a form (name, org, app description, which API), tick acceptance of "Allmänna villkor" (general terms v1.1, dated 2019-09-23), and Arbetsförmedlingen processes the request and emails a key — not instant self-serve, and no documented SLA for turnaround time. Source: `http://web.archive.org/web/20210727204804/https://apirequest.jobtechdev.se/`. The live `apirequest.jobtechdev.se` and `jobtechdev.se` hosts did not resolve from this research environment, so this could not be re-verified live; given the confirmed-open live `/search` behavior above, treat the formal-approval risk as low but not zero — if the team later hits a 401/403 in production, budget days, not hours, for a manual key request.
- The open-data catalog entry for JobSearch lists access as "Publik" (public). Source: `https://data.jobtechdev.se/data/dataservice/data-service-jobsearch/`.

**Rate limits:**
- Not documented with any concrete numbers (no requests/minute or requests/day figures found in the OpenAPI spec, getting-started docs, or archived terms). The only rate-limit-related fact is that the API defines a `429 Rate limit exceeded` error code as a possible response, i.e. *some* limiting exists operationally, but its threshold is not published. Source: `https://gitlab.com/arbetsformedlingen/job-ads/jobsearch/jobsearch-api/-/blob/main/docs/GettingStartedJobSearchEN.md` (Errors table).
- No `X-RateLimit-*` or similar headers were present on live responses in this research's test calls, so no limit could be inferred empirically either.

**Terms of use / license:**
- The current OpenAPI spec's `info.license` block states: `"name": "Ads are licensed under CC0"`, linking to `https://creativecommons.org/publicdomain/zero/1.0/deed.sv`. CC0 is a public-domain dedication — no attribution, no share-alike, no restriction on storage, derivative works (including embeddings), or re-display. Source: `https://jobsearch.api.jobtechdev.se/swagger.json`.
- The open-data catalog page independently lists the JobSearch dataset's license as "Creative Commons CC0". Source: `https://data.jobtechdev.se/data/dataservice/data-service-jobsearch/`.
- Discrepancy to flag: the archived 2019 (v1.1) general Terms of Use for Job Search/Job Stream instead describe ad content as licensed under **CC-BY-SA** (Creative Commons Attribution-ShareAlike) by default (§8.4), which would require attribution and share-alike licensing of derived works — stricter than CC0. Source: `http://web.archive.org/web/20210727204804/https://apirequest.jobtechdev.se/`. Since the live/current OpenAPI spec and open-data catalog (both dated to the present) say CC0, treat CC0 as the operative license for this project, but note the license may have changed over time and re-check the swagger.json license block close to submission.
- Read the full archived T&C text for any explicit caching/storage/database-persistence restriction: none found. No use of the words "lagra/lagring" (store/storage), "cache", "databas" (database), or "spara" (save) appears anywhere in the terms text. The only usage-shaping clauses are: don't overload the connection/abuse the service (§5.1), run content checks before ingesting into your own system (§5.3), don't use the API for anything that damages trust in Arbetsförmedlingen (§6.1), and handle any personal data found in ad content (e.g. union-membership info) only for purposes consistent with Arbetsförmedlingen's mandate, within the EU/EEA (§6.4–6.5). None of these block storing ad text/metadata in a database for re-display/ranking, or generating and storing embeddings.
- Contact for questions: `opendata@arbetsformedlingen.se` (from the OpenAPI spec's `info.contact`).

**Search behavior / query parameters (from the live `swagger.json`, `GET /search`):**
- **Free text:** `q` (free-text query across headline, description, employer name; supports quoted phrase search, trailing wildcard `*`, and boolean minus-exclusion like `unix -linux`), `qfields` (restrict which fields the free-text term matches, e.g. `occupation`, `skill`, `trait`, `location`), plus `x-feature-freetext-bool-method`, `x-feature-disable-smart-freetext`, and `x-feature-enable-false-negative` as freetext-behavior tuning flags.
- **Taxonomy-based structured filters** (values are taxonomy concept IDs, cross-referenced against the separate Taxonomy API): `occupation-name`, `occupation-group`, `occupation-field`, `occupation-collection`, `skill`, `language`, `driving-license`, `municipality`, `region`, `country`, `workplace-model`.
- **Employment-type / trainee-relevant filters:** `employment-type` (array, taxonomy code for employment type), `worktime-extent` (array), `parttime.min` / `parttime.max` (percent range), `duration` (array, employment-duration taxonomy codes), `experience` (boolean — `false` filters to no-experience-required ads), `driving-license-required` (boolean), and — most directly relevant to a LIA/trainee matcher — a dedicated **`trainee`** boolean parameter ("True will return ads which are likely to allow trainee work based on phrase matching"), alongside similar phrase-matched booleans `larling` (apprenticeship), `open_for_all`, `franchise`, `hire-work-place`, and `remote`.
- **Geographic/location:** `position` (`lat,lon`) with `position.radius` (km), plus the taxonomy-based `municipality`/`region`/`country`, and an `abroad` boolean and `unspecified-sweden-workplace` boolean for edge cases.
- **Employer / time filters:** `employer` (name or Swedish org number, prefix match), `published-before` / `published-after` (datetime or, for `published-after`, minutes-ago).
- **Pagination / sorting / shaping:** `offset` (0–2000), `limit` (0–100, default 10), `sort` (`relevance` default, `pubdate-desc`, `pubdate-asc`, ...), `relevance-threshold` (0–1), `resdet` (`full`/`brief`), `stats` + `stats.limit` (faceted counts), `label`, and `X-Fields` (GraphQL-style response field mask).
- Source for the full parameter list: `https://jobsearch.api.jobtechdev.se/swagger.json` (OpenAPI/Swagger 2.0, `info.version: "1.37.0"` as of Sep 1, 2026), cross-referenced against the worked examples in `https://gitlab.com/arbetsformedlingen/job-ads/jobsearch/jobsearch-api/-/blob/main/docs/GettingStartedJobSearchEN.md`.
- Related endpoints on the same host: `/complete?q=` (typeahead/autocomplete suggestions from common ad terms), `/ad/{id}` (full ad by ID), `/ad/{id}/logo` (employer logo). A separate Taxonomy API (`https://jobtechdev.se/docs/apis/taxonomy/`) is needed to resolve human-readable occupation/skill/location names to the concept IDs these filters expect.
