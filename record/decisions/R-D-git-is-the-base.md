# R-D-git-is-the-base — A record is a git repository; a forge is a tier above

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is established what history and a forge each buy that the tree does not, and whether a plain folder with no version control is a valid record.

## Question

Is a plain folder with no version control a valid record, or is git part of the base? The
tree-only ceiling is not free. A closing lost in a merge is invisible to every rule that
reads the tree; seeing it needs the two parent commits. Evidence immutability is stated by
the type and enforced nowhere; it is checkable only against history. And the acceptance
moves a record wants — review, the change as a unit — are pull-request shaped. Is the
ceiling a design commitment or an unexamined inheritance, and if it falls, how far?

## Candidates

1. **Keep the tree ceiling.** Cheapest. The lost closing stays structurally invisible and
   Evidence immutability stays an unenforceable promise.
2. **Git as the base, one tier.** A record is a git repository, and rules may read history.
   Cost: the tool stops running on an unzipped folder, and every
   decidable-from-the-tree-alone sentence needs a second reading.
3. **Git as the base, forge as a tier above it.** Three availability classes: tree, history,
   forge. A forge buys what local history does not — review state, the pull request as a
   unit. Cost: it needs network and a vendor, and *rule* risks meaning three different
   things.
4. **Git optional, gates tiered by what is present.** The folder keeps working; history
   rules run where history exists. Cost: a green check means different things in different
   places — a run that passes while the thing it was meant to catch is out of view.

## Closed — 2026-08-23

**Ruling.** A record is a git repository; a forge is a tier above git and never the base.
**Scope.** `spec/format.json`, `spec/v0.md`

**Why candidate 2, with candidate 3’s ordering.** A forge sits above git and nothing may
require one. Git alone buys the two defects the tree cannot reach: the merge-lost closing
becomes visible in the parent commits, and Evidence immutability becomes checkable rather
than promised. Both need local history; neither needs a network.

**Why the forge stays a tier.** A forge buys the pull request as a unit and a home for
review state. It is never the base because a record that requires a forge requires a vendor,
and this format’s claim is that a plain repository is enough to hold a settled thing.

**What is unchanged.** Every shipped rule still reads the tree alone; this ruling makes
history available, not used. What may read history, how a rule declares its availability
class, and how a stronger rule relates to the one it strengthens are R-D-rule-inputs — made
askable here, not answered.
