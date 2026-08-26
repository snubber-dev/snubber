# R-D-fields-in-runs — A field is recognised by position, not by shape alone

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** What counts as a field is stated, where one may appear is stated, and shadowing a real field with a later same-keyed line is impossible or red.

## Question

The field grammar matches any line of the form `**Word.** text`. Applied to every line of an
artifact, a candidate label in a Decision and a bold section lead in prose both parse as
fields — and where a key occurs twice, one occurrence wins silently, so a second line
carrying a declared key can shadow the real one without a mark on the page. What is a field?

## Closed — 2026-08-23

**Ruling.** A field is a field-shaped line inside the contiguous run opening an artifact or an event block; elsewhere such a line carrying a declared field name is an error and any other bold lead is prose; no key appears twice in one run (M-19); which run owns which field is R-D-typed-runs.
**Scope.** `spec/format.json`, `src/parse.ts`, `src/rules/**`

**Why position — the alternatives constrain the wrong thing.** Closing the field set
constrains vocabulary, which the format deliberately leaves open per type. Changing the
marker — a leading token, front matter, a fenced block — costs a rewrite of every artifact
and breaks the one property the format sells: a record is readable markdown. Position leaves
both untouched, because artifacts already open with their fields and event blocks already
carry theirs directly under the heading.

**The three effects.** Bold-lead prose stays prose and is stored as nothing. A duplicate key
in one run reds once, and every reader sees the first value — one claimant, stated, rather
than a silent overwrite. And a declared field name standing outside its run is itself the
violation, which closes the shadowing: inserting a second done-when above the real one was
clean under shape-only matching, and is not any more.
