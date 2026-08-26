# R-D-unreadable-version — What a checker does with a format version it cannot interpret

**Status.** `open`
**Opened.** 2026-08-23
**Settles when.** It is stated what a checker does on meeting a record whose carried spec declares a format version the checker cannot interpret, and who owes whom compatibility.

## Question

A checker interprets the checked tree’s carried spec, and a carried spec that will not parse
already has an answer: the run stops as a tool error, since a verdict from an unreadable
authority is no verdict. The open half is the well-formed spec the checker can parse but not
interpret — one declaring a format version newer than the checker knows, or older than it
still supports. R-D-format-version deliberately left this unruled: what a tool does on
meeting a version it cannot read, and any migration machinery, wait for something that reads
the number.

The question has no honest answer with one tool and one version, because every candidate —
refuse loudly, check with the rules both versions share, warn and proceed — is
distinguishable only when a real divergence exists. Refusing is safest and strands a record
on an old checker. A shared-subset check is a green that means less than it says. Proceeding
is the quiet wrong answer. Which is right depends on what version skew actually looks like
in practice, and nothing has skewed yet.

This returns when a second tool exists, or when the 0.2 line opens.
