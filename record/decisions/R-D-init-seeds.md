# R-D-init-seeds — No record and an empty record are different errors

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** The checker’s behaviour in a directory with no record is chosen rather than inherited, the wording a first user meets is written, and what `init` creates is true by construction.

## Question

A checker that walks the declared homes and finds no artifacts reports clean and exits 0 — a
result nobody chose. Wired into CI before a record exists, that is a green check that has
never checked anything and stays green until somebody writes a Decision: a gate that cannot
fail, which is the defect this project was built to detect, occurring in the detector. The
word is also wrong in a specific way — *clean* asserts a record was examined and found
sound, when what happened is that no record was found.

## Candidates

1. **Leave it: zero artifacts is vacuously clean.** Defensible on the mechanics,
   indefensible on the reading — and adoption becomes silently reversible: delete `record/`
   and the gate goes green rather than red.
2. **Say what happened, still exit 0.** Honest wording, untouched failure mode.
3. **Exit non-zero when no record is found.** Loud, and it fires on every repository that
   installs the tool before writing anything — a red first contact.
4. **Distinguish absent from empty.** No `record/` at all is not-started; a `record/` that
   exists and holds nothing is a record someone emptied or an initialisation that seeded
   nothing. Costs two behaviours to specify.

## Closed — 2026-08-23

**Ruling.** No `record/` is an error naming `snubber init`; a `record/` holding no artifacts is an error naming what to write; otherwise clean or the violations. `init` seeds homes, placeholders and two artifacts, clean; `--context` adds the template, red until filled.
**Scope.** `src/cli.ts`, `src/check.ts`

**Why candidate 4.** The exit code is R-D-fail-closed’s and is not re-argued —
invoking the checker is itself the stated intention. What carried weight here is the
distinction and the words. Not-started and emptied are different facts and only one is
innocent; collapsing them loses the only place the difference is visible. Sparse is not
empty: a repository governing two paths with three artifacts is clean and stays clean.
Empty means zero, and the only roads to zero are a seeding that wrote nothing and a record
someone removed — neither should be quiet.

**Why `init` seeds two artifacts.** Not a courtesy, and not a connectivity necessity — M-12
passes a record of one, deliberately. The pair is the form’s first worked example. The
Evidence recording that the record was started is true by construction, since the command
was run. The Decision it forces is genuinely open, because what this record governs is not
the tool’s to answer. Together — reference, field run, settling condition — they are the
form as the first thing anyone sees.

**Why the placeholder files.** Mechanism, not decoration: git does not track empty
directories, so homes created and left empty would not survive a clone, and the state a
first user sees locally would not be the state their CI sees.

**Why `--context` is opt-in.** The template R-D-context-uncontested rules is seeded only
when asked for: its sentinel is a red, and the two ways of meeting one differ in kind. A red
the user asked for is a to-do with a named exit — fill each section and remove its sentinel,
or delete the file. The same red arriving unasked is a broken promise on first contact, from
a seed the ruling above calls clean and is not. The flag is the
asking, and the seeding’s output says which state it left.
