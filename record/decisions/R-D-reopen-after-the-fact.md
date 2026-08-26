# R-D-reopen-after-the-fact — Provisionality is not a format property

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated whether a Ruling can be marked provisional in a way the format knows about, and what happens to `Reopens when`.

## Question

Should the format know that a Ruling holds only for now? A rule enforcing it needs a
trigger, and the only available trigger is vocabulary: match a marker word in the Ruling’s
prose and demand a reopening condition beside it. That fires on a Ruling that merely
mentions the word, misses every ordinary paraphrase — decided for now, until we measure,
temporarily — and so rewards using one vocabulary item rather than writing the condition.
Underneath, the concept may be redundant: a reopening is already an event with a date,
recorded truthfully when it happens, and declaring in advance that a ruling might not hold
is a forecast in a record whose strength is that it records what occurred.

## Candidates

1. **Declare the marker words in the format.** Fixes the hardcoding and makes a vocabulary
   list authoritative; a synonym outside the list still slips past.
2. **Cut the concept.** No marker, no rule; `Reopens when` stays an optional field on a
   closing, written when the trigger is known and enforced by nothing.
3. **Keep a prose-matching rule.** A structural property detected by matching prose — the
   class of mechanism this record removes wherever it finds it.

## What would settle it

Whether such a rule catches the behaviour or the vocabulary. If a Ruling can be provisional
in three words the rule does not know, it was checking the word.

## Closed — 2026-08-23

**Ruling.** Whether a Ruling holds only for now is not a property the format knows: no marker, no rule. `Reopens when` stays an optional field on a closing; a Decision carrying one is a view’s watch item, never a rule’s subject. A ruling that stops holding is reopened, with a date, after the fact.
**Scope.** `spec/format.json`, `spec/v0.md`

**Why candidate 2.** Any marker rule checks the vocabulary: the ordinary ways of saying the
same thing pass unnoticed, so what would be enforced is that people who use the marker also
write a condition — not the property anyone wanted. Cutting the concept removes a
prose-matching trigger and loses nothing that was reliably held.

**Why `Reopens when` keeps its home.** The condition is worth writing and worth reading, and
a list of Decisions carrying one is a useful view. But a thing worth reading is not thereby
a thing worth enforcing — the same cut R-D-context-uncontested makes for the synthesis.

**What remains true, and is recorded rather than implied.** The format’s answer to a temporary ruling is the `Reopened` event,
dated, when it actually stops holding — history, not forecast.
