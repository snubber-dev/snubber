# R-D-one-repository — Record, spec and code share one repository

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated whether the record lives beside the code it governs or in a repository of its own.

## Question

Does the record live alongside the code, or in its own repository? Separate repositories buy
clean commit histories and cost the central mechanism its subject: no governed paths,
nothing for a Scope glob to point at, no gate worth the name. One repository mixes record
commits with code commits, which is mildly noisy and mostly desirable — a Decision and its
implementation landing in one change is what the gate is for.

## Closed — 2026-08-23

**Ruling.** One repository: `record/`, `spec/` and `src/` live together, and this record’s own Scope globs point at this repository’s own source.
**Scope.** `none`

**Why together, not separate.** A record with nothing built under it spends its energy on the format,
because arguing about the format is the only work available — and the file-level scoping
R-D-scope-is-files rules is meaningless with no files to govern. One repository is also what
a user will have: nobody maintains a separate record repository beside the real one.
Publishing a public subset is unaffected, and is done by copying into a fresh repository,
never by extraction.

**One consequence to plan for rather than discover.** Once this repository requires its own check on its main
branch, a broken gate blocks its own repairs. The escape is the one already believed in —
bypass allowed, and it leaves a trace.
