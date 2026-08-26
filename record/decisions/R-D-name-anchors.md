# R-D-name-anchors — Rules find their types by name, and a name can be renamed

**Status.** `open`
**Opened.** 2026-08-23
**Settles when.** It is stated what binds a limit, and rule code generally, to the type or field it governs — display name, type letter, or declaration — and what a checker does when that binding resolves to nothing.

## Question

The word-budget rule finds the type it governs by name: the limit is named for Work, so the
code walks the declared types and takes the one whose name is Work. The name, not the
letter, is the anchor — the limit’s own name says which type it means, and the letter is one
rename away from meaning something else. That choice was made deliberately and stands.

It has two soft edges, both live only for a carried spec that diverges from the shipped one.
First, a spec that renames the type leaves the anchor resolving to nothing: the limit still
reads as declared, binds no type, no rule reds the dangling declaration — and the budget
silently stops being enforced. Second, the same pattern is wider than one rule: rule code
hardcodes the field names its rule texts name — Status, Opened, Under, Blocked by,
Supersedes — so a carried spec renaming any of these diverges from its own rule texts first,
and the divergence has no red of its own.

The board is the same pattern outside the rules: `src/cli.ts` selects artifacts by the
literal type names and reads `Grade` and `Source` by name, so the view CI posts hangs on
the anchors this Decision is about — `src/cli.ts` joins the Scope when this closes.

A spec-coherence red — a declared limit must bind a declared type — is the obvious candidate
and a 0.2 candidate already. The open half is whether it generalises to the field-name
anchors, or the anchors move off names entirely. The structural half of this neighbourhood
is ruled elsewhere: a carried value the checker cannot read as its declared shape — a limit
that is not a number — stops the run as R-D-spec-read-as-ruled’s tool error. What stays open
here is exactly the well-shaped binding that resolves to nothing.

This returns at the first carried spec that renames Work, or when the 0.2 line opens — the
line R-D-format-version governs.
