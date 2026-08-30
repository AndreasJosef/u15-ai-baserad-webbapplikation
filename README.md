# [Project name TBD]

An AI-based web app built for the u15 group assignment. It generalizes the discipline of a relentless, branching interview — the kind you'd use to turn a fuzzy coding idea into a concrete plan — into daily life: bring a vague feeling about a personal project, and the app drills with you until it's a defined project broken into concrete tasks in your Todoist.

> Assignment brief: `docs/assignment.md`. Full design/architecture plan: `docs/plan.md`. Stack research notes: `docs/research.md`. How we work as a team: `docs/team-workflow.md`.

## Status

Design phase complete, implementation not yet started. See `docs/plan.md` for the full plan, MVP scope, and stretch backlog.

## Stack

- **Framework**: TanStack Start (TypeScript), deployed on Vercel
- **Database/auth**: Supabase (Postgres) + Better Auth
- **LLM**: OpenRouter, primary model `anthropic/claude-sonnet-4.6`
- **Task destination**: Todoist (personal API token per user)

## Getting started

_TODO once implementation begins: env vars, local dev setup, running migrations._

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
