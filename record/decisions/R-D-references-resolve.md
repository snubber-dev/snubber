# R-D-references-resolve — Every bare ID resolves; the code span is the deliberate escape

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated whether a bare ID in prose must resolve, and what written form a reference to another record takes.

## Question

A bare ID in prose counts as a reference for connectivity. If it is never resolved, the rule
guaranteeing that nothing floats free is satisfiable by typing an ID that does not exist —
which makes the guarantee worth nothing rather than worth less. Should every bare ID
resolve, and if so, how does a record honestly mention an artifact that lives outside it?

## Candidates

1. **Leave references unresolved.** Connectivity was only ever meant to catch an orphan, and
   an orphan cited by a fiction is rare. Cost: the hollow guarantee above.
2. **Resolve every ID, no escape.** Clean, and it makes an artifact in another record
   literally unmentionable — the sentence that needs to point outward has no legal way to do
   it.
3. **Resolve every ID, and give a cross-record reference a written form.** A reference to
   another record is written in a code span, which the parsing rules already exclude from
   reference scanning. No parser change, no new syntax, and the distinction is visible to a
   reader. Cost: the escape is indistinguishable from an ordinary code span, so a lazy
   writer can silence the rule by adding backticks.

## Closed — 2026-08-23

**Ruling.** Every bare ID reference resolves to an artifact in this record (M-17); a reference to another record is written in a code span and is not a reference.
**Scope.** `spec/format.json`, `src/rules/graph.ts`

**Why candidate 3.** Its cost is accepted rather than argued away: backticks silence the
rule, but so does deleting the sentence, and neither is a thing the format can stop. What it
buys is that connectivity now means something — an inbound edge exists or it does not, and
M-12 can answer honestly.

**Why the escape is generic.** It is machinery, not a courtesy to any particular neighbour:
any future cross-record need writes the foreign ID in a span and takes responsibility for it
being uncheckable.

**Boundaries.** The escape is a prose escape; its boundary inside a field value — where a
span that is exactly an ID is a violation, not a mention — is R-D-values-cite-bare. Within
this record the same two-halves honesty is carried one level up by R-D-links-agree, which
binds a link’s text to its destination the way this ruling binds a bare ID to an artifact.
