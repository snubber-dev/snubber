# R-D-scope-is-files — Rulings govern files and globs, never symbols

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** The granularity a Ruling’s Scope may name is stated, and the cost of that granularity is priced.

## Question

Does a Ruling govern files, or symbols within them? File level is declarable before code
exists, language-agnostic, and trivially derivable from a diff — and coarse: a large file
may carry several Rulings. Symbol level is precise in both directions and pays for it
everywhere else.

## Closed — 2026-08-23

**Ruling.** Scope is file and glob level, never symbols inside files.
**Scope.** `spec/format.json`, `src/md.ts`, `src/rules/**`

**Why not symbols — three reasons.** Symbol level requires a parser per language, which excludes
configuration, infrastructure and markdown at a stroke. Symbols rename more often than files
do. And a symbol that does not yet exist cannot be declared, which forces derivation from
code and ends governance during planning — the one phase where declared scope earns its
keep.

**Why the coarseness is affordable.** The costs are asymmetric. On the way in, over-supply
is cheap: a Ruling is one line, so five Rulings on a large file is five lines. On the way
out, a false positive is expensive, because a gate that fires on a reformatted line gets
disabled. So the mechanical check asks only that declared globs stay honest — when they are
checked is R-D-scope-gate — and judging whether a diff actually contradicts a Ruling is
semantic work that belongs to a reviewer, not to a rule.
