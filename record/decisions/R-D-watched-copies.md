# R-D-watched-copies — A fact lives twice only where something asserts the copies agree

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** The rule governing when one fact may appear in two places is stated, and it is stated whether the format can hold that rule or only the record can.

## Question

One home per fact, read strictly, is violated constantly — and some of the violations are
correct. `Status` duplicates what the event sequence derives; the heading grammar duplicates
the ID grammar; a code comment duplicates the Ruling it implements. Deleting the first would
be wrong: a person reading a Decision should not have to run a program to learn whether it
is closed. So one-home-per-fact cannot be applied as written, and the failures that
motivated it — prose against prose, working document against Ruling, code against format,
rule against format — keep arriving in different materials with nothing naming what they
share.

## Candidates

1. **One home, strictly.** Deletes `Status`, which is useful and correct, and is already not
   followed — restating it changes only what people feel guilty about.
2. **One home, with exceptions.** A blessed-duplicates list is the shape this project audits
   for, and nothing checks the list is complete.
3. **Duplicate only where something asserts the copies agree.** The failure was never
   duplication; it was duplication nobody was watching. A checked copy cannot drift
   silently — the moment the copies disagree, something goes red. An unchecked copy is a
   fuse with no visible length.

## What would settle it

Whether the recurring failures are many problems or one. If one, the shared feature is the
absence of an assertion, and the rule follows from it.

## Closed — 2026-08-23

**Ruling.** A fact may appear in two places only where something asserts the two agree. An asserted duplicate is permitted and its assertion is load-bearing; an unasserted one is deleted or given one. In the format, a deliberate duplicate declares what it mirrors and what asserts it (M-27).
**Scope.** `spec/format.json`, `src/rules/spec.ts`

**Why candidate 3.** The failures are one problem, and the test is two-way rather than
prohibitive, which is why it can be applied. Is there an assertion? If yes, keep the copy
and treat the assertion as load-bearing; if no, delete the copy or write it.

**The test applied.** `Status` stays because M-07 is the assertion — R-D-status-derived’s
shape exactly. The heading grammar may restate the ID grammar because `mirrors` declares the
copy and M-27 recomposes and compares. A hand-written rule restating declared fields went
the other way, per R-D-min-length-declared, and the hand-maintained synthesis of rulings
went per R-D-context-uncontested — both copies nobody asserted. The single-home discipline
R-D-node-floor rules for the runtime floor is this test at its strictest: one home, every
consumer reading it, and the one permitted restatement guarded by the running code itself.

**Why the format carries it, not only the record.** Reasoning does not travel; the format
does. The enforceable residue lives in the spec — a deliberate duplicate names what it
mirrors and what asserts it, and a rule checks the recomposition — while the reasoning stays
here. An undeclared duplicate remains a question for review; a declared one whose assertion
is absent is a violation. Neither is a promise that every duplicate gets found, and this
Decision does not claim one.
