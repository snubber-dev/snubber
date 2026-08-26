# R-D-scope-ceiling — Scope is one line, and a real project may not fit

**Status.** `open`
**Opened.** 2026-08-23
**Settles when.** A release valve for a Scope glob list that cannot fit one line is designed, or the ceiling is ruled acceptable and the workaround named.

## Question

A Scope value is a single line, and lines are capped by the length limit. Together they cap
how many globs a closed Decision can declare — a cap nobody chose. It is the intersection of
two mechanisms that are each right on their own: fields are single lines so values stay
reviewable as diffs (R-D-scope-is-files priced the coarseness, not the length), and the line
limit exists for readers. A wide-scoped ruling on a large project — a formatting policy, a
license header, a naming convention — could exhaust the line before it exhausts the paths.

No release valve is designed, deliberately: every candidate has a smell that should be
judged against a real case rather than a hypothetical one. A continuation syntax breaks the
one-line field grammar. A scope file beside the Decision is a second home for the
declaration. A broader glob trades precision for fit, silently widening what the ruling
claims to govern. Which smell is cheapest is exactly what the first real casualty will show.

This returns with the first real Scope that cannot fit its line.
