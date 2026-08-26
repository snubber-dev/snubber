# R-D-fail-closed — Unrecognised input is an error, everywhere

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** A single stated behaviour covers every place the checker is handed input it does not recognise, and any deliberate exemption says so where it is written.

## Question

Unrecognised input tends to report success by accident: a lookup returns nothing, a caller
reads nothing as satisfied, and a run in which nothing ran comes back green. The sites are
always plural — an absent record, a rule name matching no rule, a flag missing its
argument, an unknown command, a version range the runtime guard cannot parse — and none of
them was ever chosen. Is unrecognised input an error everywhere, or does absence get a pass?

## Candidates

1. **Fail closed, everywhere.** Unrecognised input is an error: name what was not
   understood, exit non-zero. Strongest, and the rule that needs no exceptions list. Cost: a
   tool that errors on first contact gets removed before it is understood.
2. **Fail closed on selection, be permissive on absence.** A typed intention that cannot be
   honoured is an error; an absent record is a state, because the caller stated nothing.
3. **Report honestly, exit 0.** Fixes the wording, leaves the green check untouched.
4. **Case by case.** The status quo dressed as a choice; it is how accidental defaults
   arrive.

## Closed — 2026-08-23

**Ruling.** Unrecognised input is an error: name what was not understood and exit non-zero, at every site. Absence of a record is not exempt, because invoking the checker is itself the stated intention.
**Scope.** `src/cli.ts`, `src/check.ts`, `src/runtime.ts`, `src/format.ts`

**Why candidate 1, reached through candidate 2.** Candidate 2 draws the right line — whether
the caller stated an intention that could not be honoured — in the wrong place. Running the
check is the intention: nobody invokes a gate ambiently, so answering *no record was found*
with a success code is a false answer to a question that was asked. Once the invocation is
counted, every site falls on the same side, and R-D-init-seeds is left holding the wording
and one distinction inside the error rather than the exit code.

**What the error must say.** Failing closed multiplies the walls a caller can hit, so it is
honest only if each wall names the way out. What an error owes its reader is
R-D-errors-name-remedy — made necessary here, ruled there.

**Why this was never a wording exercise.** The runtime guard is the site that proves it: a
version range the guard cannot parse must be an error, because a guard that silently decides
it has nothing to say switches off the published artifact’s only floor — the floor
R-D-node-floor makes true by construction.
