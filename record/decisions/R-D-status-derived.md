# R-D-status-derived — Status is derived from the event sequence

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated whether an artifact’s status is a field, the last event, or both, and which is the authority.

## Question

Is an artifact’s status a field, or the last event? A field is greppable at a fixed position
and trivial to parse — and it is also the merge surface: a writer who closes by flipping the
field merges cleanly over another writer’s closing, with no conflict, no warning and no
trace.

## Candidates

1. **A field.** The merge surface, kept.
2. **Derived, no field.** Removes the surface. Cost: the fixed position and the trivial
   parser — a person reading a Decision should not have to run a program to learn whether it
   is closed.
3. **A field that is a materialised view of the events, with equality enforced.** Keeps the
   position, removes the authority.

## Closed — 2026-08-23

**Ruling.** Status is a field and a materialised view of the event sequence; a rule enforces the equality (M-07), and the events are the authority.
**Scope.** `spec/format.json`, `src/rules/status.ts`

**What must come alongside, or the defect relocates.** Two things are required. Any heading matching the event prefix
grammar must match the event grammar exactly or be a violation (M-08): a grammar that treats
a near-miss as a non-event moves the silent surface from the field into the heading — the
same relocation R-D-fields-in-runs closes for field-shaped lines. And every event must be
legal from the state its predecessors produce (M-09), which is what stops a rewritten event
sequence, and stops it on the writer’s own machine rather than in CI.

**What this does not reach, stated rather than implied.** A writer who demotes an event out of the grammar
entirely leaves a Decision that reads as never having been reopened, and nothing a tree-only
checker sees distinguishes that from one that never was. Reaching it takes history, which is
R-D-rule-inputs’ open question.
