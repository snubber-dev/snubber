# R-D-format-version — The format’s version is semver over records, not over code

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** Each component of `format.json`’s `version` has a stated meaning, the relation to the package version is stated, and what a reader does on mismatch is stated or deferred.

## Question

The format carries a version; the package carries its own, and the two move independently. A
consumer writes a record against the format shipped in one release and upgrades the tool;
nothing on the page tells them whether their record still parses. SemVer alone does not
reach this: it governs a package’s public API, and the format is a public interface that is
not the package’s API. The number must be chosen by what it does — a version that is merely
typed promises nothing.

## Candidates

1. **A single integer.** Bumped on any change that can fail an existing record. Cost: an
   addition and a break carry the same signal, and a record cannot say “readable since”.
2. **Semver with meanings restated over records.** The bump that may fail an existing
   conforming record, the bump that may not, and the bump that touches prose only. Cost:
   three digits where only one is load-bearing at a time, and the resemblance to the package
   version invites a binding nobody ruled.
3. **Bind format and package.** One number for the user. Cost: the format’s version goes
   decorative, and the format cannot change without a release.

## What would settle it

Whether the components have distinguishable consequences for a record that already exists.
They do: fail, still-pass, and untouched are three different mornings for a stranger’s
repository.

## Closed — 2026-08-23

**Ruling.** `version` is `0.1.0`, semver read over records: below 1.0.0 the format is not stable — a minor bump may fail an existing conforming record and a patch may not; from 1.0.0 the major carries that weight; the format’s and the package’s versions are independent.
**Scope.** `spec/format.json`, `spec/v0.md`

No bump that can fail an existing conforming record ships without stating what such a record
must change to pass again; `spec/v0.md`’s name tracks the major.

**Why candidate 2.** The range of consequences decided it, not how the digits read. From
1.0.0 a minor may only add and a patch touches prose only; below 1.0.0 the arithmetic is the
package’s own — minor breaks, patch fixes — so a consumer holds one mental model for both
numbers even though the numbers move independently. Equality of the two at any moment is
coincidence and promises nothing.

**Not ruled here.** What the tool does on meeting a record declaring a format version it
cannot read, whether a record declares one at all, and any migration tooling — machinery
with no writer yet. It returns as its own Decision when something reads the number.
