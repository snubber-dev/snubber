# R-D-rule-inputs — What may a rule read beyond the tree

**Status.** `open`
**Opened.** 2026-08-23
**Settles when.** It is stated what a rule may read beyond the checked tree — history, forge state — how a rule declares its availability class, and how a stronger rule relates to the tree rule it strengthens.

## Question

R-D-git-is-the-base makes git the base and history available, and no shipped rule reads
anything but the tree. The gap is concrete on both sides. A closing lost in a merge is
visible only in the parent commits, so the defect the record most wants to catch is legal to
every rule that exists. Evidence immutability is a property of the type and is checkable
only against history, so today it is a promise the format states and nothing enforces.

Opening history to rules raises the questions this Decision holds. Whether a rule states its
availability class — tree, history, forge — and where that declaration lives. Whether a
history rule that strengthens a tree rule replaces it, shadows it, or stands beside it with
its own number. And whether *rule* can span availability classes without a green check
meaning different things on different machines — the exact silence the base ruling refused
when it rejected tiered gates.

This returns with the first rule that wants more than the tree.
