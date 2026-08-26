# R-D-outcome-at-close — A Work closing carries an Outcome; there is no Withdrawn

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated what a Work item records when it closes, and whether abandonment is its own event.

## Question

A Decision closing must say what it decided; if a Work closing carries nothing, an item
closes in silence — even though `Done when` states the test the item was opened against,
and nothing records that the test was met. Nobody chooses that shape; it is what an empty
declaration says. A reader a month later can see a date and infer that someone thought the
test was met —
which makes `Done when` decorative at the only moment it matters, and an abandoned item
indistinguishable from a finished one.

## Candidates

1. **A closing is a date and nothing else.** The silence above, kept.
2. **Require an Outcome.** The closing carries a short statement of what happened, symmetric
   with `Ruling`.
3. **Require the Evidence a probe filed.** Sharper for probes, meaningless for builds — and
   it needs requirements that depend on a field’s value, heavier machinery than this
   question justifies on its own.

## Closed — 2026-08-23

**Ruling.** A Work closing carries an `Outcome` — what happened, in a sentence. There is no `Withdrawn` event: an abandoned item closes with an `Outcome` that says so.
**Scope.** `spec/format.json`, `spec/v0.md`

**Why candidate 2.** An outcome is the smallest thing that makes `Done when` mean something
at the moment it is answered, and it is the same shape as `Ruling`: the event says what it
did, not only that it happened. One line, so the outcome and every later edit to it stays
reviewable as a diff.

**Why no Withdrawn event.** Cut on a substitute, not on distaste. An abandonment is
expressible as a closing whose `Outcome` says so, so a second event kind buys only the
ability to count abandonments — and costs an event, a status value, a transition and a
grammar branch. Nothing downstream would treat the two differently anyway. If counting
abandonments ever matters, it returns as declared vocabulary for `Outcome`, cheaper to add
later than an unused event kind is to carry now.

**Where candidate 3 went.** Deferred rather than refused, and it arrived on its own merits:
requiring a probe to name the Evidence it settled or produced is R-D-evidence-lineage’s
ruling, carried as a per-value requirement with the `none` escape.
