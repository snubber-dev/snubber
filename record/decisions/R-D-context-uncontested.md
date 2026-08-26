# R-D-context-uncontested — The context file states only what is uncontested

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** The context document’s job is stated, the boundary between it and a Decision is stated, and whether anything checks it is stated.

## Question

A project document beside the record wants three jobs at once: a narrative about the
project, a synthesis of closed Rulings in prose, and a statement of the format’s shape. The
synthesis is the problem. It restates closed Rulings in a file that is not an artifact, and
nothing checks that it still agrees with them. Blessing that gives the drift this project
exists to detect a permanent address at its most load-bearing spot.

## Candidates

1. **One file, three jobs.** Nothing checks the synthesis; the restatement stands unwatched.
2. **Cut the document entirely.** The spec defines the format; a README describes the
   project. Cost: nothing then states what the project is in a form a view or an agent’s
   context can be built from — a README is written for a human arriving at a repository.
3. **Keep the synthesis and check it.** A rule that every cited Ruling is still closed buys
   a weak guarantee: that the rulings stand, never that the prose still matches them.
4. **Keep the narrative, cut the synthesis.** The narrative stays under a name that says so;
   the synthesis goes, because a synthesis of closed Rulings is a view; the format’s shape
   moves to the spec.

## What would settle it

Whether closed Rulings are a source or a view. If a source, the synthesis is a second home
and must go; if a view, generating one is a feature and writing one by hand is the thing
being replaced.

## Closed — 2026-08-23

**Ruling.** `record/context.md` states what the project is, uncontested — anything wanting a *because* is a Decision instead. Optional to have; `init --context` seeds it sentinel per section, and a surviving sentinel or an empty file is a violation (M-26). It earns no artifact-reference credit.
**Scope.** `spec/format.json`, `spec/v0.md`, `src/rules/**`, `src/cli.ts`, `src/check.ts`

**Why candidate 4.** Closed Rulings are a view — R-D-repo-is-source read plainly. A
hand-written synthesis of rulings is a view someone maintains by hand.

**Why the boundary sentence carries the weight.** Without it the synthesis returns one
paragraph at a time, because every uncontested description sits one sentence away from the
reason it is true. *Uncontested* is a test a reviewer applies without reading the record: if
a section wants a because, it is a Decision. What passes the test — what this is, who it is
for, the vocabulary a stranger or a model needs, non-goals never argued, where things live —
carries no reason and belongs to no other file.

**Why the sentinel and the empty file are violations.** Optional to have is not optional to
be empty. Absence is a state — the distinction R-D-init-seeds draws for the record one level
up. A template committed unfilled is the other thing entirely: a form mistaken for a
statement — and a committed empty
file is that form with fewer characters, so M-26 reads both. The sentinel is per section
because the realistic failure is filling three sections of five.

**Why no artifact-reference credit.** A non-artifact that can satisfy an artifact’s
connectivity is a way to keep an orphan alive without anyone deciding to.
