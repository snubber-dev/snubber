# R-D-evidence-lineage — Evidence lineage is one feature

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated what `Forced by`, `Supersedes` and `Probes` are collectively for, what reads them, whether they collapse into one field, and whether a probe is required to link the Evidence it produces.

## Question

Three fields nothing reads as lineage: `Forced by` on a Decision names the Evidence that
forced it, `Supersedes` on an Evidence names the older Evidence it replaces, `Probes` on a
probe Work item names the Evidence it addresses. `Supersedes` is read only for cycles
(M-30); the other two by nothing. Taken separately, each is the usual cut for a reader-less
field. Taken together they are the lineage of ground truth — measurement forces decisions,
re-measurement replaces measurement, probes produce measurement. The failure they exist to
catch is
this project’s thesis pointed at its own record: an Evidence forces a Decision closed, a
later measurement supersedes that Evidence, and the Decision stands on moved ground with
nothing in the record knowing.

What separates them from a dead field is writers. A field with no writer, no reader and no
grammar is deleted. These have real writers: `Forced by` is written at closing time by the
one person who knows what forced the ruling, and the knowledge exists at no other moment.
Writers real, readers absent is the situation of a live label: declared honestly, kept.

## Candidates

1. **Cut all three.** The no-reader rule applied uniformly. Cost: deletes the record’s own
   lineage while keeping a thesis about detecting exactly this drift.
2. **Collapse into one field.** One `Lineage` key everywhere. Cost: the edges run in
   different directions between different types, so one name would mean a different relation
   depending on its host, moving the semantics into prose. Fields are declared per type
   anyway, so nothing is saved mechanically, and a view still needs to know which edge it is
   traversing.
3. **A rule fires on superseded forcing-Evidence.** Cost: a Decision closed on Evidence that
   later got superseded is not in violation — the closure was correct when made, and
   reopening is a judgment call. The rule would fire red on legitimate history forever.
4. **Evidence created alongside the probe, so the link exists from birth.** Cost: Evidence
   is immutable — the artifact could never be filled in when the measurement arrives, and an
   empty immutable form is a form mistaken for a statement. Abandoned probes would leave
   husks.
5. **Keep all three, a view reads them, probe linking required-with-escape.** Below.

## What would settle it

Whether a superseded forcing-Evidence is wrong-at-write (a rule) or needs-a-look (a view),
and when the Evidence a probe produces comes into existence.

## Closed — 2026-08-23

**Ruling.** All three fields stay separate, none required outright, `read_by` honest — `Forced by` rides the events it explains; the superseded-evidence traversal is a view, not a rule; `Probes` widens to “settles or produced”, and a probe’s Closed requires it — Evidence IDs or the literal `none`.
**Scope.** `spec/format.json`, `spec/v0.md`, `src/rules/**`

**Why candidate 5, and why separate fields.** They are one *feature* but three *relations*.
The collapse that is correct is this Decision and the one view, not the keys.

**Why a view and not a rule.** Wrong-at-write gets a rule; needs-a-look gets a view. A
malformed date or an unresolvable reference is wrong the moment it is written. A superseded forcing-Evidence is history
that deserves attention, and only a human can say whether the ground truly moved.

**Why Evidence is born at probe-close.** Evidence’s immutability decides this, not
preference: the artifact exists only once the measurement completes. The invariant “probes
always create Evidence” is almost true — probes that *ran* always do, since “this cannot be
done” is itself a measurement — but a probe closed moot measured nothing, and with no
Withdrawn event, moot exits through Closed too.

**Why the requirement sits on the declaration, not the artifact.** No rule can tell ran from
didn’t-run except by the link itself, so the Evidence artifact cannot be required. The
declaration can: `Probes` with IDs or `none` costs the moot probe one token, not one husk,
and makes the closing state which case it is. The lineage view gets a machine-traversable
Work-to-Evidence edge exactly where one exists, and a list of probes closed `none` if anyone
asks.

**How it is declared.** A per-value requirement riding `Kind`’s values —
`"probe": { "closed_requires": ["Probes"] }`, `"build": {}` — read by the required-fields
rule; no new rule number. **This is the format’s first per-value field machinery, accepted
knowingly.** The general shape is dangerous — requirements that depend on a field’s value
invite a thicket of special cases — so it arrives guarded twice: the `none` escape means it
never fires on honest history, and the ran-probes invariant means what it catches, a silent
probe-close, is genuinely wrong rather than merely unlinked. It earns no second use by
existing.

**Not ruled here.** What builds the view, whether any view nags about probes closed `none`,
and whether `closed_requires` generalises beyond `Kind` — it is declared on one field’s
values and stays there until something else needs it.
