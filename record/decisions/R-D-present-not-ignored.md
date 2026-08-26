# R-D-present-not-ignored — The repository is what git reports present and not ignored

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** What the checker considers to be in the repository is stated, the behaviour where there is no git is stated, and whether artifacts are gathered by the same means is stated.

## Question

Rules that ask whether a linked file exists or whether a Scope glob matches anything need a
file listing. A walk that lists everything under the root — skipping a few directories by
name — has quietly answered a question nobody asked: build output, editor directories and
local scratch all count as repository, and a glob matching only untracked files counts as
matched. R-D-repo-is-source rules that the repository is the source; it does not say what
the repository *is*. Git has an answer, a name-skipping walk has a different one, and
nothing chose the difference.

## Candidates

1. **What git tracks.** Right about build output, wrong about the file being written now — a
   file is untracked for most of the time it is being worked on, so the gate
   false-positives on the normal case.
2. **The working tree.** Right about the file in hand, wrong about output: the answer
   depends on untracked local state, so a laptop and CI disagree on the same commit.
3. **The working tree minus a declared ignore list in the format.** Explicit, and a third
   home for a fact git already holds — it drifts the first time the ignore file changes.

## Closed — 2026-08-23

**Ruling.** The repository is what git reports as present and not ignored: tracked files plus untracked files no ignore rule excludes, via `git ls-files` with its cached, others and standard-exclude switches — never a second ignore parser. No git is an error, not a fallback.
**Scope.** `src/check.ts`

**Why ignored, not tracked, is the line.** The line between the first two candidates is not tracked
against untracked — it is *ignored*, a statement the repository has already made about
itself, in a file that is reviewed, versioned and shared. Build output is not source because
the ignore file says so; the file being written now is source because nothing says
otherwise. Git owns that syntax, negation and precedence included, so a second parser would
be correct until the first pattern that exercised the difference.

**Why no git is an error.** Where there is no git at all, R-D-git-is-the-base has already
made git the base, and the answer
is R-D-fail-closed’s: an error, never a quiet fallback to a different definition.

**The consequence that must not be missed.** Artifacts are not gathered by this listing. The
loader reads the declared homes directly, so a gitignored Decision is still checked. If that
ever changes, ignoring `record/` would empty the check and report success — a gate deleted
by a one-line edit in a file nobody reviews. The separation stays deliberate and is written
down where the listing is built.
