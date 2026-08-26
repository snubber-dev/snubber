# R-D-typed-runs — A field belongs to the run that owns its statement

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated what a field’s position means, and what becomes of a declared label written outside its run.

## Question

R-D-fields-in-runs made position the recognition constraint: a field is a field only inside
the run that opens an artifact or an event block. What the runs themselves are is not yet
chosen — a declared label can still ride the wrong event’s block, or sit in the opening run
wearing an event’s name. If position carries no meaning, a closing’s `Ruling` and an
opening’s are one statement smeared across the file. If a misplaced label is prose, an
optional field can drift out of the machinery while still rendering — the reader sees a live
field, the checker reads nothing, and reports clean over it.

## Candidates

1. **Read a field wherever it appears.** Position stops meaning anything; “each run’s value
   is that run’s statement” dies, and an event-carried field in the opening run claims a
   statement no event made.
2. **Misplaced and unknown field lines are prose.** Renders-but-dead: the exact silent drift
   the field machinery exists to catch, made legal everywhere.
3. **Typed, closed runs.** Below.

## What would settle it

Whether position is part of a field’s meaning, and whether the record may render what it
does not read.

## Closed — 2026-08-23

**Ruling.** Runs are typed and closed: a declared field appears only in the run that owns its statement — opening fields in the opening run, an event’s fields in its own block, `closed_requires` in both — and an undeclared key inside any run is a violation, never prose.
**Scope.** `spec/format.json`, `src/rules/fields.ts`, `src/parse.ts`

**Why candidate 3, and why reserved words.** Field names are reserved words of the record,
not of the type — a label another type declares is the same drift wearing a neighbour’s
coat. The comparison is case-insensitive, because a case-flipped label is that drift dressed
better. A label whose case differs from its declaration is one red, and the field is read as
the declaration it names — the record renders what it says: one mistake, one violation.

**Why runs are closed sets.** The closed-set clause reaches the opening run last, giving it
the discipline event blocks always had — which is also what keeps the budget-free opening
run from becoming an unbounded channel. It closes the artifact against its own declarations,
never the type’s vocabulary. What R-D-fields-in-runs left open stays open: a type declares
what it likes, and an artifact writes what its type declares.

**The escape.** The escape is the quoting fence, and a colliding body label rewords: prose
that needs a
field-shaped line quotes it, and prose that collides with a reserved word finds another
word.
