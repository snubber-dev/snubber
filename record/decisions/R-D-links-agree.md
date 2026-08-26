# R-D-links-agree — A link’s text agrees with its destination

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated what may stand as a link’s text, what must agree with what, and which disagreements a rule can catch.

## Question

A cross-reference carries two halves, a text and a destination. Resolution checks that the
destination exists; nothing in resolution checks that the halves name the same thing — a
text naming one artifact over a destination naming another resolves cleanly and passes the
gate. That is the cheapest lie a record can tell, and it is caught only by a reader nobody
has.

## Closed — 2026-08-23

**Ruling.** A link’s text agrees with its destination — ID-shaped text equals the destination’s stem, path-shaped text its basename (M-18) — and where the destination is an artifact, the text is that artifact’s ID, never a path, never prose (M-24); an immutable artifact’s links go unchecked.
**Scope.** `spec/format.json`, `src/rules/links.ts`

**Why two rules, not one.** They assert different things: M-24 objects to the form, M-18 to the
disagreement, and a link can be either without being both. For artifact links the form is
closed rather than checked — a rule scoped to a syntactic form is only as complete as the
record’s consistency in that form, and a record that merely looks consistent makes the gap
harder to see, not easier.

**Why the immutable exemption.** Links from an immutable artifact are historical: M-18 and
M-24 both exempt the type where the format sends verbatim external data, so the cheapest
lie is legal in Evidence — the one type carrying external Sources — and the record’s
answer to a rotted historical link is history, never an edit.

**Why basename, not resolved target.** A text naming a file from the repository root over a
destination written relative to the artifact has two honest halves; comparing resolved paths
would red it. What a reader cannot check is the halves naming different files, and the
basename is exactly that much and no more.

**The stated limit.** Where prose text is still legal, a plausible sentence about the wrong
file remains legal too — judging prose is a reviewer’s work.
