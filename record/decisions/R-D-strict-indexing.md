# R-D-strict-indexing — Strict indexed access is on, and src carries no assertions

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated whether the compiler’s strict indexed access is on, and how the code answers an indexed read that may be absent.

## Question

The checker’s central activity is reading declared structures by key — types by letter,
fields by name, maps by event kind. The compiler can either be told that any such read may
come back empty, or be trusted to be right. With the flag off, a missing key becomes a
runtime surprise in exactly the code paths that interpret a carried spec — input the tool
does not control. With it on, every indexed read demands an answer for absence, and the
cheap answer available at every site is the non-null assertion, which turns the flag into
decoration.

## Closed — 2026-08-23

**Ruling.** The compiler’s strict indexed access is on and stays on; every indexed read answers absence with a real guard, and `src/` carries no non-null assertions.
**Scope.** `tsconfig.json`, `src/**`

**Why guards, not assertions.** Turning the flag on surfaced absent-key possibilities
across the tree, and every one was repaired with a guard that does something — a skip with a
stated reason, a default the spec declares, or a stop — rather than an assertion that
promises the compiler what the input has not promised the tool. The distinction is the whole
value: an assertion is the checker trusting a carried spec it exists to distrust, and a
wrong one is wrong-but-green at runtime.

**Where the guards lead.** The guards feed the stated error path rather than inventing one.
A carried spec whose structure cannot be read stops the run as a tool error —
R-D-fail-closed’s behaviour, a stop that names what could not be read — never a quiet
pass over the absent key.

**Keeping the property.** Assertion-free is kept as a property of the tree, not a
preference: a
future assertion is a review question with this Decision as its answer.
