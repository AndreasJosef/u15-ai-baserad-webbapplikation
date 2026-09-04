# [Project name TBD]

An AI-based web app built for the u15 group assignment. It generalizes the discipline of a relentless, branching interview — the kind you'd use to turn a fuzzy coding idea into a concrete plan — into daily life: bring a vague feeling about a personal project, and the app drills with you until it's a defined project broken into concrete tasks in your Todoist.

> Assignment brief: `docs/assignment.md`. Full design/architecture plan: `docs/plan.md`. Stack research notes: `docs/research.md`. How we work as a team: `docs/team-workflow.md`.

## Status

Implementation started. The app skeleton (TanStack Start + TypeScript, placeholder home page) is in this repo root and is set up to deploy to Vercel (`scripts/vercel-connect-deploy.sh` does the first-time connect + deploy). See `docs/plan.md` for the full plan, MVP scope, and stretch backlog.

## Stack

- **Framework**: TanStack Start (TypeScript), deployed on Vercel
- **Database/auth**: Supabase (Postgres) + Better Auth
- **LLM**: OpenRouter, primary model `anthropic/claude-sonnet-4.6`
- **Task destination**: Todoist (personal API token per user)

## Getting started

Requires Node 24.

```sh
npm install
npm run dev        # dev server on http://localhost:3000
npm run typecheck  # tsc --noEmit
npm test           # vitest
npm run build      # production build (what Vercel runs)
```

### Deployment

The app is a standard TanStack Start app, which Vercel auto-detects — no extra adapter config needed.

**First-time project setup:** run `scripts/vercel-connect-deploy.sh`. It's a step-by-step wizard that logs in, links this repo to a Vercel project, connects the GitHub integration, and sets the Production Branch to `main` (see below — the repo's git default branch is `dev`, so this needs an explicit fix), then does a first `--prod` deploy to confirm everything works.

**Day to day**, once linked:

```sh
npx vercel         # deploy a preview
npx vercel --prod  # deploy to production
```

Per `docs/team-workflow.md` §5, production deploys come from `main`; `dev` and feature branches get previews.

## Reflection

_Required by the assignment brief (`docs/assignment.md`) — drafted here from the plan, to be revisited and finalized once the app is actually built and we've felt where it worked and where it didn't._

### Vilken ny AI-teknik/bibliotek identifierade vi och hur tillämpade vi det?

Vi använder LLM-baserad **tool-calling** via OpenRouter (`anthropic/claude-sonnet-4.6`) för att låta modellen både föreslå en uppgiftsnedbrytning (`propose_task_breakdown`) och, efter användarens godkännande, faktiskt skapa uppgifterna i Todoist (`create_todoist_tasks`) via ett andra, separat verktygsanrop. Vi lade även stor vikt vid att skriva genomtänkta system-instructions (med stöd av en dedikerad prompt-writing-metodik) istället för en generisk chatbot-prompt, för att driva en intervju som aktivt gräver sig fram till ett konkret projekt innan den bryter ner det i uppgifter.

_(Att fylla i efter implementation: vilka konkreta bibliotek/SDK:er vi faktiskt landade i, t.ex. Vercel AI SDK:s OpenRouter-provider, och eventuella överraskningar i tool-calling-formatet mellan modeller.)_

### Motivera varför vi valde den AI-tekniken/det biblioteket

Tool-calling valdes eftersom det ger ett verkligt, verifierbart gränssnitt mellan "modellen tänker" och "modellen agerar" — uppdelningen i två separata anrop (förslag respektive skapande) gör att vi kan sätta in ett granskningssteg mellan dem utan att offra att AI:n faktiskt utför handlingen. OpenRouter valdes som gateway för att kunna byta modell (t.ex. till en billigare modell för utveckling) utan att skriva om integrationskoden, och Claude Sonnet 4.6 valdes som primär modell eftersom intervjuns kvalitet — förmågan att ställa relevanta följdfrågor — var en uttalad prioritet över kostnad (som ändå är försumbar i vår skala).

### Varför behövdes AI-komponenten? Skulle vi kunna löst det på ett annat sätt?

Kärnan i produkten är just den adaptiva, grävande intervjun: en statisk formulär- eller regelbaserad lösning kan inte ställa relevanta följdfrågor baserat på vad användaren faktiskt svarar, och kan inte gå från en vag känsla ("jag borde göra något åt garaget") till ett konkret, väldefinierat projekt utan mänsklig hjälp. Det går att bygga en ren todo-app utan AI, men då försvinner precis den del som gör verktyget värdefullt — den aktiva, ihärdiga frågeprocessen som gör grovjobbet med att omvandla en oklar idé till görbara steg.

_(Att fylla i efter implementation: konkreta exempel på var AI:n presterade bra respektive dåligt, och om vi skulle gjort samma avvägning igen.)_
