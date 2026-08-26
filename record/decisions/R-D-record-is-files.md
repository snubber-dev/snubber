# R-D-record-is-files — The record is files in the repository

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated why the record lives in the repository rather than in a wiki, a tracker, or a hosted database.

## Question

Why must the record be files in the repository rather than in a wiki, a tracker, or a hosted
database? Every candidate home can hold rationale; only one of them can hold rationale
against the thing it governs.

## Candidates

1. **Portability.** Markdown in your own repository means you can leave any second. True,
   and not sufficient — a wiki export is also portable, and portability is a promise about
   exit rather than a reason to adopt.
2. **Provenance.** Version control gives immutability and history for free. True, and still
   not the reason — a hosted store with an append-only log gives the same.
3. **Checkability against a diff.** A decision can only be checked against a code change by
   something that sees the code change.

## Closed — 2026-08-23

**Ruling.** The record is files in the repository, because that is the only place a Decision can be checked against a diff.
**Scope.** `record/**`, `spec/**`

**Why candidate 3.** A wiki can hold rationale perfectly well and will never see a code
change. A tracker can link a commit and cannot tell you the commit contradicts what it
linked to. Being in the repository is the mechanism, not a storage preference: it is what
makes implementation drifting from a ruling addressable at all.

**The two neighbouring rulings complete the shape.** R-D-one-repository puts the record beside the code it governs
rather than in a repository of its own, and R-D-repo-is-source fixes the direction of every
coupling: what lives here is the source, and every other surface is a view.
