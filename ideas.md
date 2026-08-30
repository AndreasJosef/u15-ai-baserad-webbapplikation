## ledger

In our group projects driven by agentic coding harnesses, the primary friction is the instantiation, coordination, and workflow management of multiple autonomous systems working alongside the team. To solve this, I am proposing a centralized agent ledger that acts as a shared source of truth for all machine intent and execution state. By routing agent orchestration through this ledger, we can align human and machine workflows into a cohesive, manageable process.

The Paradigm Shift: Context over Velocity * Kanban boards were designed to track human effort and velocity.
 * In agentic workflows, execution speed is a given. The actual bottleneck is context fragmentation.
 * The ledger replaces the traditional Agile board by acting as a real-time, machine-readable context source rather than a to-do list.
The Ledger vs. Git History
 * Git is retrospective: It is an immutable record of past actions that resolves collisions reactively (merge conflicts) after the work is done.
 * The Ledger is proactive: It is a real-time state machine of current machine intent that prevents collisions proactively (mutex locks) before conflicting code is generated.
Distributed Orchestration via Local Tooling
 * The ledger connects to each contributor's local repository, exposing it as an explicit tool for their local autonomous agents.
 * Before any agent executes a task, it must query the ledger.
 * If the ledger shows that another teammate's agent currently holds a lock on a specific file or schema, the local agent halts or shifts focus, eliminating blind overwrites.


## personal project

project breakdown thing based on the grill me skill and potentially loop-me that breaks grills personal/home project and captures them in say todoist.

## email task scheduler

a tool that I can forward emails to which them processes as todos or reminders in an reminder / todo expo app -> nice monorepo approach. -> also nice challenge with PII
