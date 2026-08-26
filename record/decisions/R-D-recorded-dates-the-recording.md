# R-D-recorded-dates-the-recording — Recorded dates the recording, not the measurement

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated which act an Evidence’s `Recorded` field dates, where a measurement’s own date lives, and whether the format pins the distinction.

## Question

An Evidence carries one date. Two acts could claim it: the moment the world was measured,
and the moment the record wrote the measurement down. Most of the time the two coincide and
nobody notices which one the field means — until a measurement is backfilled, and the field
must either claim a past it cannot corroborate or admit it dates the writing.

## Closed — 2026-08-23

**Ruling.** `Recorded` dates the recording: the record’s own act, made at writing and corroborable by the history that carries it. The measurement’s own date is a claim nothing in the tree can check, so when it matters it lives in prose, never in this field. The format does not pin the reading.
**Scope.** `spec/v0.md`

**Why the recording, not the measurement.** The record can vouch for when it learned; it cannot vouch for when
the world moved. A field carrying the measurement date would be an unfalsifiable claim
inside the one type that is never edited, while the recording date is corroborable by the
very history that carries the file. This is the honesty line R-D-one-observation draws for
`Grade`: the field asserts only what is true of everything under it.

**Why no format pin.** Nothing reads the distinction: no rule consumes it, so two checkers
cannot diverge on any file. The reading earns a pin only if some future rule reads the
field.

**The named consequence, accepted rather than hidden.** Backfilled measurements carry their import date, and a view
ordering by `Recorded` shows import order — honest, since learning order is what the field
records.
