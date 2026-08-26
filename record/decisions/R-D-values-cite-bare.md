# R-D-values-cite-bare — A field value cites bare; a span in a value is a violation, not a mention

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated how a citation is told from a mention, and whether a field value may carry a mention.

## Question

Every citation is an edge a rule walks, and the record also needs to *mention* IDs without
asserting anything — a quoted example, a foreign record’s artifact, prose about the grammar
itself. R-D-readable-ids made the token recognisable in prose; what a recognised token
asserts is not yet chosen. One shape cannot serve both masters unless the writing form
carries the difference, and whatever form is chosen must not become a place where an edge
can hide.

## Candidates

1. **Every ID-shaped token is a reference, spans included.** Nothing can be mentioned
   without being asserted: a quoted example is a red or a phantom edge, and the record
   cannot describe itself from inside.
2. **Spans escape everywhere, field values included.** A backticked ID in `Blocked by`
   renders live and binds nothing — the silent-drift shape again, relocated into values: an
   edge the writer sees and no rule walks.
3. **Bare asserts, a span mentions, and a value permits no mentions.** Below.

## What would settle it

Whether a field value is prose or machinery. Prose needs the mention; machinery has no use
for one.

## Closed — 2026-08-23

**Ruling.** A bare ID is a reference and must resolve; a code span is not a reference and is the cross-record escape — in prose. Inside a declared field’s value, a span that is exactly an ID is a violation: an artifact is named there bare or not at all, and no span ever hides an edge.
**Scope.** `spec/format.json`, `src/values.ts`, `src/rules/graph.ts`

**Why candidate 3.** The failure modes are asymmetric. A mention forbidden is an
inconvenience prose can write around. An edge hidden is the checker reporting clean over a
link it never saw — the failure this record exists to make impossible. So prose keeps the
escape (a span is never a reference, and no edge hides there because none is asserted),
while a value, which is machinery, gives it up: an ID in backticks where only a bare name
binds is a violation, not a quieter way to link.

**The unit, and the named ceiling.** The unit is the span, never a token: a wrapped URL
whose path carries an ID-shaped segment is `Source`’s own legal form, while a span mixing an
ID with real text slips the inspection — a ceiling named in the rule rather than discovered
later. The whole-value strip serves value comparison only and never launders a backticked ID
into a bare one.
