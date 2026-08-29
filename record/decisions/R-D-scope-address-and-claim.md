# R-D-scope-address-and-claim — A Scope is an address and a claim, and each moves at its own price

**Status.** `closed`
**Opened.** 2026-08-28
**Settles when.** It is stated what kind of claim a Scope makes and how each of its two
parts may move — the address by what event, the reach at what price — who catches a file
no claim binds, and what R-D-strict-indexing's `src/` covers now that a second tree is
compiled.

## Question

A Scope does two jobs with one frozen line. To the closing it sits on, it is part of what
was ruled; to a reader of the tree, it is the map — the record's answer to "what binds
this file." The claim ages only when the question is asked again; the address ages every
time the tree moves. One price cannot fit both, and the record pays in three places.

Wrong in the growth direction: eight of thirty closed Scopes carry a glob that grows, the
other twenty-two are frozen lists, so whether a ruling reaches tomorrow's file was decided
by which spelling was shorter on closing day. A new `src/serve.ts` would inherit
R-D-strict-indexing's `src/**` and nothing else — not R-D-fail-closed, not
R-D-errors-name-remedy — exactly the rulings a new entry point most needs.

Wrong in the rename direction: a refactor that moves a governed file changes the address
and nothing about the claim, yet the only legal edit is a full reopening, so the edit does
not happen — `tsconfig.typecheck.json` stands beside `tsconfig.json` and no Scope names
it. And every reopening spent on bookkeeping degrades the history: a reader can no longer
tell "this ruling stopped holding" from "a file moved."

The reader's blindness is directional. R-D-scope-gate reports a claim with no subject;
nothing reports a subject with no claim. So "nothing binds this file" cannot be told apart
as chosen, stale, or never asked — and the last reading is permission: fail-open, in a
record whose central ruling is fail-closed.

## Candidates

1. **Scope is ruled; every change is a dated reopening.** The current practice made
   uniform. Honest, and it charges a change of mind for a change of address; the cost
   plausibly produced the accidental freeze.
2. **Scope is metadata: a current value the tree maintains, dated by git alone.**
   Cheapest, and the map is always current. But a rename-follow and a silent widening
   become the same one-line diff, and the checker reads one commit's tree, never history —
   the record stops stating the one distinction it exists to state.
3. **Reach moves only by reopening; the address moves by its own dated event; growth is
   settled by what each member of the claim means.** Three pieces, priced separately. The
   cost is the mirror leak: a file leaving a claimed region exits in an ordinary diff, so
   the unclaimed-files view becomes load-bearing.
4. **The address is derived: Scope freezes as written and the checker follows renames git
   can show.** No bookkeeping, but the ruling's subject becomes a heuristic's output, the
   verdict stops being a function of one commit's tree, and growth is untouched.

## Closed — 2026-09-02

**Ruling.** A Scope is the union of its members' claims — a glob member claims a region and grows with it, a path member claims one file and freezes; reach moves only by reopening, and a follow — nothing joins, nothing leaves — moves the address by a `Moved` event carrying the new Scope.
**Scope.** `spec/format.json`, `spec/v0.md`

**Why candidate 3.** Each alternative buys something real, and candidate 3 keeps the
purchase while refusing the price. Candidate 1's honesty is kept — reach still moves only
by ceremony — without spending that ceremony on a follow. Candidate 2's current map is
kept — the last event-carried Scope is always the address — without making the follow and
the silent widening the same diff. Candidate 4's point that the follow already lives in
history is kept, but held at review, where a person reads one dated diff, rather than in
the checker, where content similarity fails at exactly splits and merges. The shape is
continuous with R-D-born-at-asking: the lifecycle is appended events, and `Moved` joins it
as the event named for the move — a name promising reach would invite the widening it
exists to refuse.

**The follow test is a reviewer's test.** A `Moved` event carries a Scope and nothing
else; the ruling's current address is its last event-carried Scope, read from one commit's
tree. The checker can verify that the new Scope matches files; only the diff shows that
nothing joined the claim and nothing left it, so the test is held at review — the same
honor Re-closed already runs on. Rename, split into descendants, and merge of governed
files pass; a merge into an ungoverned file fails — the list must then bind material never
ruled on, a widening wearing a refactor's clothes; a split that also gains new material is
judged the same way, the gained material either joining a claim or standing unclaimed.

**The four prices.** A follow costs one dated line per touched ruling. A change of reach
stays a reopening — it flips the record's answer for some file, and Re-closed already
re-freezes the Scope in full. A file born inside a claimed region costs nothing: it is
claimed by construction. A file moved out of one costs nothing and tells no one — that is
the mirror leak, and it lands in the unclaimed-files view, which this closing therefore
makes load-bearing knowingly.

**Deletion is a narrowing, by the test itself.** When a governed file is deleted, material
leaves the claim, so no `Moved` can follow it; the ghost line is M-14's red once the gate
is up, and the reopening M-14 already names is the correct remedy, not an overcharge. A
ghost is not noise while it stands: a path member is a claim on a name, so a recreation is
born already bound — seeing that a bound file is a recreation takes history,
R-D-rule-inputs' residue.

**`none` claims nothing; a ghost claims a name.** The difference is reach, stated in the
present tense and readable from one tree — not history. A list emptied by deletion still
binds its names; `none` binds nothing. Converting the one into the other is therefore a
narrowing: ceremony may do it, an ordinary diff may not.

**Why the view stays a view.** An unbound file is not wrong-at-write, because no ruling
says a file must be bound — twenty-two frozen lists leave most of the tree unbound by
choice. Wrong-at-write gets a rule, needs-a-look gets a view, and coverage has not been
asked. Of the three readings, `Moved` retires the stale one; the view surfaces the other
two as one question only a human can split — chosen against never-asked stays a reading of
the Decision's prose, and that is the residual darkness, stated. The day a coverage ruling
closes, the view becomes its red unchanged.

**The boundary, and strict-indexing's `src/`.** The line runs between a file that can turn
a ruled property off — `tsconfig.typecheck.json` can — and one that can only stop asking —
`test/cli.ts` can. A Scope may name the former wherever it lives; the latter is
measurement and stays out. R-D-strict-indexing's `src/**` is a region claim over the
source tree only, and the second compiler config is not a stale address but material that
joined the claim: a widening, priced as that ruling's first reopening under this pricing,
which must also say whether the test tree is covered.
