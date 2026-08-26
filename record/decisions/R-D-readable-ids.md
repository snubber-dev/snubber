# R-D-readable-ids — An ID is a readable name, immutable once written

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** The grammar states what an ID is, whether meaning may live inside it is chosen, and whether an ID may change after it is written is stated where the grammar is.

## Question

An ID is read far more often than it is written: every citation is a moment where the reader
either already holds what the token means or leaves the sentence to find out. May an ID
carry meaning, and what happens when the meaning it carries stops being true? Underneath
sits the recognition problem: a checker must tell an ID from ordinary hyphenated prose, or
common words with a letter and a hyphen parse as references to artifacts that do not exist.

## Candidates

1. **Opaque numbers.** Cheap to allocate, never wrong, five characters at every citation.
   Costs: every reading pays a lookup to save naming the thing once, and monotonic numbers
   collide across branches on unrelated work.
2. **Meaning inside a numeric grammar.** A name bolted onto a number keeps a redundant key
   in every citation — the stem is the ID and link text is the ID, so the long form appears
   everywhere anyway.
3. **A fixed prefix, the type letter, then a name.** The prefix makes the token unambiguous
   in prose without any digit requirement, and neutral rather than tool-branded, because the
   record is the artifact and outlives whatever checks it. Costs: longer IDs, and the type is
   read from the type segment rather than the first character.

## What would settle it

Whether an ID is a key or a label. A key is allocated, can never be wrong, and is cheap to
cite; a label is read, informative, and can go stale. The citation asymmetry argues for the
label; staleness argues for the key, and it is the only argument that does.

## Closed — 2026-08-23

**Ruling.** An ID is the fixed `R-` prefix, the type letter, and a name rather than a number; the file stem equals the ID (M-02), no ID names two artifacts (M-03), and an ID is immutable once written, including when it becomes inaccurate — the title is corrected, the ID is not.
**Scope.** `spec/format.json`, `spec/v0.md`, `src/rules/**`

**Why candidate 3.** The citation asymmetry, not taste: an opaque key optimises the act
performed once and charges the act performed at every reading.

**Why the costs they protect against are smaller than they look.** Collisions are
prevented within a home by the filesystem — the stem is the ID, so a duplicate is the same
file — and across homes by M-03, the line the filesystem cannot hold. Ambiguity in prose is
handled by the prefix, which is the work the digit requirement was doing. Ordering was never
promised — the dates carry the chronology.

**Why immutability lives beside the grammar.** Staleness is the one real cost, answered
rather than avoided. A name can stop being true; an opaque key cannot be wrong, which is the
strongest thing about it. Without the immutability sentence, a readable ID is a standing
invitation to rename — and a rename breaks every citation plus the commit messages carrying
them, which cannot be edited.

**Reach.** The same discipline reaches the link layer through R-D-links-agree: link text is
the ID, so text and grammar stay one system. This grammar is authored once into this format
and no record is ever migrated into it; the first artifact written under it is the first
artifact there is.
