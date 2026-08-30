# Assignment brief (original)

> Copied verbatim from the course материials for reference. This is the source of truth for grading requirements — see `docs/plan.md` for how we're meeting them.

Inlämningsdatum 14 Sep av 23.59

## u15 - Gruppuppgift - AI-baserad webbapplikation

### Syfte

Uppgiften går ut på att skapa en tjänst som använder modern AI-teknik på något vis. Med modern AI-teknik menas: Anrop till AI-API:er så som LLMs, embedding-modeller, klassificerings-modeller eller liknande. Ni väljer själva målsättningen med tjänsten, och att utforska detta med AI-stöd är en del av arbetet med uppgiften.

Ta chansen och påbörja arbetet på ett projekt ni varit sugna på att göra länge! Fokus ligger inte endast på att få allting att fungera utan snarare att utforska och se, var går det fel och vad är svårt med AI?

### Instruktioner

Skapa en webb-applikation inom valfritt ramverk (React, Next, Vite). Tips är att välja ett "stort" språk för att underlätta utveckling med AI. Applikationen ska innehålla minst en AI-komponent som fyller en tydlig funktion i applikationen (chattbot, bildgenerering, sökning etc.)

Tips:

- Innan ni sätter igång och kodar - sätt upp en tydlig plan, gör research, välj ramverk med omsorg, planera applikationen.
- Använd skills (exempelvis Matt Pococks)

### Bedömning

#### Krav för Godkänt

- Applikationen använder en LLM eller annan AI-teknik (bildgenereringsmodeller, ljudgenereringsmodeller, semantisk sökning med embeddings)
- Applikationen ska helt (eller delvis) utvecklas med stöd av AI (Claude Code, Cursor, Codex, Antigravity etc.)
- Applikationen ska vara väldokumenterad/välkommenterad (visa på förståelse för koden) och arbetet med den kan användas som underlag till den skriftliga inlämningen (kodgranskningen).
- I readme.md ska även en reflektion över följande vara med:
  - Vilken ny AI-teknik/bibliotek identifierade ni och hur tillämpade ni det?
  - Motivera varför ni valde den AI-tekniken/det biblioteket.
  - Varför behövdes AI-komponenten? Skulle ni kunna löst det på ett annat sätt?

#### Vidareutveckling för Väl Godkänt

- Visat på stor säkerhet och skicklighet i sin identifikation och tillämpning av AI-komponenten
  - Ex. använt de mer avancerade tekniker vi gått igenom, avancerade system-instructions, RAG, tool-calling, hittat egna bibliotek eller på annat sätt fördjupat sig.
- Visat på stor säkerhet och skicklighet i sitt avgörande kring om AI var en lämplig lösning

### Redovisning och inlämning

- Muntlig redovisning fredag den 11e september. Ni presenterar applikationen och era val: vilken AI-teknik ni valde, varför den behövdes, och vad som visade sig vara svårt. Applikationen ska vara i presentabelt skick till dess.
- Ett github repo med fullständig kod samt readme.md som innehåller svar på de reflekterande frågorna ovan.
- Kodinlämning i Canvas med länk till git repository (t.ex. GitHub)
- Slutinlämning senast måndag den 14e september kl. 23:59

### Kursmål som uppfylls (8-9) enligt kursplan

8. Självständigt identifiera och tillämpa ny AI-teknik eller bibliotek i syfte att lösa programmeringsproblem.
9. Analysera en teknisk problemställning och avgöra när AI är en lämplig lösning och när det inte är det. Både i utvecklandet av applikationen samt i applikationen självt.

### Förslag på applikationer

**Embeddings**

Anteckningssök: Sök i egna anteckningar med embeddings (Supabase). Rekommendationslista: Hitta liknande filmer/böcker/produkter via embeddings.

**LLMs**

FAQ-bot: Använd en LLM för att svara på frågor (med eller utan embeddings). (Reflektera över hallucinationer och behovet av egen data.) Idégenerator: En liten webapp där man kan få förslag (t.ex. middagsidéer, träningspass, reserutter). (Reflektera över kvalitet, bias och kostnader.) Text-till-text filter: Låt en användare mata in text och få en omskriven version (t.ex. mer formell, kortare, på annan stil). (Diskutera när AI är värdefullt vs. vanlig regex/replace.)

**Andra AI-API:er**

Bild- eller ljudgenerator: Bygg ett litet gränssnitt där man skickar promptar till ett API som returnerar en bild eller ljud. (Reflektera kring kontroll, begränsningar, upphovsrätt?.)

MEN! - Dessa är bara förslag! Låt fantasin flöda - använd AI för att hjälpa er med idé -> planering -> utförande.
