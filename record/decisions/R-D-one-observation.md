# R-D-one-observation — An Evidence entry is one observation under one Grade

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** A test for whether an entry is one observation is stated, and Supersedes is known to work whole-entry against entries that pass it.

## Question

An Evidence entry holds one observation with a provenance grade — but without a test the
phrase drifts. An entry that bundles a claim seen directly with claims taken on report
carries one Grade that understates the first and is honest for the rest. And when one
bundled claim goes stale, Supersedes cannot retire it without burying the live ones. The
granularity question and the Supersedes question are the same question, and granularity is
upstream.

## Closed — 2026-08-23

**Ruling.** An Evidence entry is one observation when its Grade is true of everything in it — provenance, not claim count.
**Scope.** `spec/v0.md`, `record/evidence/**`

**Why provenance, not claim count.** Counting claims in prose is judgment, and a one-claim
rule would split entries that are honestly whole — several claims read from one source under
one grade are one observation. The provenance test cuts where the type needs it to: the
moment a grade is true of only part of an entry, the entry is two. That gives Grade a load
it can bear — an assertion about everything under it, not a summary over mixed provenance.

**Why Supersedes stays whole-entry.** R-D-evidence-lineage reads Supersedes as re-measurement
replacing measurement. Identifiers below the artifact, in the one immutable type, would be
machinery bought to preserve entries this Ruling says should not be written.

**The stated limit.** No rule is added, and that is a limit rather than a deferral: the test
is stateable but not decidable from the tree, so it belongs to whoever writes an entry and
whoever reviews it, and nothing mechanical will catch the next bundle.
