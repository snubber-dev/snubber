# R-D-scope-gate — Unmatched Scope globs are reported, not red, until Work closes

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated when a declared Scope glob must match, and what happens to one that has never been checked.

## Question

The Scope rule fires only once a closed Work item names the Decision under Under. Before
implementation, matching nothing is the expected state — declaring scope for code that does
not yet exist is governance during planning, working as intended. The gating is correct, and
it leaves the rule close to inert: every ungated Scope is an unfalsifiable claim standing in
the record with nothing even saying it is unfalsifiable.

## Closed — 2026-08-23

**Ruling.** M-14 stays gated on a closed implementing Work item; the board reports every declared Scope glob that M-14 would not currently accept — a positive glob matching no file, an absent-glob still matching one — marking which are gated and therefore unchecked.
**Scope.** `src/cli.ts`, `src/rules/scope.ts`

**Why a report, not a red.** Ungating would punish exactly the case declared scope exists
to serve, and leaving the gate silent would leave the unfalsifiable claims invisible. The
third shape is the same cut R-D-evidence-lineage makes: wrong-at-write gets a rule,
needs-a-look gets a view. An unfalsifiable claim becomes visible without becoming a false
violation.

**Why only a human can close the question.** A second reason for the report: an unmatched
glob is not always a hole. A Scope
can be honestly declared ahead of the files it will govern — R-D-scope-is-files working as
ruled — and only a human reading the Decision can tell an early declaration from a stale
one. The board line hands them exactly that question and nothing else.
