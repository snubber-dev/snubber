# R-D-repo-is-source — The repository is the source; everything else is a view

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** The direction of every coupling between the repository and the surfaces restating its facts is stated.

## Question

Issues, pull requests, wikis and editor rule files all hold some of the same facts as the
repository. Which direction does the coupling run?

## Candidates

1. **Repository as source, everything else generated.** One direction, one home per fact,
   and every surface is regenerable.
2. **A hosted store as source, repository generated.** Puts the record downstream of a
   mutable store with no provenance and no history, which dissolves the guarantee Evidence
   exists to give.
3. **Two-way sync.** A distributed-systems problem owned forever, and it defeats the write
   path.

## Closed — 2026-08-23

**Ruling.** The repository is the source. Issues, pull requests, wikis and editor rule files are views: generated, marked generated, and staleness-checkable.
**Scope.** `none`

**Why generated views are legal — they are watched copies.** A view that must exist as a file is legal only
because it is generated and its staleness can fail a check. That is the only reason a second
copy of a constraint is permitted anywhere in this format — the general test for such copies
is R-D-watched-copies, and a generated view passes it by construction.

**Published pages and their equivalents.** Views for readers who will not open a repository. Never a source.

**Why Scope is `none`.** No view generator exists yet. The ruling binds the day one is
written; until then no file carries it.
