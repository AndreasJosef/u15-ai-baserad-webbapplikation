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

## 4. Better Auth + TanStack Start + Supabase Postgres integration

Research done 2026-09-03, following on from `docs/adr/0001-better-auth-over-supabase-auth.md` (Better Auth, own tables unified into the same Supabase Postgres schema as the app). Covers wiring, migrations, and RC/pooling gotchas. Better Auth itself is out of RC — npm shows `better-auth@1.7.2` as `latest` (with a separate `1.7.0-rc.6` on the `rc` dist-tag) — so version churn risk here is concentrated in the **TanStack Start** side and in the docs-vs-code drift that's normal for a fast-moving auth library, not in Better Auth being pre-1.0.

**Bottom line — session/cookie wiring:** Better Auth has an official, current TanStack Start integration guide (not just a generic Node-handler fallback). Mount `auth.handler` as a catch-all Start server route, read the session in server functions via `getRequestHeaders()` (not `request.headers` — that pattern is stale, see gotcha below), and gate SSR routes with `beforeLoad` calling a server function. Use the `tanstackStartCookies` plugin so `auth.api.signInEmail`/etc. write cookies through Start's cookie system instead of a raw `Set-Cookie` header that Start would drop.

**Bottom line — migrations:** Better Auth's CLI (`npx auth@latest generate`, package `auth`, NOT the now-deprecated `@better-auth/cli`) can emit a Drizzle schema file instead of touching the DB itself; from there `drizzle-kit generate` + `drizzle-kit migrate` produce and apply one ordinary Drizzle migration history that includes Better Auth's tables alongside the app's own — this is the "one coherent migration tool" path the ADR wants. Better Auth's own `auth@latest migrate plan|apply` command exists but is a second, competing migrator (built-in Kysely adapter + "SQL-backed Drizzle or Prisma adapters" per the CLI docs) — don't run both against the same schema; pick `generate` + Drizzle Kit and never run `auth migrate`.

**Bottom line — RC/pooling gotchas:** The sharpest one is Supabase's transaction-mode pooler (port 6543) not supporting prepared statements — both Better Auth's `pg.Pool` connection and Drizzle's `postgres-js` client need `prepare: false`/pool-mode-aware config, or use the direct connection (port 5432) for migrations. On the TanStack Start side, the RC has already broken this integration once via an internal API rename (`request.headers` → `getRequestHeaders()`) and the `tanstackStartCookies` plugin has an open, closed-as-not-planned bug against Nitro+Bun builds — target Node runtime, not Bun, for this project regardless.

### 4.1 Session/cookie handling in TanStack Start server functions

- Better Auth ships an **official, current** TanStack Start integration page — not just "any framework"/generic Node-handler docs. Source: https://better-auth.com/docs/integrations/tanstack (mirrored at https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/tanstack.mdx). A `create @tanstack/start` scaffold even offers "Better Auth" as an installer add-on.
- **Mounting the handler**: create a catch-all Start server route at `src/routes/api/auth/$.ts` that forwards `GET`/`POST` straight to `auth.handler(request)`:
  ```ts
  // src/routes/api/auth/$.ts
  import { auth } from '@/lib/auth'
  import { createFileRoute } from '@tanstack/react-router'

  export const Route = createFileRoute('/api/auth/$')({
    server: {
      handlers: {
        GET: async ({ request }) => auth.handler(request),
        POST: async ({ request }) => auth.handler(request),
      },
    },
  })
  ```
- **Reading the session in a server function**: use `getRequestHeaders()` from `@tanstack/react-start/server`, then pass those headers to `auth.api.getSession`:
  ```ts
  import { createServerFn } from "@tanstack/react-start";
  import { getRequestHeaders } from "@tanstack/react-start/server";

  export const getSession = createServerFn({ method: "GET" }).handler(async () => {
    const headers = getRequestHeaders();
    return auth.api.getSession({ headers });
  });
  ```
- **Docs-drift gotcha (confirmed, dated)**: the integration guide previously told readers to read `request.headers` directly inside a server-function/middleware context; that stopped working because TanStack Start's middleware no longer hands you a `request` object that way. Filed as https://github.com/better-auth/better-auth/issues/6818 (opened 2025-12-17, fixed via PR #6824, docs now correctly show `getRequestHeaders()`). The version fetched today already reflects the fix — but this is a good example of why "check the live docs, not a blog post" (also flagged in §3 above) applies specifically to Better Auth's TanStack pages too.
- **Setting cookies (sign-in/sign-up)**: register the `tanstackStartCookies` plugin (**must be the last plugin in the `plugins` array**) so calls like `auth.api.signInEmail(...)` write cookies through TanStack Start's response-cookie machinery instead of a header that gets dropped:
  ```ts
  import { betterAuth } from "better-auth";
  import { tanstackStartCookies } from "better-auth/tanstack-start"; // Solid: ".../tanstack-start/solid"

  export const auth = betterAuth({ plugins: [tanstackStartCookies()] });
  ```
  Note the plugin was renamed from `reactStartCookies` (`better-auth/react-start`) to `tanstackStartCookies` (`better-auth/tanstack-start`) at some point — older blog posts and Stack Overflow answers will show the old name; both existed in GitHub history, only the new name appears in current docs. Confirm which your installed `better-auth` version exports before copy-pasting a snippet.
- **SSR route access to session (`beforeLoad`)**: call the `getSession`/`ensureSession` server function from a route's `beforeLoad`, which TanStack Start runs on every navigation including client-side `<Link>` navigation (so it's not just an SSR-only check):
  ```ts
  export const Route = createFileRoute('/dashboard')({
    beforeLoad: async () => {
      const session = await getSession();
      if (!session) throw redirect({ to: "/login" });
      return { user: session.user };
    },
  })
  ```
  For multiple protected routes, put this in a pathless layout route (e.g. `src/routes/_protected.tsx`) and nest the protected routes under it, rather than repeating the check per-route. Same source as above.
- Better Auth's own recommendation: prefer the client SDK (`authClient`) for interactive sign-in/sign-up flows from components, and reserve direct `auth.api.*` calls in server functions for session reads/guards — mixing both increases the chance of hitting the cookie-writing edge cases above.

### 4.2 Migration tooling for a shared Better Auth + app-tables schema

- **The CLI package changed names.** `@better-auth/cli` is now marked `DEPRECATED` on npm ("Package no longer supported"). The current CLI ships as the `auth` package (`npx auth@latest ...`), version-locked to `better-auth` itself (both were `1.7.2` at check time). `better-auth`'s own `package.json` still depends on adapter sub-packages like `@better-auth/drizzle-adapter@1.7.2` and `@better-auth/kysely-adapter@1.7.2` — those adapter packages are current, only the standalone CLI package is deprecated. Verified directly against the npm registry (`npm view better-auth`, `npm view @better-auth/cli`, `npm view auth`), 2026-09-03.
- **Two CLI subcommands, different jobs**:
  - `npx auth@latest generate` — generates a schema file for your ORM (`schema.ts` for Drizzle, `prisma/schema.prisma` for Prisma, `schema.sql` for Kysely) from your `betterAuth(...)` config. Does **not** touch the database. Flags: `--adapter <prisma|drizzle|kysely>`, `--dialect <...>` (required for Drizzle), `--output <path>`, `--config <path>`, `-y`.
  - `npx auth@latest migrate plan` / `migrate apply` — inspects/applies the Better Auth schema **directly against the database**, bypassing any ORM's own migrator. Docs state this "supports the built-in SQL database configuration and SQL-backed Drizzle or Prisma adapters" (https://better-auth.com/docs/concepts/cli) — but the separate Database concepts page says schema drift auto-detection "is only supported for the built-in Kysely adapter. For other adapters, you can use the `generate` command to create the schema" (https://better-auth.com/docs/concepts/database). **These two official pages are in tension** about exactly which adapters `migrate` fully supports — don't rely on `migrate apply` for a Drizzle project without testing against your own adapter version; treat `generate` + Drizzle Kit as the safe, unambiguous path.
- **Recommended pattern for one coherent migration history** (this is what satisfies the ADR's "own tables unified into the same schema, one migration path"):
  1. Configure `drizzleAdapter(db, { provider: "pg", schemaName: ... })` from `@better-auth/drizzle-adapter` (or `better-auth`'s adapter export, depending on version — confirm the import path against your installed version's docs page, since this moved into its own package) in your `auth.ts`.
  2. Run `npx auth@latest generate` to (re)produce the Better Auth Drizzle schema file whenever you change Better Auth config/plugins (this affects which columns/tables it needs).
  3. Merge/import that generated schema alongside your app's own Drizzle schema files (same `drizzle.config.ts`, same `schema` folder or an explicit merge) so both feed **one** `drizzle-kit generate` run.
  4. Run `drizzle-kit generate` to produce a normal timestamped SQL migration, then `drizzle-kit migrate` to apply it — this is one linear migration history covering both Better Auth's tables and the app's tables in the same Supabase Postgres database.
  5. Never additionally run `auth migrate apply` against that same database — it's a competing migrator that isn't Drizzle-history-aware and will fight Drizzle Kit's migration bookkeeping (`__drizzle_migrations` table).
  Source for steps 1–4: https://better-auth.com/docs/adapters/drizzle (mirrored at https://github.com/better-auth/better-auth/blob/main/docs/content/docs/adapters/drizzle.mdx).
- **Config file discovery**: the CLI looks for `auth.ts` by default in the project root, `./utils`, `./lib`, or the `src/` equivalents of those; point it elsewhere with `--config <path>` (e.g. `--config ./src/lib/server/auth.ts`) if the auth instance lives somewhere else. Multiple closed GitHub issues (e.g. #874, #3762) report path-alias/tsconfig-resolution bugs in this discovery step on some setups — if `generate`/`migrate` can't find your config, passing `--config` explicitly is the documented workaround.
- **Alternative (no ORM at all)**: Better Auth can run directly against a `pg.Pool` via its built-in Kysely adapter (`database: pool` instead of `drizzleAdapter(...)`) — this is what gets the CLI's live schema-drift detection in `migrate plan`, per the Database concepts page. Not the right choice here since the ADR already commits to unifying with the app's own tables/migrations, but worth knowing this is why the two `migrate`-support docs statements above seem to disagree: `migrate`'s DB-introspecting "plan" behavior is really built around the built-in Kysely path, with Drizzle/Prisma support being narrower/newer.

### 4.3 TanStack Start RC-era gotchas + Supabase Postgres specifics

- **TanStack Start release status, reconfirmed 2026-09-03**: still Release Candidate, not 1.0, consistent with §3 above — no change since the 2026-08-30 note. Source: https://tanstack.com/start/latest/docs/framework/react/overview.
- **Middleware/headers API churn already bit this exact integration once** — see the `getRequestHeaders()` fix in §4.1 (issue #6818). Treat any Better-Auth-in-TanStack-Start code sample older than a few months with suspicion; re-check against the live docs page before trusting a `request.headers`-style snippet.
- **`tanstackStartCookies` + Nitro/Bun build breakage**: an open (closed-as-not-planned) GitHub issue reports the plugin causing `ReferenceError: attachRouterServerSsrUtils is not defined` at build/preview time specifically on a Nitro+Bun target (better-auth 1.4.9, Node v25.2.1 host, Bun runtime target). Workaround reported was removing the plugin (losing its cookie-writing convenience). Source: https://github.com/better-auth/better-auth/issues/7064. Given §3 already flags "Bun only supported with React 19+" as a soft spot for TanStack Start generally, and this project isn't targeting Bun, this is low-risk here — but it's a concrete data point that Bun is the roughest target for this specific combo, reinforcing the existing Vercel/Node choice.
- **Cloudflare Workers**: separately, an October 2025 TanStack/router issue reported intermittent Workers-runtime request cancellations ("detected that your Worker's code had hung") when combining TanStack Start + better-auth + Postgres on Cloudflare Workers (https://github.com/TanStack/router/issues/5323, closed, root cause/fix not documented in the visible thread). Community write-ups separately note Cloudflare Workers needs a **per-request** Better Auth instance factory (D1/env bindings aren't available at module-eval time the way `process.env` is on Node), not the module-level `export const auth = betterAuth(...)` singleton shown in the standard docs. Not this project's deploy target (Vercel, per §3), but confirms Cloudflare is the target requiring the most rework for this stack.
- **Vercel preview-deployment origin errors**: Vercel preview URLs are randomly generated per-deploy and won't match a static `trustedOrigins` list, producing "Invalid Origin" rejections on preview deploys (reported at better-auth 1.2.5: https://github.com/better-auth/better-auth/issues/2203, closed without a documented maintainer fix in-thread). The now-documented fix is the `baseURL` object form with `allowedHosts` wildcards, which auto-populates `trustedOrigins`:
  ```ts
  betterAuth({
    baseURL: {
      allowedHosts: ["myapp.com", "www.myapp.com", "*.vercel.app"],
      protocol: "https",
      fallback: "https://myapp.com",
    },
  })
  ```
  Source: https://better-auth.com/docs/reference/options. Relevant here only if/when preview deployments are added later — plan's current MVP scope (per §3) is a single Vercel production target.
- **Cookie/CSRF defaults** (apply to both plain API routes and Start server functions, since both ultimately hit `auth.handler`): secure cookies are set automatically once `baseURL` is `https://…`; `SameSite=Lax` and `HttpOnly` are the defaults; CSRF protection checks the `Origin`/`Referer` header against `trustedOrigins` and blocks fetch-metadata-flagged cross-site navigations. Cross-subdomain cookie sharing needs an explicit `crossSubDomainCookies` config — not needed for a single-domain Vercel deployment. Source: https://better-auth.com/docs/reference/security. `trustedOrigins` supports exact origins, `*.example.com`-style wildcards, and a dynamic async function form for origin lists that need runtime lookup.
- **Supabase Postgres connection pooling — the one that will actually bite**: Supabase exposes three connection strings that are not interchangeable — direct connection (port 5432, for migrations/admin/long-lived servers), and Supavisor pooler in either session mode or **transaction mode** (port 6543, for serverless/edge request-scoped connections). Transaction mode does **not** support named prepared statements. Both Better Auth's raw `pg.Pool` path and Drizzle's `postgres-js` client default to using prepared statements, so both need it explicitly disabled when pointed at the transaction pooler:
  ```ts
  // Drizzle + postgres-js against Supabase's transaction pooler
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  const db = drizzle({ client });
  ```
  Sources: https://supabase.com/docs/guides/database/connecting-to-postgres, https://supabase.com/docs/guides/troubleshooting/disabling-prepared-statements-qL8lEL, https://orm.drizzle.team/docs/connect-supabase (Drizzle's own Supabase-specific guide states the same `prepare: false` requirement and "use the pooler for serverless, direct connection for long-running servers").
  - **Practical split for this project**: run `drizzle-kit generate`/`migrate` (and any one-off `auth@latest generate`) against the **direct** connection (5432) from a local/CI shell, and run the deployed app (Vercel serverless functions, including Better Auth's request handling) against the **transaction pooler** (6543) with `prepare: false`. Mixing this up is the most likely real-world gotcha for this stack — a migration run against the pooler can fail or behave oddly, and app traffic against the direct port will exhaust Postgres's connection limit under serverless concurrency.
  - Supabase has been actively changing pooler internals (Supavisor rollout, a newer dedicated PgBouncer offering with partial prepared-statement support in transaction mode) — re-check the connecting-to-postgres doc close to implementation time rather than trusting this note indefinitely, since this is exactly the kind of infra detail that shifts under a fast-moving platform.

**Open questions / things to verify at implementation time** (not resolved by docs, flagged rather than guessed):
- Whether `@better-auth/drizzle-adapter`'s exact import path (separate package vs. `better-auth/adapters/drizzle` subpath export) is stable across the `better-auth` version this project will actually pin — confirm against the installed version's own docs page/TypeScript types rather than this note, since the adapter was clearly reorganized into its own package at some point during 1.x.
- Whether `migrate plan`/`migrate apply`'s Drizzle support (vs. the Database-concepts page's narrower "Kysely only" claim, §4.2) is trustworthy enough to use at all — recommend just not using it, per the recommended pattern above, sidestepping the question.
- No official Better Auth guidance was found specifically calling out Supabase (as opposed to generic Postgres) — the pooler/prepared-statement gotchas above come from Supabase's and Drizzle's own docs, not from a Better-Auth-authored Supabase integration guide. If one exists it wasn't surfaced by this research pass.
