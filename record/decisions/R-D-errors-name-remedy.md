# R-D-errors-name-remedy — Every error names its remedy

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated what an error message must contain beyond the fault, and every shipped error message meets the statement.

## Question

R-D-fail-closed makes unrecognised input an error at every site, which multiplies the walls
a caller can hit. A message that names only what went wrong leaves the caller staring at a
refusal with no next move — the tool is strict and unhelpful in the same breath. Is the
content of an error message ruled, or is wording left to whoever writes each site?

## Candidates

1. **Every error names its remedy.** Beside the fault, the message states what the caller
   can do about it. Cost: an ongoing obligation — every new error site owes a remedy before
   it ships, and review must keep checking.
2. **Remedy where one exists.** Sites with no obvious way out state only the fault. Cost:
   the exemption swallows the rule — no obvious remedy is exactly the site where the caller
   is most stranded.
3. **Leave it to the site.** Wording is implementation. Cost: the status quo every review
   pass keeps finding — remedy-less messages, each defensible alone.

## Closed — 2026-08-23

**Ruling.** Every error names its remedy: beside what was not understood, the message states what the caller can do about it, and the remedy must exist before the error ships.
**Scope.** `src/cli.ts`, `src/check.ts`, `src/runtime.ts`, `src/format.ts`

**Why candidate 1.** It is what makes R-D-fail-closed honest rather than merely strict. An
error that does not name the way out is a wall; *no record found* is defensible only beside
*run snubber init*, which means the remedy must exist before the error ships.

**Why not the exemption.** A site with no obvious remedy is a site whose design is
unfinished: the missing remedy is the finding, never a licence for the message. Where the
only remedy really is *fix the named thing*, naming the thing precisely is the remedy —
the path or value the message points at is the caller’s next move.

**The cost, accepted out loud.** This ruling is the one whose compliance is never finished:
every error site added after it inherits the obligation, and each review pass so far has
found messages that owed more than they said. That is the ruling working, not drift.
