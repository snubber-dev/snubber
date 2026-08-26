# R-D-min-length-declared — Minimum lengths are declared in the format, read generically

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated whether a rule may hand-write a fact the format already declares, and where a non-emptiness check on a field lives.

## Question

A generic rule reads the event-field declarations and reports what is missing. A
hand-written rule restating the same field names for one event would fire beside it — two
violations for one defect, with the copy’s agreement maintained by hand. The one thing such
a special rule adds is a check presence cannot express: a `Ruling` that is technically
present and effectively empty. Where does that check live?

## Candidates

1. **Keep a special rule beside the generic one.** An unasserted duplicate of the
   declarations, in the checker itself.
2. **Generic rule only, non-emptiness declared.** The minimum length moves into the format,
   beside the field, and the generic rule reads it the way it reads requiredness.
3. **Special rule wins, generic rule loses its event half.** Every future event field is
   then hand-written — the general mechanism sacrificed to the special case.

## Closed — 2026-08-23

**Ruling.** No rule hand-writes what the format declares where a generic reading exists — the anchors that remain are R-D-name-anchors. A minimum length is declared beside the field (`min_length`) and read by the generic required-fields rule (M-05): the non-emptiness check without the duplicate.
**Scope.** `spec/format.json`, `src/rules/fields.ts`

**Why the check stays — the defect is real.** A closing that records an empty `Ruling` is presence without
content, and requiredness alone does not catch it.

**Why not a second rule.** Expressing the check as a second rule that also restates the
type, the event kinds and the field names is R-D-watched-copies’ test failed inside the
checker — a copy nobody asserts.

**Why a declaration.** Declaring the minimum makes the mechanism generic again: any field of
any type can carry one, and the rule reads it as declaration rather than as code. One fewer
rule, one more thing the format says about itself. The field grammar’s position discipline
from R-D-fields-in-runs guarantees the declared field the minimum binds is the one actually
read.
